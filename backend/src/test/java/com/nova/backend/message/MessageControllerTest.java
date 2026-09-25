package com.nova.backend.message;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.nova.backend.mobile.MobileController;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest(properties = "nova.demo.api-key=test-message-key")
@AutoConfigureMockMvc
@Transactional
class MessageControllerTest {
    private static final UUID ORG = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final String TOKEN = "c".repeat(43);
    @Autowired MockMvc mvc;
    @Autowired JdbcTemplate jdbc;

    @Test
    void pendingRequestDoesNotExposeSeenUntilBusinessAccepts() throws Exception {
        session("contractor-minh-anh", TOKEN);
        String threadId = request(TOKEN, "Please discuss the Flutter role.");

        mvc.perform(get("/api/v1/messages").param("status", "PENDING").header("X-Nova-Demo-Key", "test-message-key"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].id").value(threadId))
            .andExpect(jsonPath("$[0].messages[0].seenAt").doesNotExist());

        mvc.perform(post("/api/v1/messages/{threadId}/accept", threadId).header("X-Nova-Demo-Key", "test-message-key"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.requestStatus").value("ACCEPTED"));
        mvc.perform(post("/api/v1/messages/{threadId}/messages", threadId).header("X-Nova-Demo-Key", "test-message-key")
                .contentType(MediaType.APPLICATION_JSON).content("{\"body\":\"Your request was accepted.\"}"))
            .andExpect(status().isOk());

        mvc.perform(get("/api/v1/mobile/messages").header("Authorization", "Bearer " + TOKEN))
            .andExpect(status().isOk()).andExpect(jsonPath("$[0].requestStatus").value("ACCEPTED"))
            .andExpect(jsonPath("$[0].messages[1].seenAt").isNotEmpty());
    }

    @Test
    void blockedSenderCannotCreateAnotherRequest() throws Exception {
        session("contractor-minh-anh", TOKEN);
        String threadId = request(TOKEN, "First request.");
        mvc.perform(post("/api/v1/messages/{threadId}/block", threadId).header("X-Nova-Demo-Key", "test-message-key"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.requestStatus").value("BLOCKED"));
        mvc.perform(post("/api/v1/mobile/messages/requests").header("Authorization", "Bearer " + TOKEN)
                .contentType(MediaType.APPLICATION_JSON).content("{\"body\":\"Second request.\"}"))
            .andExpect(status().isForbidden());
    }

    private void session(String contractor, String token) {
        jdbc.update("insert into mobile_sessions(token_hash,organization_id,contractor_id,expires_at) values(?,?,?,now()+interval '1 hour')",
            MobileController.hashToken(token), ORG, contractor);
    }

    private String request(String token, String body) throws Exception {
        return mvc.perform(post("/api/v1/mobile/messages/requests").header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON).content("{\"body\":\"" + body + "\"}"))
            .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString()
            .replaceFirst("^\\{\\\"id\\\":\\\"([^\\\"]+)\\\".*", "$1");
    }
}
