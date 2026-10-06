package com.nova.backend.replyn;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nova.backend.TestRecipients;
import com.nova.backend.mobile.MobileSessionAuthenticator;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest(properties = {ReplynProposalControllerTest.DEMO_KEY_PROPERTY, ReplynPairingControllerTest.CLIENT_SECRET_PROPERTY})
@AutoConfigureMockMvc
@Transactional
class ReplynProposalControllerTest {
    static final String DEMO_KEY = "test-proposal-key";
    static final String DEMO_KEY_PROPERTY = "nova.demo.api-key=" + DEMO_KEY;
    private static final String TOKEN = "p".repeat(43);
    private static final String OTHER_TOKEN = "o".repeat(43);
    private static final String OTHER_CONTRACTOR = "contractor-proposal-other";
    private static final String LOOKUP = "/api/v1/integrations/replyn/workspaces/lookup";

    @Autowired MockMvc mvc;
    @Autowired JdbcTemplate jdbc;
    @Autowired ObjectMapper json;
    private UUID thread;

    @BeforeEach
    void conversation() {
        jdbc.update("insert into talent_profiles(contractor_id,display_name,headline) values(?,'Other Talent','Designer')", OTHER_CONTRACTOR);
        session(TestRecipients.CONTRACTOR, TOKEN);
        session(OTHER_CONTRACTOR, OTHER_TOKEN);
        thread = acceptedThread(TestRecipients.CONTRACTOR);
    }

    @Test
    void sentProposalReachesTalentAndAcceptanceOpensOneSharedWorkspace() throws Exception {
        JsonNode sent = body(create(proposal(), true).andExpect(status().isCreated())
            .andExpect(jsonPath("$.status").value("PENDING"))
            .andExpect(jsonPath("$.sentAt").isNotEmpty())
            .andExpect(jsonPath("$.workspaceId").doesNotExist()));
        String proposalId = sent.get("id").asText();

        mvc.perform(get("/api/v1/messages").param("status", "ACCEPTED").header("X-Nova-Demo-Key", DEMO_KEY))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].replynProposals[0].id").value(proposalId));
        mvc.perform(get("/api/v1/mobile/messages").header("Authorization", "Bearer " + TOKEN))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].replynProposals[0].status").value("PENDING"))
            .andExpect(jsonPath("$[0].replynProposals[0].milestones.length()").value(2))
            // The proposal is a card, not a fake chat message.
            .andExpect(jsonPath("$[0].messages.length()").value(0));
        assertThat(jdbc.queryForObject("select count(*) from notifications where type='REPLYN_PROPOSAL' and contractor_id=?",
            Integer.class, TestRecipients.CONTRACTOR)).isEqualTo(1);

        JsonNode accepted = body(respond(TOKEN, proposalId, "accept", null).andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("ACCEPTED"))
            .andExpect(jsonPath("$.acceptedAt").isNotEmpty()));
        String workspaceId = accepted.get("workspaceId").asText();
        assertThat(jdbc.queryForObject("select count(*) from notifications where type='REPLYN_PROPOSAL_ACCEPTED' and data->>'threadId'=?",
            Integer.class, thread.toString())).isEqualTo(1);

        // Both parties resolve the same workspace; neither payload carries internal profile ids.
        lookup("TALENT", TestRecipients.CONTRACTOR, workspaceId).andExpect(status().isOk())
            .andExpect(jsonPath("$.workspaces[0].workspaceId").value(workspaceId))
            .andExpect(jsonPath("$.workspaces[0].proposalId").value(proposalId))
            .andExpect(jsonPath("$.workspaces[0].sourceThreadId").doesNotExist())
            .andExpect(jsonPath("$.workspaces[0].viewerRole").value("freelancer"))
            .andExpect(jsonPath("$.workspaces[0].freelancerName").isNotEmpty())
            .andExpect(jsonPath("$.workspaces[0].contractorId").doesNotExist());
        lookup("ORGANIZATION", TestRecipients.ORG.toString(), workspaceId).andExpect(status().isOk())
            .andExpect(jsonPath("$.workspaces[0].workspaceId").value(workspaceId))
            .andExpect(jsonPath("$.workspaces[0].sourceThreadId").value(thread.toString()))
            .andExpect(jsonPath("$.workspaces[0].viewerRole").value("business"))
            .andExpect(jsonPath("$.workspaces[0].organizationId").doesNotExist());
        // Someone else's workspace looks like one that does not exist.
        lookup("TALENT", OTHER_CONTRACTOR, workspaceId).andExpect(status().isNotFound());
        lookup("TALENT", OTHER_CONTRACTOR, null).andExpect(status().isOk()).andExpect(jsonPath("$.workspaces.length()").value(0));
    }

    @Test
    void draftsStayPrivateAndOnlyDraftsCanBeEdited() throws Exception {
        Map<String, Object> draft = new LinkedHashMap<>(Map.of("projectName", "Landing page"));
        String id = body(create(draft, false).andExpect(status().isCreated()).andExpect(jsonPath("$.status").value("DRAFT"))).get("id").asText();
        mvc.perform(get("/api/v1/mobile/messages").header("Authorization", "Bearer " + TOKEN))
            .andExpect(jsonPath("$[0].replynProposals.length()").value(0))
            .andExpect(jsonPath("$[0].businessMuted").value(false));
        respond(TOKEN, id, "accept", null).andExpect(status().isNotFound());

        // Sending an incomplete draft reports every missing field.
        business(post(base() + "/{id}/send", id)).andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.status").value("VALIDATION_FAILED"))
            .andExpect(jsonPath("$.errors.scope").isNotEmpty())
            .andExpect(jsonPath("$.errors.deliverables").isNotEmpty())
            .andExpect(jsonPath("$.errors.totalAmount").isNotEmpty())
            .andExpect(jsonPath("$.errors.milestones").isNotEmpty());

        business(put(base() + "/{id}", id).contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(proposal())))
            .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("DRAFT"));
        business(post(base() + "/{id}/send", id)).andExpect(status().isOk()).andExpect(jsonPath("$.status").value("PENDING"));
        business(put(base() + "/{id}", id).contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(proposal())))
            .andExpect(status().isConflict()).andExpect(jsonPath("$.status").value("PROPOSAL_NOT_EDITABLE"));
    }

    @Test
    void validationChecksTotalsAndMilestoneOrder() throws Exception {
        Map<String, Object> mismatched = proposal();
        mismatched.put("totalAmount", 999);
        create(mismatched, true).andExpect(status().isBadRequest()).andExpect(jsonPath("$.errors.milestones").isNotEmpty());

        Map<String, Object> unordered = proposal();
        unordered.put("milestones", List.of(
            milestone("Code", 1500, LocalDate.now().plusDays(20)),
            milestone("Design", 1000, LocalDate.now().plusDays(10))));
        create(unordered, true).andExpect(status().isBadRequest()).andExpect(jsonPath("$.errors['milestones.1.deadline']").isNotEmpty());

        Map<String, Object> late = proposal();
        late.put("milestones", List.of(milestone("All", 2500, LocalDate.now().plusDays(60))));
        create(late, true).andExpect(status().isBadRequest()).andExpect(jsonPath("$.errors['milestones.0.deadline']").isNotEmpty());

        Map<String, Object> noMilestones = proposal();
        noMilestones.put("milestones", List.of());
        create(noMilestones, true).andExpect(status().isBadRequest()).andExpect(jsonPath("$.errors.milestones").isNotEmpty());

        business(post(base()).contentType(MediaType.APPLICATION_JSON).content("{\"projectName\":\"X\",\"deadline\":\"31/12/2026\"}"))
            .andExpect(status().isBadRequest()).andExpect(jsonPath("$.status").value("INVALID_REQUEST"));
        assertThat(jdbc.queryForObject("select count(*) from replyn_proposals where thread_id=?", Integer.class, thread)).isZero();
    }

    @Test
    void onlyOneOpenProposalPerConversation() throws Exception {
        String id = body(create(proposal(), true).andExpect(status().isCreated())).get("id").asText();
        create(proposal(), true).andExpect(status().isConflict()).andExpect(jsonPath("$.status").value("PROPOSAL_EXISTS"));
        create(proposal(), false).andExpect(status().isConflict());
        respond(TOKEN, id, "accept", null).andExpect(status().isOk());
        // An accepted agreement is opened in Replyn, not proposed again.
        create(proposal(), true).andExpect(status().isConflict());
        respond(TOKEN, id, "reject", null).andExpect(status().isConflict()).andExpect(jsonPath("$.status").value("PROPOSAL_ACCEPTED"));
    }

    @Test
    void acceptingTwiceReturnsTheSameWorkspace() throws Exception {
        String id = body(create(proposal(), true).andExpect(status().isCreated())).get("id").asText();
        String first = body(respond(TOKEN, id, "accept", null).andExpect(status().isOk())).get("workspaceId").asText();
        // A retried tap or a lost response must not fail or allocate a second workspace.
        respond(TOKEN, id, "accept", null).andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("ACCEPTED"))
            .andExpect(jsonPath("$.workspaceId").value(first));
        assertThat(jdbc.queryForObject("select count(*) from replyn_proposals where thread_id=? and workspace_id is not null", Integer.class, thread))
            .isEqualTo(1);
        assertThat(jdbc.queryForObject("select count(*) from notifications where type='REPLYN_PROPOSAL_ACCEPTED' and data->>'threadId'=?",
            Integer.class, thread.toString())).isEqualTo(1);
        // Anyone other than that talent is still refused.
        respond(OTHER_TOKEN, id, "accept", null).andExpect(status().isForbidden());
    }

    @Test
    void rejectionAndCancellationAreFinalAndKeepHistory() throws Exception {
        String first = body(create(proposal(), true)).get("id").asText();
        respond(TOKEN, first, "reject", "{\"reason\":\"Ngân sách chưa phù hợp\"}").andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("REJECTED"))
            .andExpect(jsonPath("$.rejectionReason").value("Ngân sách chưa phù hợp"))
            .andExpect(jsonPath("$.workspaceId").doesNotExist());
        respond(TOKEN, first, "accept", null).andExpect(status().isConflict());
        business(post(base() + "/{id}/cancel", first)).andExpect(status().isConflict());

        Map<String, Object> revision = proposal();
        revision.put("supersedesId", first);
        String second = body(create(revision, true).andExpect(status().isCreated())
            .andExpect(jsonPath("$.supersedesId").value(first))).get("id").asText();
        business(post(base() + "/{id}/cancel", second)).andExpect(status().isOk()).andExpect(jsonPath("$.status").value("CANCELLED"));
        respond(TOKEN, second, "accept", null).andExpect(status().isConflict()).andExpect(jsonPath("$.status").value("PROPOSAL_CANCELLED"));

        business(get(base())).andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(2));
        assertThat(jdbc.queryForObject("select count(*) from replyn_proposals where workspace_id is not null", Integer.class)).isZero();

        // Discarding a draft deletes it instead of leaving a cancelled record.
        String draft = body(create(Map.of("projectName", "Bản nháp"), false)).get("id").asText();
        business(post(base() + "/{id}/cancel", draft)).andExpect(status().isNoContent());
        assertThat(jdbc.queryForObject("select count(*) from replyn_proposals where id=?::uuid", Integer.class, draft)).isZero();
    }

    @Test
    void expiredProposalCannotBeAccepted() throws Exception {
        String id = body(create(proposal(), true)).get("id").asText();
        jdbc.update("update replyn_proposals set sent_at=now()-interval '8 days', expires_at=now()-interval '1 hour' where id=?::uuid", id);
        respond(TOKEN, id, "accept", null).andExpect(status().isGone()).andExpect(jsonPath("$.status").value("PROPOSAL_EXPIRED"));
        mvc.perform(get("/api/v1/mobile/messages").header("Authorization", "Bearer " + TOKEN))
            .andExpect(jsonPath("$[0].replynProposals[0].status").value("EXPIRED"));
        create(proposal(), true).andExpect(status().isCreated());
    }

    @Test
    void outsidersCannotSeeOrAnswerProposals() throws Exception {
        String id = body(create(proposal(), true)).get("id").asText();
        respond(OTHER_TOKEN, id, "accept", null).andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/mobile/messages").header("Authorization", "Bearer " + OTHER_TOKEN))
            .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(0));

        // A proposal id from another conversation is not found through this one.
        UUID otherThread = acceptedThread(OTHER_CONTRACTOR);
        mvc.perform(post("/api/v1/mobile/messages/{thread}/replyn-proposals/{id}/accept", otherThread, id)
                .header("Authorization", "Bearer " + OTHER_TOKEN))
            .andExpect(status().isNotFound());
        respond(null, id, "accept", null).andExpect(status().isUnauthorized());
        mvc.perform(post(base()).contentType(MediaType.APPLICATION_JSON).content("{}")).andExpect(status().isUnauthorized());
        mvc.perform(post(LOOKUP).header("X-Replyn-Client-Secret", "wrong-secret-wrong-secret-wrong-secret")
                .contentType(MediaType.APPLICATION_JSON).content("{\"subjectType\":\"TALENT\",\"subjectId\":\"x\"}"))
            .andExpect(status().isUnauthorized());
        assertThat(jdbc.queryForObject("select status from replyn_proposals where id=?::uuid", String.class, id)).isEqualTo("PENDING");
    }

    @Test
    void muteHideAndBlockOnlyChangeTheBusinessSide() throws Exception {
        business(post("/api/v1/messages/{id}/mute", thread)).andExpect(status().isOk()).andExpect(jsonPath("$.businessMuted").value(true));
        talentMessage(TOKEN).andExpect(status().isOk());
        assertThat(jdbc.queryForObject("select count(*) from notifications where type='MESSAGE_RECEIVED' and organization_id=?",
            Integer.class, TestRecipients.ORG)).isZero();
        business(post("/api/v1/messages/{id}/unmute", thread)).andExpect(jsonPath("$.businessMuted").value(false));

        business(post("/api/v1/messages/{id}/hide", thread)).andExpect(status().isNoContent());
        business(get("/api/v1/messages").param("status", "ACCEPTED")).andExpect(jsonPath("$.length()").value(0));
        mvc.perform(get("/api/v1/mobile/messages").header("Authorization", "Bearer " + TOKEN))
            .andExpect(jsonPath("$[0].messages.length()").value(1));
        jdbc.update("update message_threads set business_hidden_at=now()-interval '1 minute' where id=?", thread);
        talentMessage(TOKEN).andExpect(status().isOk());
        business(get("/api/v1/messages").param("status", "ACCEPTED")).andExpect(jsonPath("$.length()").value(1));

        String accepted = body(create(proposal(), true)).get("id").asText();
        respond(TOKEN, accepted, "accept", null).andExpect(status().isOk());
        business(post("/api/v1/messages/{id}/block", thread)).andExpect(status().isOk()).andExpect(jsonPath("$.requestStatus").value("BLOCKED"));
        talentMessage(TOKEN).andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/mobile/messages").header("Authorization", "Bearer " + TOKEN))
            .andExpect(jsonPath("$[0].requestStatus").value("BLOCKED"))
            .andExpect(jsonPath("$[0].messages.length()").value(2))
            .andExpect(jsonPath("$[0].replynProposals[0].status").value("ACCEPTED"));
        business(get("/api/v1/messages").param("status", "BLOCKED")).andExpect(jsonPath("$[0].id").value(thread.toString()));
        lookup("TALENT", TestRecipients.CONTRACTOR, null).andExpect(jsonPath("$.workspaces.length()").value(1));
        business(post("/api/v1/messages/{id}/unblock", thread)).andExpect(status().isOk()).andExpect(jsonPath("$.requestStatus").value("ACCEPTED"));
    }

    @Test
    void blockingWithdrawsAPendingProposal() throws Exception {
        String id = body(create(proposal(), true)).get("id").asText();
        business(post("/api/v1/messages/{id}/block", thread)).andExpect(status().isOk());
        assertThat(jdbc.queryForObject("select status from replyn_proposals where id=?::uuid", String.class, id)).isEqualTo("CANCELLED");
        respond(TOKEN, id, "accept", null).andExpect(status().isForbidden());
    }

    static Map<String, Object> proposal() {
        LocalDate today = LocalDate.now();
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("projectName", "Landing page mùa thu");
        body.put("scope", "Thiết kế và code landing page 6 section.");
        body.put("deliverables", List.of("File Figma", "Mã nguồn Next.js"));
        body.put("revisionLimit", 2);
        body.put("currency", "USDC");
        body.put("totalAmount", 2500);
        body.put("startDate", today.plusDays(1).toString());
        body.put("deadline", today.plusDays(30).toString());
        body.put("reviewPeriodDays", 3);
        body.put("milestones", new ArrayList<>(List.of(
            milestone("Thiết kế UI", 1000, today.plusDays(10)),
            milestone("Code & bàn giao", 1500, today.plusDays(30)))));
        body.put("notes", "Ghi chú");
        return body;
    }

    static Map<String, Object> milestone(String title, int amount, LocalDate deadline) {
        return Map.of("title", title, "amount", amount, "deadline", deadline.toString());
    }

    private String base() { return "/api/v1/messages/" + thread + "/replyn-proposals"; }

    private ResultActions create(Map<String, Object> body, boolean send) throws Exception {
        return business(post(base()).param("send", String.valueOf(send)).contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(body)));
    }

    private ResultActions business(org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder request) throws Exception {
        return mvc.perform(request.header("X-Nova-Demo-Key", DEMO_KEY));
    }

    private ResultActions respond(String token, String proposalId, String action, String body) throws Exception {
        var request = post("/api/v1/mobile/messages/{thread}/replyn-proposals/{id}/" + action, thread, proposalId);
        if (token != null) request.header("Authorization", "Bearer " + token);
        if (body != null) request.contentType(MediaType.APPLICATION_JSON).content(body);
        return mvc.perform(request);
    }

    private ResultActions talentMessage(String token) throws Exception {
        return mvc.perform(post("/api/v1/mobile/messages/{thread}/messages", thread).header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON).content("{\"body\":\"Xin chào\"}"));
    }

    private ResultActions lookup(String subjectType, String subjectId, String workspaceId) throws Exception {
        Map<String, String> request = new LinkedHashMap<>(Map.of("subjectType", subjectType, "subjectId", subjectId));
        if (workspaceId != null) request.put("workspaceId", workspaceId);
        return mvc.perform(post(LOOKUP).header("X-Replyn-Client-Secret", ReplynPairingControllerTest.CLIENT_SECRET)
            .contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(request)));
    }

    private JsonNode body(ResultActions result) throws Exception {
        return json.readTree(result.andReturn().getResponse().getContentAsString());
    }

    private UUID acceptedThread(String contractor) {
        UUID id = UUID.randomUUID();
        jdbc.update("insert into message_threads(id,organization_id,contractor_id,request_status,accepted_at) values(?,?,?,'ACCEPTED',now())",
            id, TestRecipients.ORG, contractor);
        return id;
    }

    private void session(String contractor, String token) {
        jdbc.update("insert into mobile_sessions(token_hash,organization_id,contractor_id,expires_at) values(?,?,?,now()+interval '1 hour')",
            MobileSessionAuthenticator.hashToken(token), TestRecipients.ORG, contractor);
    }
}
