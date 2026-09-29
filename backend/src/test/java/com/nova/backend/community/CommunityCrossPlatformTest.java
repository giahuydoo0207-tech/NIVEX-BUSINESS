package com.nova.backend.community;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.hamcrest.Matchers;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

/**
 * Nova Mobile (/api/v1/posts, /api/v1/mobile/media) and Business Web
 * (/api/v1/community/**) write and read the same community tables, so a post
 * made on one client must look the same on the other.
 */
@SpringBootTest(properties = "nova.demo.api-key=test-community-key")
@AutoConfigureMockMvc
@Transactional
class CommunityCrossPlatformTest {
    private static final String KEY = "test-community-key";
    private static final byte[] PNG = {(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A, 1, 2, 3};
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired JdbcTemplate jdbc;

    @Test
    void mobilePostWithImageAndHashtagReadsIdenticallyOnWeb() throws Exception {
        String token = register("Gia Huy Test");
        String imageUrl = uploadFromMobile(token);
        JsonNode created = json.readTree(mvc.perform(post("/api/v1/posts").header("Authorization", bearer(token))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"content\":\"Bài từ Flutter #flutter\",\"images\":[\"" + imageUrl + "\"],\"topics\":[\"flutter\"]}"))
            .andExpect(status().isCreated())
            .andReturn().getResponse().getContentAsString());
        String postId = created.get("id").asText();

        JsonNode onWeb = find(webFeed(), postId);
        Assertions.assertNotNull(onWeb, "web feed must contain the mobile post");
        Assertions.assertEquals(created.get("content"), onWeb.get("content"));
        Assertions.assertEquals(created.get("author").get("id"), onWeb.get("author").get("id"));
        Assertions.assertEquals(created.get("author").get("avatarUrl"), onWeb.get("author").get("avatarUrl"));
        Assertions.assertEquals(imageUrl, onWeb.get("images").get(0).asText());
        Assertions.assertEquals("flutter", onWeb.get("topics").get(0).asText());
        Assertions.assertEquals(created.get("createdAt"), onWeb.get("createdAt"));
        Assertions.assertEquals(0, onWeb.get("reactionCount").asInt());
        Assertions.assertEquals(0, onWeb.get("commentCount").asInt());
        mvc.perform(get(imageUrl)).andExpect(status().isOk());
    }

    @Test
    void webPostWithUploadedImageReadsOnMobileAndTextOnlyPostsToo() throws Exception {
        String url = json.readTree(mvc.perform(multipart("/api/v1/community/media")
                .file(new MockMultipartFile("file", "a.png", "image/png", PNG)).header("X-Nova-Demo-Key", KEY))
            .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString()).get("url").asText();
        String withImage = id(mvc.perform(post("/api/v1/community/posts").header("X-Nova-Demo-Key", KEY)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"content\":\"Bài từ Business Web\",\"images\":[\"" + url + "\"],\"topics\":[\"tuyendung\"],\"privacy\":\"public\"}"))
            .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString());
        String textOnly = id(mvc.perform(post("/api/v1/community/posts").header("X-Nova-Demo-Key", KEY)
                .contentType(MediaType.APPLICATION_JSON).content("{\"content\":\"Chỉ có chữ\",\"privacy\":\"public\"}"))
            .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString());

        String token = register("Người xem mobile");
        JsonNode feed = mobileFeed(token);
        JsonNode image = find(feed, withImage);
        Assertions.assertNotNull(image);
        Assertions.assertEquals(url, image.get("images").get(0).asText());
        Assertions.assertEquals("Bài từ Business Web", image.get("content").asText());
        JsonNode plain = find(feed, textOnly);
        Assertions.assertNotNull(plain);
        Assertions.assertEquals(0, plain.get("images").size());
    }

    @Test
    void rejectedPostsNeverReachTheFeedAndOnlyOwnUploadsAttach() throws Exception {
        String owner = register("Chủ ảnh");
        String other = register("Người khác");
        String ownersImage = uploadFromMobile(owner);
        int before = count();

        for (String images : new String[] {
            "[\"" + ownersImage + "\"]",
            "[\"https://example.com/a.png\"]",
            "[\"/media/community/00000000-0000-4000-8000-000000000000\"]"}) {
            mvc.perform(post("/api/v1/posts").header("Authorization", bearer(other))
                    .contentType(MediaType.APPLICATION_JSON).content("{\"content\":\"Không được đăng\",\"images\":" + images + "}"))
                .andExpect(status().isBadRequest());
        }
        mvc.perform(post("/api/v1/posts").header("Authorization", bearer(other))
                .contentType(MediaType.APPLICATION_JSON).content("{\"content\":\"   \"}"))
            .andExpect(status().isBadRequest());
        mvc.perform(post("/api/v1/mobile/media").header("Authorization", bearer(owner))
                .contentType(MediaType.IMAGE_PNG).content(new byte[] {1, 2, 3}))
            .andExpect(status().isUnsupportedMediaType());
        mvc.perform(post("/api/v1/mobile/media").contentType(MediaType.IMAGE_PNG).content(PNG))
            .andExpect(status().isUnauthorized());
        Assertions.assertEquals(before, count());
    }

    @Test
    void orphanUploadsCanBeDeletedButAttachedMediaIsKept() throws Exception {
        String token = register("Dọn ảnh");
        String orphan = uploadFromMobile(token);
        String attached = uploadFromMobile(token);
        mvc.perform(post("/api/v1/posts").header("Authorization", bearer(token)).contentType(MediaType.APPLICATION_JSON)
            .content("{\"content\":\"Có ảnh\",\"images\":[\"" + attached + "\"]}")).andExpect(status().isCreated());

        mvc.perform(delete("/api/v1/mobile/media/{id}", uuid(orphan)).header("Authorization", bearer(token)))
            .andExpect(status().isNoContent());
        mvc.perform(delete("/api/v1/mobile/media/{id}", uuid(attached)).header("Authorization", bearer(token)))
            .andExpect(status().isNoContent());
        mvc.perform(get(orphan)).andExpect(status().isNotFound());
        mvc.perform(get(attached)).andExpect(status().isOk());
    }

    @Test
    void nearSimultaneousPostsAreBothKeptNewestFirstWithoutDuplicates() throws Exception {
        String a = register("Thiết bị A");
        String b = register("Thiết bị B");
        String first = createMobile(a, "Bài của thiết bị A");
        String second = createMobile(b, "Bài của thiết bị B");
        // Both requests share one test transaction timestamp; make the order explicit.
        jdbc.update("update community_posts set created_at = now() - interval '1 minute' where id = ?::uuid", first);

        JsonNode feed = mobileFeed(a);
        java.util.List<String> ids = new java.util.ArrayList<>();
        feed.forEach(node -> ids.add(node.get("id").asText()));
        Assertions.assertTrue(ids.indexOf(second) >= 0 && ids.indexOf(second) < ids.indexOf(first), ids.toString());
        Assertions.assertEquals(ids.size(), new java.util.HashSet<>(ids).size(), "refresh must not duplicate posts");
        JsonNode again = mobileFeed(a);
        Assertions.assertEquals(feed.size(), again.size());
    }

    @Test
    void commentsAndReactionsCrossPlatformsAndSurviveANewSession() throws Exception {
        String email = "relogin-" + Long.toUnsignedString(System.nanoTime()) + "@example.test";
        String token = register("Người đăng", email);
        String postId = createMobile(token, "Hỏi cộng đồng");
        mvc.perform(post("/api/v1/posts/{id}/comments", postId).header("Authorization", bearer(token))
            .contentType(MediaType.APPLICATION_JSON).content("{\"content\":\"Bình luận từ Flutter\"}")).andExpect(status().isCreated());
        mvc.perform(put("/api/v1/community/posts/{id}/reaction", postId).header("X-Nova-Demo-Key", KEY)
            .contentType(MediaType.APPLICATION_JSON).content("{\"reaction\":\"LIKE\"}")).andExpect(status().isOk());
        mvc.perform(post("/api/v1/community/posts/{id}/comments", postId).header("X-Nova-Demo-Key", KEY)
            .contentType(MediaType.APPLICATION_JSON).content("{\"content\":\"Trả lời từ Business Web\"}")).andExpect(status().isCreated());

        JsonNode onWeb = find(webFeed(), postId);
        Assertions.assertEquals(1, onWeb.get("reactionCount").asInt());
        Assertions.assertEquals(2, onWeb.get("commentCount").asInt());

        // A new session (log out and back in) still reads everything from the backend.
        String relogin = json.readTree(mvc.perform(post("/api/v1/auth/login/email").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"" + email + "\",\"password\":\"nova-demo-password\"}"))
            .andExpect(status().isOk()).andReturn().getResponse().getContentAsString()).get("accessToken").asText();
        mvc.perform(get("/api/v1/posts/{id}", postId).header("Authorization", bearer(relogin)))
            .andExpect(jsonPath("$.reactionCounts.LIKE").value(1))
            .andExpect(jsonPath("$.commentCount").value(2));
        mvc.perform(get("/api/v1/posts/{id}/comments", postId).header("Authorization", bearer(relogin)))
            .andExpect(jsonPath("$.items[*].content", Matchers.hasItems("Bình luận từ Flutter", "Trả lời từ Business Web")));
    }

    private String uploadFromMobile(String token) throws Exception {
        return json.readTree(mvc.perform(post("/api/v1/mobile/media").header("Authorization", bearer(token))
                .contentType(MediaType.IMAGE_PNG).content(PNG))
            .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString()).get("url").asText();
    }

    private String createMobile(String token, String content) throws Exception {
        return id(mvc.perform(post("/api/v1/posts").header("Authorization", bearer(token))
                .contentType(MediaType.APPLICATION_JSON).content("{\"content\":\"" + content + "\"}"))
            .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString());
    }

    private JsonNode webFeed() throws Exception {
        return json.readTree(mvc.perform(get("/api/v1/community/posts").param("limit", "50").header("X-Nova-Demo-Key", KEY))
            .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
    }

    private JsonNode mobileFeed(String token) throws Exception {
        return json.readTree(mvc.perform(get("/api/v1/posts/feed").param("limit", "25").header("Authorization", bearer(token)))
            .andExpect(status().isOk()).andReturn().getResponse().getContentAsString()).get("items");
    }

    private static JsonNode find(JsonNode posts, String id) {
        for (JsonNode node : posts) if (id.equals(node.get("id").asText())) return node;
        return null;
    }

    private int count() { return jdbc.queryForObject("select count(*) from community_posts", Integer.class); }
    private static String uuid(String url) { return url.substring("/media/community/".length()); }

    private String register(String name) throws Exception {
        return register(name, "x-" + Long.toUnsignedString(System.nanoTime()) + "@example.test");
    }

    private String register(String name, String email) throws Exception {
        String suffix = Long.toUnsignedString(System.nanoTime());
        String body = mvc.perform(post("/api/v1/auth/register/email").contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"email":"%s","phoneE164":"+84905%s","displayName":"%s","password":"nova-demo-password"}
                    """.formatted(email, suffix.substring(Math.max(0, suffix.length() - 7)), name)))
            .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        return json.readTree(body).get("accessToken").asText();
    }

    private String id(String body) throws Exception { return json.readTree(body).get("id").asText(); }
    private String bearer(String token) { return "Bearer " + token; }
}
