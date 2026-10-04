package com.nova.backend.credential;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nova.backend.businessprofile.BusinessProfileRepository;
import com.nova.backend.mobile.MobileSessionAuthenticator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest(properties = "nova.demo.api-key=test-credential-key")
@AutoConfigureMockMvc
@Transactional
class NovaCredentialControllerTest {
    private static final String DEMO_KEY = "test-credential-key";
    private static final UUID ORG_A = BusinessProfileRepository.NOVA_LABS_ID;
    private static final UUID ORG_B = UUID.fromString("00000000-0000-0000-0000-0000000000b2");

    @Autowired MockMvc mvc;
    @Autowired JdbcTemplate jdbc;
    @Autowired NovaCredentialService credentials;
    @Autowired ObjectMapper json;

    @BeforeEach
    void secondOrganization() {
        jdbc.update("insert into organizations (id, legal_name, trading_name, handle, verified) values (?, 'Orbit Studio JSC', 'Orbit Studio', 'orbit-studio-test', false)", ORG_B);
        jdbc.update("insert into business_profiles (organization_id, display_name) values (?, 'Orbit Studio')", ORG_B);
    }

    @Test
    void managementEndpointsRequireTheServerSideDemoKey() throws Exception {
        mvc.perform(get("/api/v1/business/nova-credentials")).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/v1/business/nova-credentials/key")).andExpect(status().isUnauthorized());
        mvc.perform(delete("/api/v1/business/nova-credentials/key")).andExpect(status().isUnauthorized());
    }

    @Test
    void eachOrganizationGetsOneStableWellFormedNovaId() throws Exception {
        JsonNode first = body(mvc.perform(get("/api/v1/business/nova-credentials").header("X-Nova-Demo-Key", DEMO_KEY))
            .andExpect(status().isOk())
            .andExpect(header().string("Cache-Control", "no-store"))
            .andExpect(jsonPath("$.organization.name").value("Nova"))
            .andExpect(jsonPath("$.key.status").value("NOT_CREATED"))
            .andReturn());
        String idA = first.get("novaId").asText();
        String idB = credentials.status(ORG_B).novaId();

        assertThat(idA).matches("^NVB-[2-9A-HJKMNP-Z]{8}$");
        assertThat(idB).matches("^NVB-[2-9A-HJKMNP-Z]{8}$").isNotEqualTo(idA);
        assertThat(credentials.status(ORG_A).novaId()).isEqualTo(idA);
        assertThat(jdbc.queryForObject("select count(*) from organization_nova_credentials where organization_id=?", Integer.class, ORG_A)).isEqualTo(1);

        String rotatedId = issueViaApi().get("credential").get("novaId").asText();
        assertThat(rotatedId).as("rotating the key keeps the Nova ID").isEqualTo(idA);
    }

    @Test
    void generatedIdsAvoidAmbiguousCharactersAndDoNotRepeat() {
        Set<String> ids = new HashSet<>();
        for (int i = 0; i < 2000; i++) ids.add(credentials.newNovaId());
        assertThat(ids).hasSize(2000).allMatch(id -> id.matches("^NVB-[2-9A-HJKMNP-Z]{8}$"));
    }

    // A failed statement aborts the test transaction, so each constraint gets its own test.
    @Test
    void theDatabaseRejectsALowercaseNovaId() {
        String idA = credentials.status(ORG_A).novaId();
        assertThatThrownBy(() -> jdbc.update("insert into organization_nova_credentials (organization_id, public_nova_id) values (?, ?)", ORG_B, idA.toLowerCase()))
            .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void theDatabaseRejectsADuplicateNovaId() {
        String idA = credentials.status(ORG_A).novaId();
        assertThatThrownBy(() -> jdbc.update("insert into organization_nova_credentials (organization_id, public_nova_id) values (?, ?)", ORG_B, idA))
            .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void theKeyIsShownOnceStoredOnlyAsAHashAndVerifiesItsOwnOrganization() throws Exception {
        MvcResult issued = mvc.perform(post("/api/v1/business/nova-credentials/key").header("X-Nova-Demo-Key", DEMO_KEY))
            .andExpect(status().isOk())
            .andExpect(header().string("Cache-Control", "no-store"))
            .andExpect(jsonPath("$.credential.key.status").value("ACTIVE"))
            .andReturn();
        JsonNode issuedBody = body(issued);
        String keyA = issuedBody.get("novaKey").asText();
        String idA = issuedBody.get("credential").get("novaId").asText();
        assertThat(keyA).matches("^nvk_[A-Za-z0-9_-]{43}$");
        assertThat(issuedBody.get("credential").get("key").get("hint").asText()).isEqualTo(keyA.substring(keyA.length() - 4));

        String statusBody = mvc.perform(get("/api/v1/business/nova-credentials").header("X-Nova-Demo-Key", DEMO_KEY))
            .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        assertThat(statusBody).doesNotContain(keyA).doesNotContain(MobileSessionAuthenticator.hashToken(keyA))
            .doesNotContain("novaKey").doesNotContainIgnoringCase("hash");

        Map<String, Object> row = jdbc.queryForMap("select * from organization_nova_credentials where organization_id=?", ORG_A);
        assertThat(row.get("key_hash")).isEqualTo(MobileSessionAuthenticator.hashToken(keyA));
        assertThat(row.values()).noneMatch(value -> value != null && value.toString().contains(keyA.substring(4)));

        verify(idA, keyA).andExpect(status().isOk())
            .andExpect(header().string("Cache-Control", "no-store"))
            .andExpect(jsonPath("$.verified").value(true))
            .andExpect(jsonPath("$.subjectType").value("ORGANIZATION"))
            .andExpect(jsonPath("$.subjectId").value(ORG_A.toString()))
            .andExpect(jsonPath("$.publicNovaId").value(idA))
            .andExpect(jsonPath("$.displayName").value("Nova"))
            .andExpect(jsonPath("$.verifiedAt").isString());
        verify(idA.toLowerCase(), keyA).andExpect(status().isOk());
        assertThat(credentials.status(ORG_A).key().lastUsedAt()).isNotNull();

        NovaCredentialService.IssuedKey issuedB = credentials.issueKey(ORG_B);
        verify(issuedB.credential().novaId(), issuedB.novaKey()).andExpect(jsonPath("$.subjectId").value(ORG_B.toString()));
        // Business A's key never unlocks Business B, and vice versa.
        String crossA = verify(issuedB.credential().novaId(), keyA).andExpect(status().isUnauthorized()).andReturn().getResponse().getContentAsString();
        String crossB = verify(idA, issuedB.novaKey()).andExpect(status().isUnauthorized()).andReturn().getResponse().getContentAsString();
        assertThat(crossA).isEqualTo(crossB);
    }

    @Test
    void everyWrongPairFailsWithTheSameGeneric401() throws Exception {
        NovaCredentialService.IssuedKey issued = credentials.issueKey(ORG_A);
        String id = issued.credential().novaId();
        String key = issued.novaKey();
        String unknownId = "NVB-ZZZZZZZZ".equals(id) ? "NVB-YYYYYYYY" : "NVB-ZZZZZZZZ";
        String randomKey = "nvk_" + "A".repeat(43);
        credentials.issueKey(ORG_A); // rotation: `key` is now stale
        String revokedKey = credentials.issueKey(ORG_B).novaKey();
        String idB = credentials.revokeKey(ORG_B).novaId();

        List<String> bodies = List.of(
            verify(unknownId, key).andExpect(status().isUnauthorized()).andReturn().getResponse().getContentAsString(),
            verify(id, randomKey).andExpect(status().isUnauthorized()).andReturn().getResponse().getContentAsString(),
            verify(id, key).andExpect(status().isUnauthorized()).andReturn().getResponse().getContentAsString(),
            verify(idB, revokedKey).andExpect(status().isUnauthorized()).andReturn().getResponse().getContentAsString(),
            verify("not-a-nova-id", key).andExpect(status().isUnauthorized()).andReturn().getResponse().getContentAsString(),
            verify(id, "nvk_short").andExpect(status().isUnauthorized()).andReturn().getResponse().getContentAsString());
        assertThat(new HashSet<>(bodies)).hasSize(1);
        assertThat(bodies.getFirst()).doesNotContain(id).doesNotContain(key);
    }

    @Test
    void rotationInvalidatesTheOldKeyAndRevocationInvalidatesTheNewOne() throws Exception {
        JsonNode first = issueViaApi();
        String id = first.get("credential").get("novaId").asText();
        String oldKey = first.get("novaKey").asText();
        verify(id, oldKey).andExpect(status().isOk());

        String newKey = issueViaApi().get("novaKey").asText();
        assertThat(newKey).isNotEqualTo(oldKey);
        verify(id, oldKey).andExpect(status().isUnauthorized());
        verify(id, newKey).andExpect(status().isOk());

        mvc.perform(delete("/api/v1/business/nova-credentials/key").header("X-Nova-Demo-Key", DEMO_KEY))
            .andExpect(status().isOk())
            .andExpect(header().string("Cache-Control", "no-store"))
            .andExpect(jsonPath("$.key.status").value("REVOKED"))
            .andExpect(jsonPath("$.key.revokedAt").isString())
            .andExpect(jsonPath("$.novaKey").doesNotExist());
        verify(id, newKey).andExpect(status().isUnauthorized());
        assertThat(jdbc.queryForObject("select key_hash from organization_nova_credentials where organization_id=?", String.class, ORG_A)).isNull();

        mvc.perform(delete("/api/v1/business/nova-credentials/key").header("X-Nova-Demo-Key", DEMO_KEY))
            .andExpect(status().isConflict());
        String reissued = issueViaApi().get("novaKey").asText();
        verify(id, reissued).andExpect(status().isOk());
    }

    @Test
    void missingBlankOrOversizedInputIsRejected() throws Exception {
        String id = credentials.status(ORG_A).novaId();
        String tooLongKey = "nvk_" + "a".repeat(200);
        for (String body : List.of("{}", "{\"novaId\":\"" + id + "\"}", "{\"novaId\":\" \",\"novaKey\":\"nvk_x\"}",
            "{\"novaId\":\"" + "N".repeat(40) + "\",\"novaKey\":\"nvk_x\"}", "{\"novaId\":\"" + id + "\",\"novaKey\":\"" + tooLongKey + "\"}")) {
            String response = mvc.perform(post("/api/v1/nova-credentials/verify").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest()).andReturn().getResponse().getContentAsString();
            assertThat(response).doesNotContain(tooLongKey);
        }
        mvc.perform(post("/api/v1/nova-credentials/verify").contentType(MediaType.APPLICATION_JSON).content("not json"))
            .andExpect(status().isBadRequest());
    }

    private JsonNode issueViaApi() throws Exception {
        return body(mvc.perform(post("/api/v1/business/nova-credentials/key").header("X-Nova-Demo-Key", DEMO_KEY))
            .andExpect(status().isOk()).andReturn());
    }

    private org.springframework.test.web.servlet.ResultActions verify(String novaId, String novaKey) throws Exception {
        return mvc.perform(post("/api/v1/nova-credentials/verify").contentType(MediaType.APPLICATION_JSON)
            .content(json.writeValueAsString(Map.of("novaId", novaId, "novaKey", novaKey))));
    }

    private JsonNode body(MvcResult result) throws Exception {
        return json.readTree(result.getResponse().getContentAsString());
    }
}
