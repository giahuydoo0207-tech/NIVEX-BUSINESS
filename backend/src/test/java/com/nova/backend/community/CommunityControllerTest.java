package com.nova.backend.community;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest(properties = "nova.demo.api-key=test-community-key")
@AutoConfigureMockMvc
@Transactional
class CommunityControllerTest {
    @Autowired MockMvc mvc;

    @Test
    void requiresTheServerSideWorkspaceKey() throws Exception {
        mvc.perform(get("/api/v1/community/posts"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void createsReactsCommentsSavesAndDeletesAnOwnedPost() throws Exception {
        String postId = mvc.perform(post("/api/v1/community/posts")
                .header("X-Nova-Demo-Key", "test-community-key")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"content":"Bản cập nhật thanh toán Devnet đã sẵn sàng.","topics":["Fintech","Mobile"],"privacy":"public"}
                    """))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.content").value("Bản cập nhật thanh toán Devnet đã sẵn sàng."))
            .andExpect(jsonPath("$.author.id").value("nova-labs"))
            .andExpect(jsonPath("$.topics[0]").value("Fintech"))
            .andReturn().getResponse().getContentAsString().replaceFirst("^\\{\\\"id\\\":\\\"([^\\\"]+)\\\".*", "$1");

        mvc.perform(put("/api/v1/community/posts/{postId}/reaction", postId)
                .header("X-Nova-Demo-Key", "test-community-key")
                .contentType(MediaType.APPLICATION_JSON).content("{\"reaction\":\"love\"}"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.myReaction").value("LOVE"))
            .andExpect(jsonPath("$.reactionCount").value(1));

        mvc.perform(post("/api/v1/community/posts/{postId}/comments", postId)
                .header("X-Nova-Demo-Key", "test-community-key")
                .contentType(MediaType.APPLICATION_JSON).content("{\"content\":\"Đã kiểm tra trên thiết bị thật.\"}"))
            .andExpect(status().isCreated()).andExpect(jsonPath("$.author.handle").value("nova-labs"));

        mvc.perform(put("/api/v1/community/posts/{postId}/saved", postId)
                .header("X-Nova-Demo-Key", "test-community-key")
                .contentType(MediaType.APPLICATION_JSON).content("{\"enabled\":true}"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.isSaved").value(true))
            .andExpect(jsonPath("$.comments.length()").value(1));

        mvc.perform(delete("/api/v1/community/posts/{postId}", postId)
                .header("X-Nova-Demo-Key", "test-community-key"))
            .andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/community/posts/{postId}", postId)
                .header("X-Nova-Demo-Key", "test-community-key"))
            .andExpect(status().isNotFound());
    }

    @Test
    void canBlockAProfileAndRejectsInvalidCommunityValues() throws Exception {
        mvc.perform(put("/api/v1/community/profiles/minh-anh/blocked")
                .header("X-Nova-Demo-Key", "test-community-key")
                .contentType(MediaType.APPLICATION_JSON).content("{\"enabled\":true}"))
            .andExpect(status().isNoContent());

        mvc.perform(post("/api/v1/community/posts")
                .header("X-Nova-Demo-Key", "test-community-key")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"content\":\"Bài viết\",\"privacy\":\"friends_only\"}"))
            .andExpect(status().isBadRequest());
    }
}
