package com.nova.backend.payment;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.MediaType;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

// The demo recipient differs from the contractor's wallet: payments must never use it.
@SpringBootTest(properties={
    "nova.solana.recipient=BucXFPoNNN7NL9Kv7ocXvsxw1BxRn5U5r7ky5MFqmdSA",
    "nova.demo.api-key=test-demo-key"
})
@AutoConfigureMockMvc
@Transactional
class PaymentFlowTest {
    private static final String DEMO_KEY = "test-demo-key";

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired org.springframework.jdbc.core.JdbcTemplate jdbc;
    @MockitoBean DevnetRpc rpc;

    String create(String key, String amount) throws Exception {
        com.nova.backend.TestRecipients.acceptedApplication(jdbc, "accepted");
        com.nova.backend.TestRecipients.payoutWallet(jdbc, com.nova.backend.TestRecipients.CONTRACTOR, PaymentVerifierTest.RECIPIENT);
        var result = mvc.perform(post("/api/v1/invoices").header("Idempotency-Key",key)
            .header("X-Nova-Demo-Key", DEMO_KEY)
            .contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(java.util.Map.of(
                "contractorId",com.nova.backend.TestRecipients.CONTRACTOR, "description","Payment test", "amountMinor",amount,
                "dueDate",java.time.LocalDate.now().plusDays(7).toString()))))
            .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        return json.readTree(result).path("id").asText();
    }

    String payment() throws Exception {
        String invoice = create(UUID.randomUUID().toString(), "1000000");
        String result = mvc.perform(post("/api/v1/invoices/"+invoice+"/issue").header("Idempotency-Key",UUID.randomUUID().toString()))
            .andExpect(status().isUnauthorized()).andReturn().getResponse().getContentAsString();
        result = mvc.perform(post("/api/v1/invoices/"+invoice+"/issue")
            .header("Idempotency-Key",UUID.randomUUID().toString())
            .header("X-Nova-Demo-Key", DEMO_KEY))
            .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        String id=json.readTree(result).at("/paymentRequest/id").asText();
        when(rpc.call(eq("getAccountInfo"), anyList())).thenReturn(json.readTree("""
          {"value":{"owner":"TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA","data":{"parsed":{"type":"mint","info":{"decimals":6}}}}}
          """));
        mvc.perform(post("/api/v1/payment-requests/"+id+"/prepare")
            .header("X-Nova-Demo-Key", DEMO_KEY))
            .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("AWAITING_PAYMENT"))
            .andExpect(jsonPath("$.recipient").value(PaymentVerifierTest.RECIPIENT));
        mvc.perform(post("/api/v1/payment-requests/"+id+"/prepare")
            .header("X-Nova-Demo-Key", DEMO_KEY))
            .andExpect(status().isOk()).andExpect(jsonPath("$.reference").value("nova:"+id));
        return id;
    }

    @Test void confirmsThenFinalizesAndReplaysWithoutAnotherPayment() throws Exception {
        String id=payment();
        ObjectNode tx=PaymentVerifierTest.transaction();
        ((ObjectNode)tx.at("/transaction/message/instructions/1")).put("parsed","nova:"+id);
        tx.put("blockTime",java.time.Instant.now().getEpochSecond());
        when(rpc.call(eq("getSignatureStatuses"), anyList()))
            .thenReturn(json.readTree("{\"value\":[{\"err\":null,\"confirmationStatus\":\"confirmed\"}]}"))
            .thenReturn(json.readTree("{\"value\":[{\"err\":null,\"confirmationStatus\":\"finalized\"}]}"));
        when(rpc.call(eq("getTransaction"), anyList())).thenReturn(tx);
        String body=json.writeValueAsString(java.util.Map.of("signature",PaymentVerifierTest.SIGNATURE));
        mvc.perform(post("/api/v1/payment-requests/"+id+"/verify")
            .header("X-Nova-Demo-Key", DEMO_KEY)
            .contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("PAYMENT_DETECTED"));
        for (int i=0;i<2;i++) mvc.perform(post("/api/v1/payment-requests/"+id+"/verify")
            .header("X-Nova-Demo-Key", DEMO_KEY)
            .contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("PAID_ON_CHAIN"));
        verify(rpc,times(2)).call(eq("getTransaction"),anyList());
        org.junit.jupiter.api.Assertions.assertEquals(2, jdbc.queryForObject(
            "select count(*) from payment_ledger_entries where payment_request_id=?", Integer.class, UUID.fromString(id)));
        org.junit.jupiter.api.Assertions.assertEquals(1, jdbc.queryForObject(
            "select count(*) from payment_ledger_entries where payment_request_id=? and commitment='finalized'", Integer.class, UUID.fromString(id)));
        String listed = mvc.perform(get("/api/v1/invoices").header("X-Nova-Demo-Key", DEMO_KEY))
            .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        var rows = json.readTree(listed);
        var matching = java.util.stream.StreamSupport.stream(rows.spliterator(), false)
            .filter(row -> id.equals(row.path("paymentRequestId").asText())).findFirst().orElseThrow();
        org.junit.jupiter.api.Assertions.assertEquals("PAID_ON_CHAIN", matching.path("status").asText());
        org.junit.jupiter.api.Assertions.assertEquals("1000000", matching.path("amountMinor").asText());
    }

    @Test void pendingTransactionDoesNotMarkInvoicePaid() throws Exception {
        String id=payment();
        when(rpc.call(eq("getSignatureStatuses"),anyList())).thenReturn(json.readTree("{\"value\":[null]}"));
        mvc.perform(post("/api/v1/payment-requests/"+id+"/verify")
            .header("X-Nova-Demo-Key", DEMO_KEY)
            .contentType(MediaType.APPLICATION_JSON)
            .content(json.writeValueAsString(java.util.Map.of("signature",PaymentVerifierTest.SIGNATURE))))
            .andExpect(status().isAccepted());
        mvc.perform(get("/api/v1/payment-requests/"+id)
            .header("X-Nova-Demo-Key", DEMO_KEY)).andExpect(jsonPath("$.status").value("AWAITING_PAYMENT"));
        verify(rpc,never()).call(eq("getTransaction"),anyList());
    }

    @Test void sameCreateKeyWithChangedAmountConflicts() throws Exception {
        String key=UUID.randomUUID().toString();
        create(key,"1000000");
        mvc.perform(post("/api/v1/invoices").header("Idempotency-Key",key)
            .header("X-Nova-Demo-Key", DEMO_KEY)
            .contentType(MediaType.APPLICATION_JSON)
            .content(json.writeValueAsString(java.util.Map.of("contractorId",com.nova.backend.TestRecipients.CONTRACTOR,"description","Payment test",
                "amountMinor","2000000","dueDate",java.time.LocalDate.now().plusDays(7).toString()))))
            .andExpect(status().isConflict());
    }

    private void createFor(String contractorId, int expected) throws Exception {
        mvc.perform(post("/api/v1/invoices").header("Idempotency-Key",UUID.randomUUID().toString())
            .header("X-Nova-Demo-Key", DEMO_KEY)
            .contentType(MediaType.APPLICATION_JSON)
            .content(json.writeValueAsString(java.util.Map.of("contractorId",contractorId,"description","Payment test",
                "amountMinor","1000000","dueDate",java.time.LocalDate.now().plusDays(7).toString()))))
            .andExpect(status().is(expected));
    }

    @Test void onlyAnAcceptedCandidateOfTheOrganizationCanBeInvoiced() throws Exception {
        createFor("contractor-tran-quoc-bao", 422);
        createFor(com.nova.backend.TestRecipients.CONTRACTOR, 422);
        for (String status : List.of("submitted", "rejected", "withdrawn")) {
            com.nova.backend.TestRecipients.acceptedApplication(jdbc, status);
            createFor(com.nova.backend.TestRecipients.CONTRACTOR, 422);
        }
        UUID accepted = com.nova.backend.TestRecipients.acceptedApplication(jdbc, "accepted");

        mvc.perform(get("/api/v1/business/recipients").header("X-Nova-Demo-Key", DEMO_KEY))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(1))
            .andExpect(jsonPath("$[0].contractorId").value(com.nova.backend.TestRecipients.CONTRACTOR))
            .andExpect(jsonPath("$[0].applicationId").value(accepted.toString()))
            .andExpect(jsonPath("$[0].applicationStatus").value("accepted"))
            .andExpect(jsonPath("$[0].displayName").isNotEmpty())
            .andExpect(jsonPath("$[0].payoutReadiness").value("NOT_CONFIGURED"));
        mvc.perform(get("/api/v1/business/recipients")).andExpect(status().isUnauthorized());

        String body = mvc.perform(post("/api/v1/invoices").header("Idempotency-Key",UUID.randomUUID().toString())
                .header("X-Nova-Demo-Key", DEMO_KEY).contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(java.util.Map.of("contractorId",com.nova.backend.TestRecipients.CONTRACTOR,
                    "description","Milestone 1","amountMinor","1000000","dueDate",java.time.LocalDate.now().plusDays(7).toString()))))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.contractorId").value(com.nova.backend.TestRecipients.CONTRACTOR))
            .andExpect(jsonPath("$.applicationId").value(accepted.toString()))
            .andExpect(jsonPath("$.organizationId").value(com.nova.backend.TestRecipients.ORG.toString()))
            .andExpect(jsonPath("$.recipientName").isNotEmpty())
            .andExpect(jsonPath("$.jobTitle").value("Invoice test job"))
            .andReturn().getResponse().getContentAsString();
        org.junit.jupiter.api.Assertions.assertFalse(body.contains("demo"), body);
    }
}
