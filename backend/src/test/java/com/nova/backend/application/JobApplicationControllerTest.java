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

        mvc.perform(post("/api/v1/mobile/applications")
                .header("Authorization", "Bearer " + TOKEN).contentType(MediaType.APPLICATION_JSON)
                .content("{\"jobId\":\"" + jobId + "\",\"coverNote\":\"Gửi lại lần hai.\"}"))
            .andExpect(status().isConflict());

        mvc.perform(post("/api/v1/mobile/applications/{applicationId}/withdraw", applicationId)
                .header("Authorization", "Bearer " + TOKEN))
            .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("withdrawn"))
            .andExpect(jsonPath("$.organizationName").isNotEmpty());
        String submitted = jdbc.queryForObject("select body from notifications where type='APPLICATION_SUBMITTED' and data->>'applicationId'=?", String.class, applicationId);
        String withdrawn = jdbc.queryForObject("select body from notifications where type='APPLICATION_WITHDRAWN' and data->>'applicationId'=?", String.class, applicationId);
        org.junit.jupiter.api.Assertions.assertTrue(submitted.startsWith("Minh Anh đã ứng tuyển"), submitted);
        org.junit.jupiter.api.Assertions.assertTrue(withdrawn.startsWith("Minh Anh đã rút hồ sơ"), withdrawn);
    }

    private String apply(String title) throws Exception {
        jdbc.update("insert into mobile_sessions(token_hash,organization_id,contractor_id,expires_at) values(?,?,?,now()+interval '1 hour') on conflict do nothing", MobileController.hashToken(TOKEN), ORG, "contractor-minh-anh");
        UUID jobId = UUID.randomUUID();
        jdbc.update("insert into jobs(id,organization_id,title,category,summary,budget_min_minor,budget_max_minor,location_scope,application_deadline,status) values(?,?,?,?,?,100,200,?,current_date+7,'PUBLISHED')", jobId, ORG, title, "Engineering", "Summary", "Remote");
        return mvc.perform(post("/api/v1/mobile/applications")
                .header("Authorization", "Bearer " + TOKEN).contentType(MediaType.APPLICATION_JSON)
                .content("{\"jobId\":\"" + jobId + "\",\"coverNote\":\"Xin ứng tuyển.\"}"))
            .andExpect(status().isCreated()).andExpect(jsonPath("$.status").value("submitted"))
            .andReturn().getResponse().getContentAsString().replaceFirst("^\\{\\\"id\\\":\\\"([^\\\"]+)\\\".*", "$1");
    }

    private void businessSets(String applicationId, String status, int expected) throws Exception {
        mvc.perform(patch("/api/v1/applications/{applicationId}/status", applicationId)
                .header("X-Nova-Demo-Key", "test-application-key").contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"" + status + "\"}"))
            .andExpect(status().is(expected));
    }

    @Test
    void acceptNotifiesTheCandidateWithJobAndOrganization() throws Exception {
        String applicationId = apply("Mobile Engineer");
        businessSets(applicationId, "accepted", 200);

        var row = jdbc.queryForMap("select title, body, data->>'status' status, data->>'jobTitle' job, data->>'jobId' job_id, data->>'organizationName' org, read_at "
            + "from notifications where recipient_type='TALENT' and contractor_id='contractor-minh-anh' and data->>'applicationId'=?", applicationId);
        org.junit.jupiter.api.Assertions.assertEquals("Bạn đã được nhận", row.get("title"));
        org.junit.jupiter.api.Assertions.assertEquals("accepted", row.get("status"));
        org.junit.jupiter.api.Assertions.assertEquals("Mobile Engineer", row.get("job"));
        org.junit.jupiter.api.Assertions.assertNotNull(row.get("job_id"));
        org.junit.jupiter.api.Assertions.assertNotNull(row.get("org"));
        org.junit.jupiter.api.Assertions.assertTrue(((String) row.get("body")).contains("Mobile Engineer"), (String) row.get("body"));
        org.junit.jupiter.api.Assertions.assertNull(row.get("read_at"));
        mvc.perform(get("/api/v1/mobile/applications").header("Authorization", "Bearer " + TOKEN))
            .andExpect(jsonPath("$[?(@.id=='" + applicationId + "')].status").value(org.hamcrest.Matchers.hasItem("accepted")));
    }

    @Test
    void rejectSetsRejectedAndTheBusinessCannotWithdrawForTheCandidate() throws Exception {
        String applicationId = apply("Designer");
        businessSets(applicationId, "withdrawn", 400);
        businessSets(applicationId, "rejected", 200);
        String title = jdbc.queryForObject("select title from notifications where recipient_type='TALENT' and data->>'applicationId'=?", String.class, applicationId);
        org.junit.jupiter.api.Assertions.assertEquals("Hồ sơ chưa được chọn", title);
        mvc.perform(post("/api/v1/mobile/applications/{applicationId}/withdraw", applicationId)
                .header("Authorization", "Bearer " + TOKEN))
            .andExpect(status().isConflict());
    }

    @Test
    void chatAndTypingDoNotChangeTheApplicationStatus() throws Exception {
        String applicationId = apply("Backend Engineer");
        String threadId = mvc.perform(post("/api/v1/mobile/messages/requests")
                .header("Authorization", "Bearer " + TOKEN).contentType(MediaType.APPLICATION_JSON)
                .content("{\"body\":\"Chào doanh nghiệp\"}"))
            .andExpect(status().isCreated())
            .andReturn().getResponse().getContentAsString().replaceFirst("^\\{\\\"id\\\":\\\"([^\\\"]+)\\\".*", "$1");
        mvc.perform(post("/api/v1/messages/{id}/accept", threadId).header("X-Nova-Demo-Key", "test-application-key"))
            .andExpect(status().isOk());

        mvc.perform(post("/api/v1/mobile/messages/{id}/typing", threadId).header("Authorization", "Bearer " + TOKEN))
            .andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/messages/{id}/typing", threadId).header("X-Nova-Demo-Key", "test-application-key"))
            .andExpect(jsonPath("$.typing").value(true));
        mvc.perform(post("/api/v1/mobile/messages/{id}/messages", threadId)
                .header("Authorization", "Bearer " + TOKEN).contentType(MediaType.APPLICATION_JSON)
                .content("{\"body\":\"Em đã gửi hồ sơ\"}"))
            .andExpect(status().isOk());
        // Sending a message ends the typing state immediately.
        mvc.perform(get("/api/v1/messages/{id}/typing", threadId).header("X-Nova-Demo-Key", "test-application-key"))
            .andExpect(jsonPath("$.typing").value(false));
        mvc.perform(post("/api/v1/messages/{id}/messages", threadId)
                .header("X-Nova-Demo-Key", "test-application-key").contentType(MediaType.APPLICATION_JSON)
                .content("{\"body\":\"Cảm ơn bạn\"}"))
            .andExpect(status().isOk());

        String status = jdbc.queryForObject("select status from job_applications where id=?::uuid", String.class, applicationId);
        org.junit.jupiter.api.Assertions.assertEquals("submitted", status);
        mvc.perform(get("/api/v1/mobile/messages/{id}/typing", UUID.randomUUID()).header("Authorization", "Bearer " + TOKEN))
            .andExpect(status().isForbidden());
    }

    @Test
    void rejectsSessionImpersonationAndAllowsTheOwnerToWithdraw() throws Exception {
        mvc.perform(get("/api/v1/mobile/applications")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/v1/applications")).andExpect(status().isUnauthorized());
    }
}
