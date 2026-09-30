package com.nova.backend.payment;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.nova.backend.TestRecipients;
import com.nova.backend.mobile.MobileController;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

/** Payments go to the invoiced contractor's own wallet, frozen when prepared. */
@SpringBootTest(properties = {
    "nova.solana.recipient=BucXFPoNNN7NL9Kv7ocXvsxw1BxRn5U5r7ky5MFqmdSA",
    "nova.demo.api-key=test-demo-key"
})
@AutoConfigureMockMvc
@Transactional
class ContractorWalletPaymentTest {
    private static final String DEMO_KEY = "test-demo-key";
    private static final String DEMO_RECIPIENT = "BucXFPoNNN7NL9Kv7ocXvsxw1BxRn5U5r7ky5MFqmdSA";
    private static final String NEW_WALLET = "7xVYUrUR2PA6aoW4f9KCJJAUt9gHoeKzod6ErFtGcH3X";
    private static final String TOKEN = "m".repeat(43);
    private static final String OTHER_TOKEN = "o".repeat(43);

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired JdbcTemplate jdbc;
    @MockitoBean DevnetRpc rpc;

    @BeforeEach
    void mint() throws Exception {
        when(rpc.call(eq("getAccountInfo"), anyList())).thenReturn(json.readTree("""
            {"value":{"owner":"TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA","data":{"parsed":{"type":"mint","info":{"decimals":6}}}}}
            """));
        TestRecipients.acceptedApplication(jdbc, "accepted");
    }

    private String draft() throws Exception {
        String body = mvc.perform(post("/api/v1/invoices").header("Idempotency-Key", UUID.randomUUID().toString())
                .header("X-Nova-Demo-Key", DEMO_KEY).contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of("contractorId", TestRecipients.CONTRACTOR, "description", "Milestone",
                    "amountMinor", "1000000", "dueDate", LocalDate.now().plusDays(7).toString()))))
            .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        return json.readTree(body).path("id").asText();
    }

    private String issue(String invoice) throws Exception {
        String body = mvc.perform(post("/api/v1/invoices/" + invoice + "/issue").header("Idempotency-Key", "issue-" + invoice)
                .header("X-Nova-Demo-Key", DEMO_KEY))
            .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        return json.readTree(body).at("/paymentRequest/id").asText();
    }

    private org.springframework.test.web.servlet.ResultActions prepare(String payment) throws Exception {
        return mvc.perform(post("/api/v1/payment-requests/" + payment + "/prepare").header("X-Nova-Demo-Key", DEMO_KEY));
    }

    private org.springframework.test.web.servlet.ResultActions verify(String payment, String signature) throws Exception {
        return mvc.perform(post("/api/v1/payment-requests/" + payment + "/verify").header("X-Nova-Demo-Key", DEMO_KEY)
            .contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(Map.of("signature", signature))));
    }

    /** A finalized Devnet transfer of 1 USDC to [recipient] carrying the payment's memo. */
    private void chainHas(String payment, String recipient, String signature) throws Exception {
        ObjectNode tx = PaymentVerifierTest.transaction();
        ((ObjectNode) tx.at("/transaction/message/instructions/1")).put("parsed", "nova:" + payment);
        ((ObjectNode) tx.at("/meta/preTokenBalances/0")).put("owner", recipient);
        ((ObjectNode) tx.at("/meta/postTokenBalances/0")).put("owner", recipient);
        ((com.fasterxml.jackson.databind.node.ArrayNode) tx.at("/transaction/signatures")).set(0, json.getNodeFactory().textNode(signature));
        tx.put("blockTime", Instant.now().getEpochSecond());
        when(rpc.call(eq("getSignatureStatuses"), anyList()))
            .thenReturn(json.readTree("{\"value\":[{\"err\":null,\"confirmationStatus\":\"finalized\"}]}"));
        when(rpc.call(eq("getTransaction"), anyList())).thenReturn(tx);
    }

    private void session(String contractorId, String token) {
        jdbc.update("insert into mobile_sessions(token_hash,organization_id,contractor_id,expires_at) values(?,?,?,now()+interval '1 hour')",
            MobileController.hashToken(token), TestRecipients.ORG, contractorId);
    }

    @Test
    void aPaymentRequestIsBlockedUntilTheContractorHasAWallet() throws Exception {
        String invoice = draft();
        mvc.perform(post("/api/v1/invoices/" + invoice + "/issue").header("Idempotency-Key", "issue-" + invoice)
                .header("X-Nova-Demo-Key", DEMO_KEY))
            .andExpect(status().isUnprocessableEntity())
            .andExpect(jsonPath("$.code").value("WALLET_NOT_CONFIGURED"))
            .andExpect(jsonPath("$.message").value("Ứng viên chưa cấu hình ví nhận USDC trên Solana Devnet."));
        // The draft stays; no payment request with an invented recipient exists.
        assertEquals("DRAFT", jdbc.queryForObject("select status from invoices where id=?::uuid", String.class, invoice));
        assertEquals(0, jdbc.queryForObject("select count(*) from payment_requests where invoice_id=?::uuid", Integer.class, invoice));

        TestRecipients.payoutWallet(jdbc, TestRecipients.CONTRACTOR, TestRecipients.WALLET);
        String payment = issue(invoice);
        // Removing the wallet before paying blocks preparation too.
        jdbc.update("update contractor_payout_wallets set deactivated_at=now() where contractor_id=?", TestRecipients.CONTRACTOR);
        prepare(payment).andExpect(status().isUnprocessableEntity()).andExpect(jsonPath("$.code").value("WALLET_NOT_CONFIGURED"));
        assertEquals(0, jdbc.queryForObject("select count(*) from payment_requests where id=?::uuid and recipient_address is not null",
            Integer.class, payment));
    }

    @Test
    void paysTheContractorsCurrentWalletAndFreezesItInHistory() throws Exception {
        TestRecipients.payoutWallet(jdbc, TestRecipients.CONTRACTOR, TestRecipients.WALLET);
        String invoice = draft();
        String payment = issue(invoice);
        // The contractor changes wallet after the invoice exists: payment uses the wallet at payment time.
        TestRecipients.payoutWallet(jdbc, TestRecipients.CONTRACTOR, NEW_WALLET);
        prepare(payment).andExpect(status().isOk())
            .andExpect(jsonPath("$.recipient").value(NEW_WALLET))
            .andExpect(jsonPath("$.recipientKind").value("CONTRACTOR_WALLET"))
            .andExpect(jsonPath("$.mint").value(DevnetRpc.MINT))
            .andExpect(jsonPath("$.chain").value("solana:devnet"));
        TestRecipients.payoutWallet(jdbc, TestRecipients.CONTRACTOR, TestRecipients.WALLET);
        prepare(payment).andExpect(jsonPath("$.recipient").value(TestRecipients.WALLET));

        // A transfer to anyone else (here the old demo wallet) is not this invoice's payment.
        chainHas(payment, DEMO_RECIPIENT, PaymentVerifierTest.SIGNATURE);
        verify(payment, PaymentVerifierTest.SIGNATURE).andExpect(status().isUnprocessableEntity());

        chainHas(payment, TestRecipients.WALLET, PaymentVerifierTest.SIGNATURE);
        verify(payment, PaymentVerifierTest.SIGNATURE).andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("PAID_ON_CHAIN"))
            .andExpect(jsonPath("$.signature").value(PaymentVerifierTest.SIGNATURE));

        // Wallet changes after payment never rewrite the recorded recipient.
        TestRecipients.payoutWallet(jdbc, TestRecipients.CONTRACTOR, NEW_WALLET);
        prepare(payment).andExpect(status().isOk()).andExpect(jsonPath("$.recipient").value(TestRecipients.WALLET));
        var ledger = jdbc.queryForMap("select recipient, signature, recipient_kind, mint from payment_ledger_entries where payment_request_id=?::uuid",
            payment);
        assertEquals(TestRecipients.WALLET, ledger.get("recipient"));
        assertEquals(PaymentVerifierTest.SIGNATURE, ledger.get("signature"));
        assertEquals("CONTRACTOR_WALLET", ledger.get("recipient_kind"));
        assertEquals(DevnetRpc.MINT, ledger.get("mint"));

        // Paying the invoice a second time is refused.
        String second = "3".repeat(88);
        chainHas(payment, TestRecipients.WALLET, second);
        verify(payment, second).andExpect(status().isConflict());
        mvc.perform(post("/api/v1/invoices/" + invoice + "/issue").header("Idempotency-Key", "again").header("X-Nova-Demo-Key", DEMO_KEY))
            .andExpect(jsonPath("$.paymentRequest.id").value(payment));
        assertEquals(1, jdbc.queryForObject("select count(*) from payment_ledger_entries where payment_request_id=?::uuid", Integer.class, payment));
    }

    @Test
    void anUnpaidLegacyDemoRequestMustBePreparedAgain() throws Exception {
        TestRecipients.payoutWallet(jdbc, TestRecipients.CONTRACTOR, TestRecipients.WALLET);
        String payment = issue(draft());
        prepare(payment).andExpect(status().isOk());
        // As migrated from before contractor wallets: prepared for the demo wallet.
        jdbc.update("update payment_requests set recipient_address=?, recipient_kind='LEGACY_DEMO' where id=?::uuid", DEMO_RECIPIENT, payment);
        chainHas(payment, DEMO_RECIPIENT, PaymentVerifierTest.SIGNATURE);
        verify(payment, PaymentVerifierTest.SIGNATURE).andExpect(status().isConflict());
        prepare(payment).andExpect(jsonPath("$.recipient").value(TestRecipients.WALLET))
            .andExpect(jsonPath("$.recipientKind").value("CONTRACTOR_WALLET"));
    }

    @Test
    void walletSummarySeparatesPersonalAndLegacyPaymentsAndCountsEachOnce() throws Exception {
        session(TestRecipients.CONTRACTOR, TOKEN);
        TestRecipients.payoutWallet(jdbc, TestRecipients.CONTRACTOR, TestRecipients.WALLET);
        String payment = issue(draft());
        prepare(payment).andExpect(status().isOk());
        chainHas(payment, TestRecipients.WALLET, PaymentVerifierTest.SIGNATURE);
        for (int i = 0; i < 3; i++) verify(payment, PaymentVerifierTest.SIGNATURE).andExpect(status().isOk());

        // An old payment that settled into the demo wallet before this release.
        UUID legacyInvoice = UUID.fromString(draft());
        UUID legacyPayment = UUID.randomUUID();
        jdbc.update("update invoices set status='PAID_ON_CHAIN' where id=?", legacyInvoice);
        jdbc.update("insert into payment_requests(id,invoice_id,network,status,recipient_address,recipient_kind) values(?,?,'Solana Devnet','PAID_ON_CHAIN',?,'LEGACY_DEMO')",
            legacyPayment, legacyInvoice, DEMO_RECIPIENT);
        jdbc.update("insert into payment_ledger_entries(payment_request_id,commitment,signature,recipient,mint,amount_minor,reference,recipient_kind) values(?,'finalized',?,?,?,250000,'legacy','LEGACY_DEMO')",
            legacyPayment, "4".repeat(88), DEMO_RECIPIENT, DevnetRpc.MINT);
        String pending = draft();
        issue(pending);

        for (int refresh = 0; refresh < 3; refresh++) {
            mvc.perform(get("/api/v1/mobile/wallet/summary").header("Authorization", "Bearer " + TOKEN))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.payoutWalletStatus").value("CONFIGURED"))
                .andExpect(jsonPath("$.walletAddress").value(TestRecipients.WALLET))
                .andExpect(jsonPath("$.paidToPersonalWalletMinor").value("1000000"))
                .andExpect(jsonPath("$.paidToPersonalWalletUsdc").value("1.00"))
                .andExpect(jsonPath("$.availableBalanceMinor").value("1000000"))
                .andExpect(jsonPath("$.paidViaDemoWalletMinor").value("250000"))
                .andExpect(jsonPath("$.pendingBalanceMinor").value("1000000"))
                .andExpect(jsonPath("$.isDemoWallet").value(false))
                .andExpect(jsonPath("$.demoRecipientAddress").value(DEMO_RECIPIENT));
        }
        String transactions = mvc.perform(get("/api/v1/mobile/wallet/transactions").header("Authorization", "Bearer " + TOKEN))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(2))
            .andExpect(jsonPath("$[?(@.signature=='" + PaymentVerifierTest.SIGNATURE + "')].recipient").value(TestRecipients.WALLET))
            .andExpect(jsonPath("$[?(@.signature=='" + PaymentVerifierTest.SIGNATURE + "')].recipientKind").value("CONTRACTOR_WALLET"))
            .andExpect(jsonPath("$[?(@.signature=='" + PaymentVerifierTest.SIGNATURE + "')].status").value("PAID_ON_CHAIN"))
            .andExpect(jsonPath("$[?(@.signature=='" + PaymentVerifierTest.SIGNATURE + "')].token").value("USDC"))
            .andExpect(jsonPath("$[?(@.signature=='" + PaymentVerifierTest.SIGNATURE + "')].network").value("solana:devnet"))
            .andExpect(jsonPath("$[?(@.signature=='" + PaymentVerifierTest.SIGNATURE + "')].amountMinor").value("1000000"))
            .andExpect(jsonPath("$[?(@.signature=='" + PaymentVerifierTest.SIGNATURE + "')].invoiceId").isNotEmpty())
            .andExpect(jsonPath("$[?(@.signature=='" + PaymentVerifierTest.SIGNATURE + "')].createdAt").isNotEmpty())
            .andExpect(jsonPath("$[?(@.signature=='" + "4".repeat(88) + "')].recipientKind").value("LEGACY_DEMO"))
            .andReturn().getResponse().getContentAsString();
        assertFalse(transactions.toLowerCase().contains("secret"));

        // Another contractor sees none of it.
        jdbc.update("insert into talent_profiles(contractor_id,display_name,headline) values('contractor-summary-other','Other','')");
        session("contractor-summary-other", OTHER_TOKEN);
        mvc.perform(get("/api/v1/mobile/wallet/summary").header("Authorization", "Bearer " + OTHER_TOKEN))
            .andExpect(jsonPath("$.paidToPersonalWalletMinor").value("0"))
            .andExpect(jsonPath("$.paidViaDemoWalletMinor").value("0"))
            .andExpect(jsonPath("$.pendingBalanceMinor").value("0"))
            .andExpect(jsonPath("$.payoutWalletStatus").value("NOT_CONFIGURED"))
            .andExpect(jsonPath("$.walletAddress").doesNotExist())
            .andExpect(jsonPath("$.demoRecipientAddress").doesNotExist());
        mvc.perform(get("/api/v1/mobile/wallet/transactions").header("Authorization", "Bearer " + OTHER_TOKEN))
            .andExpect(jsonPath("$.length()").value(0));
    }
}
