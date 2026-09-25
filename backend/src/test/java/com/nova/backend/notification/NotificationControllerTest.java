package com.nova.backend.notification;

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
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest(properties = "nova.demo.api-key=test-notification-key")
@AutoConfigureMockMvc
@Transactional
class NotificationControllerTest {
    private static final UUID ORG = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final String TOKEN = "d".repeat(43);
    @Autowired MockMvc mvc;
    @Autowired JdbcTemplate jdbc;

    @Test
    void isolatesBusinessAndMobileNotificationsAndMarksOnlyTheirOwnItemRead() throws Exception {
        jdbc.update("insert into mobile_sessions(token_hash,organization_id,contractor_id,expires_at) values(?,?,?,now()+interval '1 hour')", MobileController.hashToken(TOKEN), ORG, "contractor-minh-anh");
        UUID businessId = UUID.randomUUID();
        UUID talentId = UUID.randomUUID();
        jdbc.update("insert into notifications(id,recipient_type,organization_id,type,title,body) values(?,'BUSINESS',?,'MESSAGE_REQUEST','New request','Pending message')", businessId, ORG);
        jdbc.update("insert into notifications(id,recipient_type,contractor_id,type,title,body) values(?,'TALENT','contractor-minh-anh','APPLICATION_STATUS','Application updated','Shortlisted')", talentId);

        mvc.perform(get("/api/v1/notifications").header("X-Nova-Demo-Key", "test-notification-key"))
            .andExpect(status().isOk()).andExpect(jsonPath("$[0].id").value(businessId.toString()));
        mvc.perform(get("/api/v1/mobile/notifications").header("Authorization", "Bearer " + TOKEN))
            .andExpect(status().isOk()).andExpect(jsonPath("$[0].id").value(talentId.toString()));
        mvc.perform(post("/api/v1/notifications/{id}/read", businessId).header("X-Nova-Demo-Key", "test-notification-key"))
            .andExpect(status().isOk());
        mvc.perform(get("/api/v1/notifications").header("X-Nova-Demo-Key", "test-notification-key"))
            .andExpect(jsonPath("$[0].readAt").isNotEmpty());
    }
}
