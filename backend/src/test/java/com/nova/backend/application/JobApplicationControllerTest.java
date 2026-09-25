package com.nova.backend.application;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
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

@SpringBootTest(properties = "nova.demo.api-key=test-application-key")
@AutoConfigureMockMvc
@Transactional
class JobApplicationControllerTest {
    private static final UUID ORG = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final String TOKEN = "b".repeat(43);
    @Autowired MockMvc mvc;
    @Autowired JdbcTemplate jdbc;

    @Test
    void mobileCanApplyAndBusinessCanReviewButNotUseAnInvalidTransition() throws Exception {
        jdbc.update("insert into mobile_sessions(token_hash,organization_id,contractor_id,expires_at) values(?,?,?,now()+interval '1 hour')", MobileController.hashToken(TOKEN), ORG, "contractor-minh-anh");
        UUID jobId = UUID.randomUUID();
        jdbc.update("insert into jobs(id,organization_id,title,category,summary,budget_min_minor,budget_max_minor,location_scope,application_deadline,status) values(?,?,?,?,?,100,200,?,current_date+7,'PUBLISHED')", jobId, ORG, "Flutter Fintech Engineer", "Engineering", "Build the mobile payment flow", "Remote");

        String applicationId = mvc.perform(post("/api/v1/mobile/applications")
                .header("Authorization", "Bearer " + TOKEN).contentType(MediaType.APPLICATION_JSON)
                .content("{\"jobId\":\"" + jobId + "\",\"coverNote\":\"Tôi có kinh nghiệm Flutter và Solana Devnet.\"}"))
            .andExpect(status().isCreated()).andExpect(jsonPath("$.candidateName").value("Minh Anh"))
            .andExpect(jsonPath("$.status").value("submitted"))
            .andReturn().getResponse().getContentAsString().replaceFirst("^\\{\\\"id\\\":\\\"([^\\\"]+)\\\".*", "$1");

        mvc.perform(get("/api/v1/applications").header("X-Nova-Demo-Key", "test-application-key"))
            .andExpect(status().isOk()).andExpect(jsonPath("$[0].id").value(applicationId));
        mvc.perform(patch("/api/v1/applications/{applicationId}/status", applicationId)
                .header("X-Nova-Demo-Key", "test-application-key").contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"shortlisted\",\"note\":\"Mời vào danh sách ngắn\"}"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("shortlisted"));
        mvc.perform(patch("/api/v1/applications/{applicationId}/status", applicationId)
                .header("X-Nova-Demo-Key", "test-application-key").contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"viewed\"}"))
            .andExpect(status().isConflict());
    }

    @Test
    void rejectsSessionImpersonationAndAllowsTheOwnerToWithdraw() throws Exception {
        mvc.perform(get("/api/v1/mobile/applications")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/v1/applications")).andExpect(status().isUnauthorized());
    }
}
