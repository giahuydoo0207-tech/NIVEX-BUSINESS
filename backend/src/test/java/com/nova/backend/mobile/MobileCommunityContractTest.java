package com.nova.backend.mobile;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

/** Pins the JSON contract Nova Mobile parses and the privacy rules of the shared community tables. */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class MobileCommunityContractTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;

    @Test
    void commentsAlwaysCarryReactionCountsAndReplies() throws Exception {
        String author = register("Tác Giả");
        String postId = id(mvc.perform(post("/api/v1/posts").header("Authorization", bearer(author))
                .contentType(MediaType.APPLICATION_JSON).content("{\"content\":\"Bài viết kiểm thử\"}"))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.reactionCount").value(0))
            .andExpect(jsonPath("$.reactionCounts").isMap())
            .andReturn().getResponse().getContentAsString());

        String commentId = id(mvc.perform(post("/api/v1/posts/{id}/comments", postId).header("Authorization", bearer(author))
                .contentType(MediaType.APPLICATION_JSON).content("{\"content\":\"Bình luận gốc\"}"))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.reactionCount").value(0))
            .andExpect(jsonPath("$.reactionCounts").isMap())
            .andExpect(jsonPath("$.replies").isArray())
            .andExpect(jsonPath("$.replies").isEmpty())
            .andReturn().getResponse().getContentAsString());

        mvc.perform(post("/api/v1/posts/comments/{id}/reactions", commentId).header("Authorization", bearer(author))
                .contentType(MediaType.APPLICATION_JSON).content("{\"type\":\"INSIGHTFUL\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.reactionCount").value(1))
            .andExpect(jsonPath("$.reactionCounts.INSIGHTFUL").value(1))
            .andExpect(jsonPath("$.myReaction").value("INSIGHTFUL"));

        mvc.perform(post("/api/v1/posts/comments/{id}/reactions", commentId).header("Authorization", bearer(author))
                .contentType(MediaType.APPLICATION_JSON).content("{}"))
            .andExpect(status().isBadRequest());
    }

    @Test
    void profileWallHidesPrivatePostsFromOtherMembersAndDeleteIsShared() throws Exception {
        String owner = register("Chủ Tường");
        String viewer = register("Người Xem");
        String ownerId = json.readTree(mvc.perform(get("/api/v1/profile/me").header("Authorization", bearer(owner)))
            .andReturn().getResponse().getContentAsString()).get("id").asText();

        mvc.perform(post("/api/v1/posts").header("Authorization", bearer(owner))
                .contentType(MediaType.APPLICATION_JSON).content("{\"content\":\"Công khai\"}"))
            .andExpect(status().isCreated());
        String privateId = id(mvc.perform(post("/api/v1/posts").header("Authorization", bearer(owner))
                .contentType(MediaType.APPLICATION_JSON).content("{\"content\":\"Riêng tư\",\"privacy\":\"ONLY_ME\"}"))
            .andExpect(status().isCreated()).andExpect(jsonPath("$.privacy").value("ONLY_ME"))
            .andReturn().getResponse().getContentAsString());

        mvc.perform(get("/api/v1/profile/{id}", ownerId).header("Authorization", bearer(viewer)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.posts.length()").value(1))
            .andExpect(jsonPath("$.posts[0].content").value("Công khai"));
        mvc.perform(get("/api/v1/profile/{id}", ownerId).header("Authorization", bearer(owner)))
            .andExpect(jsonPath("$.posts.length()").value(2));
        mvc.perform(get("/api/v1/posts/{id}", privateId).header("Authorization", bearer(viewer)))
            .andExpect(status().isNotFound());

        mvc.perform(patch("/api/v1/posts/{id}", privateId).header("Authorization", bearer(owner))
                .contentType(MediaType.APPLICATION_JSON).content("{\"privacy\":\"PUBLIC\"}"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.privacy").value("PUBLIC"));
        mvc.perform(delete("/api/v1/posts/{id}", privateId).header("Authorization", bearer(viewer)))
            .andExpect(status().isForbidden());
        mvc.perform(delete("/api/v1/posts/{id}", privateId).header("Authorization", bearer(owner)))
            .andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/posts/{id}", privateId).header("Authorization", bearer(owner)))
            .andExpect(status().isNotFound());
    }

    private String register(String name) throws Exception {
        String suffix = Long.toUnsignedString(System.nanoTime());
        String body = mvc.perform(post("/api/v1/auth/register/email").contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"email":"c-%s@example.test","phoneE164":"+84904%s","displayName":"%s","password":"nova-demo-password"}
                    """.formatted(suffix, suffix.substring(Math.max(0, suffix.length() - 7)), name)))
            .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        return json.readTree(body).get("accessToken").asText();
    }

    private String id(String body) throws Exception { return json.readTree(body).get("id").asText(); }
    private String bearer(String token) { return "Bearer " + token; }
}
