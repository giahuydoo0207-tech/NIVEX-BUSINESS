package com.nova.backend.replyn;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nova.backend.TestRecipients;
import com.nova.backend.mobile.MobileSessionAuthenticator;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest(properties = ReplynPairingControllerTest.CLIENT_SECRET_PROPERTY)
@AutoConfigureMockMvc
@Transactional
@ExtendWith(OutputCaptureExtension.class)
class ReplynPairingControllerTest {
    static final String CLIENT_SECRET = "test-only-replyn-client-secret-0123456789";
    static final String CLIENT_SECRET_PROPERTY = "nova.replyn.qr-client-secret=" + CLIENT_SECRET;
    private static final String CREATE = "/api/v1/integrations/replyn/pairings";
    private static final String TOKEN = "q".repeat(43);
    private static final String OTHER_TOKEN = "w".repeat(43);
    private static final String OTHER_CONTRACTOR = "contractor-replyn-other";

    @Autowired MockMvc mvc;
    @Autowired JdbcTemplate jdbc;
    @Autowired ObjectMapper json;

    @BeforeEach
    void sessions() {
        jdbc.update("insert into talent_profiles(contractor_id,display_name,headline) values(?,'Other Talent','Designer')", OTHER_CONTRACTOR);
        session(TestRecipients.CONTRACTOR, TOKEN);
        session(OTHER_CONTRACTOR, OTHER_TOKEN);
    }

    @Test
    void createReturnsTwoIndependentSecretsAndStoresOnlyTheirHashes() throws Exception {
        JsonNode created = body(create(CLIENT_SECRET).andExpect(status().isCreated())
            .andExpect(header().stringValues("Cache-Control", "no-store"))
            .andExpect(jsonPath("$.action").value("login")));
        String id = created.get("pairingId").asText();
        String qrSecret = created.get("qrSecret").asText();
        String browserSecret = created.get("browserSecret").asText();
        assertThat(UUID.fromString(id).toString()).isEqualTo(id);
        assertThat(qrSecret).matches("^[A-Za-z0-9_-]{43}$").isNotEqualTo(browserSecret);
        assertThat(browserSecret).matches("^[A-Za-z0-9_-]{43}$");

        Map<String, Object> row = jdbc.queryForMap("select * from replyn_pairings where id=?::uuid", id);
        assertThat(row.get("status")).isEqualTo("PENDING");
        assertThat(row.get("action")).isEqualTo("LOGIN");
        assertThat(row.get("client_id")).isEqualTo("replyn");
        assertThat(row.get("qr_secret_hash")).isEqualTo(MobileSessionAuthenticator.hashToken(qrSecret));
        assertThat(row.get("browser_secret_hash")).isEqualTo(MobileSessionAuthenticator.hashToken(browserSecret));
        assertThat(row.values()).noneMatch(value -> value != null && (value.toString().contains(qrSecret) || value.toString().contains(browserSecret)));
        assertThat(row.get("contractor_id")).isNull();

        Instant createdAt = ((java.sql.Timestamp) row.get("created_at")).toInstant();
        Instant expiresAt = ((java.sql.Timestamp) row.get("expires_at")).toInstant();
        assertThat(Duration.between(createdAt, expiresAt)).isEqualTo(Duration.ofSeconds(60));
        assertThat(Instant.parse(created.get("expiresAt").asText())).isEqualTo(expiresAt);
    }

    @Test
    void theFullFlowApprovesWithTheMobileSessionAndConsumesOnce(CapturedOutput output) throws Exception {
        JsonNode created = body(create(CLIENT_SECRET).andExpect(status().isCreated()));
        String id = created.get("pairingId").asText();
        String qrSecret = created.get("qrSecret").asText();
        String browserSecret = created.get("browserSecret").asText();

        consume(id, CLIENT_SECRET, browserSecret).andExpect(status().isAccepted())
            .andExpect(header().string("Cache-Control", "no-store"))
            .andExpect(jsonPath("$.status").value("PENDING"))
            .andExpect(jsonPath("$.identity").doesNotExist());

        approve(id, TOKEN, qrSecret).andExpect(status().isOk())
            .andExpect(header().stringValues("Cache-Control", "no-store"))
            .andExpect(jsonPath("$.status").value("APPROVED"));
        Map<String, Object> approved = jdbc.queryForMap("select * from replyn_pairings where id=?::uuid", id);
        assertThat(approved.get("status")).isEqualTo("APPROVED");
        assertThat(approved.get("contractor_id")).isEqualTo(TestRecipients.CONTRACTOR);
        assertThat(approved.get("display_name")).isEqualTo("Minh Anh");

        String consumed = consume(id, CLIENT_SECRET, browserSecret).andExpect(status().isOk())
            .andExpect(header().stringValues("Cache-Control", "no-store"))
            .andExpect(jsonPath("$.status").value("CONSUMED"))
            .andExpect(jsonPath("$.identity.provider").value("NOVA"))
            .andExpect(jsonPath("$.identity.subjectType").value("TALENT"))
            .andExpect(jsonPath("$.identity.subjectId").value(TestRecipients.CONTRACTOR))
            .andExpect(jsonPath("$.identity.displayName").value("Minh Anh"))
            .andExpect(jsonPath("$.identity.role").value("freelancer"))
            .andExpect(jsonPath("$.approvedAt").isString())
            .andReturn().getResponse().getContentAsString();
        assertThat(consumed).doesNotContain("novaId").doesNotContain("publicNovaId").doesNotContain(TOKEN)
            .doesNotContain(qrSecret).doesNotContain(browserSecret);
        assertThat(jdbc.queryForObject("select status from replyn_pairings where id=?::uuid", String.class, id)).isEqualTo("CONSUMED");

        consume(id, CLIENT_SECRET, browserSecret).andExpect(status().isConflict())
            .andExpect(jsonPath("$.status").value("ALREADY_USED"));
        approve(id, TOKEN, qrSecret).andExpect(status().isConflict());
        assertThat(output.getAll()).doesNotContain(qrSecret).doesNotContain(browserSecret).doesNotContain(TOKEN).doesNotContain(CLIENT_SECRET);
    }

    @Test
    void theIdentityComesFromTheSessionAndASecondApprovalIsRejected() throws Exception {
        JsonNode created = body(create(CLIENT_SECRET));
        String id = created.get("pairingId").asText();
        String qrSecret = created.get("qrSecret").asText();

        // Extra identity fields from the client are ignored.
        mvc.perform(post("/api/v1/mobile/replyn/pairings/" + id + "/approve").header("Authorization", "Bearer " + OTHER_TOKEN)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of("qrSecret", qrSecret, "contractorId", TestRecipients.CONTRACTOR, "displayName", "Spoofed"))))
            .andExpect(status().isOk());
        approve(id, TOKEN, qrSecret).andExpect(status().isConflict()).andExpect(jsonPath("$.status").value("ALREADY_USED"));
        approve(id, OTHER_TOKEN, qrSecret).andExpect(status().isConflict());

        consume(id, CLIENT_SECRET, created.get("browserSecret").asText()).andExpect(status().isOk())
            .andExpect(jsonPath("$.identity.subjectId").value(OTHER_CONTRACTOR))
            .andExpect(jsonPath("$.identity.displayName").value("Other Talent"));
    }

    @Test
    void expiredChallengesCanNeitherBeApprovedNorConsumed() throws Exception {
        JsonNode created = body(create(CLIENT_SECRET));
        String id = created.get("pairingId").asText();
        expire(id);
        approve(id, TOKEN, created.get("qrSecret").asText()).andExpect(status().isGone())
            .andExpect(header().string("Cache-Control", "no-store"))
            .andExpect(jsonPath("$.status").value("EXPIRED"));
        consume(id, CLIENT_SECRET, created.get("browserSecret").asText()).andExpect(status().isGone());
        assertThat(jdbc.queryForObject("select status from replyn_pairings where id=?::uuid", String.class, id)).isEqualTo("EXPIRED");
    }

    @Test
    void anApprovedChallengeThatExpiresBeforeConsumptionIsGone() throws Exception {
        JsonNode created = body(create(CLIENT_SECRET));
        String id = created.get("pairingId").asText();
        approve(id, TOKEN, created.get("qrSecret").asText()).andExpect(status().isOk());
        expire(id);
        consume(id, CLIENT_SECRET, created.get("browserSecret").asText()).andExpect(status().isGone())
            .andExpect(jsonPath("$.identity").doesNotExist());
    }

    @Test
    void wrongSecretsAndUnknownIdsAllLookLikeNotFound() throws Exception {
        JsonNode created = body(create(CLIENT_SECRET));
        String id = created.get("pairingId").asText();
        String qrSecret = created.get("qrSecret").asText();
        String browserSecret = created.get("browserSecret").asText();
        String wrong = "A".repeat(43);

        String wrongQr = approve(id, TOKEN, wrong).andExpect(status().isNotFound()).andReturn().getResponse().getContentAsString();
        String unknown = approve(UUID.randomUUID().toString(), TOKEN, qrSecret).andExpect(status().isNotFound()).andReturn().getResponse().getContentAsString();
        assertThat(wrongQr).isEqualTo(unknown);
        approve("not-a-uuid", TOKEN, qrSecret).andExpect(status().isNotFound());
        // The browser secret never approves, and the QR secret never consumes.
        approve(id, TOKEN, browserSecret).andExpect(status().isNotFound());
        approve(id, TOKEN, qrSecret).andExpect(status().isOk());
        consume(id, CLIENT_SECRET, qrSecret).andExpect(status().isNotFound());
        consume(id, CLIENT_SECRET, wrong).andExpect(status().isNotFound());
        consume(UUID.randomUUID().toString(), CLIENT_SECRET, browserSecret).andExpect(status().isNotFound());
        assertThat(jdbc.queryForObject("select status from replyn_pairings where id=?::uuid", String.class, id)).isEqualTo("APPROVED");

        for (String malformed : new String[] {"short", "A".repeat(44), "A".repeat(42) + "="}) {
            approve(id, TOKEN, malformed).andExpect(status().isBadRequest());
            consume(id, CLIENT_SECRET, malformed).andExpect(status().isBadRequest());
        }
        mvc.perform(post("/api/v1/mobile/replyn/pairings/" + id + "/approve").header("Authorization", "Bearer " + TOKEN)
                .contentType(MediaType.APPLICATION_JSON).content("not json"))
            .andExpect(status().isBadRequest())
            .andExpect(header().string("Cache-Control", "no-store"));
    }

    @Test
    void approvalRequiresAValidMobileSession() throws Exception {
        JsonNode created = body(create(CLIENT_SECRET));
        String id = created.get("pairingId").asText();
        String qrSecret = created.get("qrSecret").asText();
        jdbc.update("insert into mobile_sessions(token_hash,organization_id,contractor_id,expires_at,revoked_at) values(?,?,?,now()+interval '1 hour',now())",
            MobileSessionAuthenticator.hashToken("r".repeat(43)), TestRecipients.ORG, TestRecipients.CONTRACTOR);
        jdbc.update("insert into mobile_sessions(token_hash,organization_id,contractor_id,expires_at) values(?,?,?,now()-interval '1 second')",
            MobileSessionAuthenticator.hashToken("e".repeat(43)), TestRecipients.ORG, TestRecipients.CONTRACTOR);

        for (String token : new String[] {"z".repeat(43), "r".repeat(43), "e".repeat(43), "short"}) {
            approve(id, token, qrSecret).andExpect(status().isUnauthorized())
                .andExpect(header().string("Cache-Control", "no-store"))
                .andExpect(jsonPath("$.status").value("UNAUTHORIZED"));
        }
        mvc.perform(post("/api/v1/mobile/replyn/pairings/" + id + "/approve").contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of("qrSecret", qrSecret))))
            .andExpect(status().isUnauthorized());
        assertThat(jdbc.queryForObject("select status from replyn_pairings where id=?::uuid", String.class, id)).isEqualTo("PENDING");
    }

    @Test
    void integrationEndpointsRequireTheClientSecret() throws Exception {
        JsonNode created = body(create(CLIENT_SECRET));
        String id = created.get("pairingId").asText();
        String browserSecret = created.get("browserSecret").asText();
        for (String secret : new String[] {null, "", CLIENT_SECRET + "x", CLIENT_SECRET.substring(1), "test-demo-key"}) {
            create(secret).andExpect(status().isUnauthorized()).andExpect(header().string("Cache-Control", "no-store"));
            consume(id, secret, browserSecret).andExpect(status().isUnauthorized());
        }
        // The mobile access token is not a Replyn client credential either.
        mvc.perform(post(CREATE).header("Authorization", "Bearer " + TOKEN)).andExpect(status().isUnauthorized());
        // now() is the test transaction's start time, so this counts only rows created by this test.
        assertThat(jdbc.queryForObject("select count(*) from replyn_pairings where created_at=now()", Integer.class)).isEqualTo(1);
        create(CLIENT_SECRET).andExpect(status().isCreated());
        mvc.perform(post(CREATE).header(ReplynClientAuthenticator.HEADER, CLIENT_SECRET).contentType(MediaType.APPLICATION_JSON)
                .content("{\"action\":\"pay\"}"))
            .andExpect(status().isBadRequest());
    }

    @Test
    void creatingAChallengeCleansUpLongExpiredOnes() throws Exception {
        String old = body(create(CLIENT_SECRET)).get("pairingId").asText();
        jdbc.update("update replyn_pairings set created_at=now()-interval '3 hours', expires_at=now()-interval '2 hours', status='EXPIRED' where id=?::uuid", old);
        String recent = body(create(CLIENT_SECRET)).get("pairingId").asText();
        expire(recent);
        create(CLIENT_SECRET).andExpect(status().isCreated());
        assertThat(jdbc.queryForObject("select count(*) from replyn_pairings where id=?::uuid", Integer.class, old)).isZero();
        assertThat(jdbc.queryForObject("select count(*) from replyn_pairings where id=?::uuid", Integer.class, recent)).isOne();
    }

    @Test
    void anUnsetOrShortClientSecretDisablesTheIntegration() {
        assertThat(new ReplynClientAuthenticator("").configured()).isFalse();
        assertThat(new ReplynClientAuthenticator("too-short").configured()).isFalse();
        assertThat(new ReplynClientAuthenticator("too-short").matches("too-short")).isFalse();
        ReplynClientAuthenticator configured = new ReplynClientAuthenticator(CLIENT_SECRET);
        assertThat(configured.matches(CLIENT_SECRET)).isTrue();
        assertThat(configured.matches(null)).isFalse();
        assertThat(configured.matches(CLIENT_SECRET.toUpperCase())).isFalse();
    }

    private void session(String contractorId, String token) {
        jdbc.update("insert into mobile_sessions(token_hash,organization_id,contractor_id,expires_at) values(?,?,?,now()+interval '1 hour')",
            MobileSessionAuthenticator.hashToken(token), TestRecipients.ORG, contractorId);
    }

    private void expire(String id) {
        jdbc.update("update replyn_pairings set created_at=now()-interval '61 seconds', expires_at=now()-interval '1 second' where id=?::uuid", id);
    }

    private ResultActions create(String secret) throws Exception {
        var request = post(CREATE).contentType(MediaType.APPLICATION_JSON).content("{\"action\":\"login\"}");
        if (secret != null) request.header(ReplynClientAuthenticator.HEADER, secret);
        return mvc.perform(request);
    }

    private ResultActions approve(String id, String token, String qrSecret) throws Exception {
        return mvc.perform(post("/api/v1/mobile/replyn/pairings/" + id + "/approve").header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(Map.of("qrSecret", qrSecret))));
    }

    private ResultActions consume(String id, String secret, String browserSecret) throws Exception {
        var request = post(CREATE + "/" + id + "/consume").contentType(MediaType.APPLICATION_JSON)
            .content(json.writeValueAsString(Map.of("browserSecret", browserSecret)));
        if (secret != null) request.header(ReplynClientAuthenticator.HEADER, secret);
        return mvc.perform(request);
    }

    private JsonNode body(ResultActions result) throws Exception {
        return json.readTree(result.andReturn().getResponse().getContentAsString());
    }
}
