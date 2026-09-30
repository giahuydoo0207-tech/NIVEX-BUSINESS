package com.nova.backend.mobile;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.nova.backend.TestRecipients;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest(properties = {"nova.solana.recipient=Eiz8weAjGbquFPPw98EkgLeQyoRkH2i9hUzqLHh64dyr"})
@AutoConfigureMockMvc
@Transactional
class MobileWalletControllerTest {
    private static final String TOKEN = "w".repeat(43);
    private static final String OTHER_TOKEN = "x".repeat(43);
    @Autowired MockMvc mvc;
    @Autowired JdbcTemplate jdbc;

    private void session(String contractorId, String token) {
        jdbc.update("insert into mobile_sessions(token_hash,organization_id,contractor_id,expires_at) values(?,?,?,now()+interval '1 hour')",
            MobileController.hashToken(token), TestRecipients.ORG, contractorId);
    }

    private UUID invoice(String status, long amountMinor) {
        UUID application = TestRecipients.acceptedApplication(jdbc, "accepted");
        UUID id = UUID.randomUUID();
        jdbc.update("insert into invoices(id,organization_id,contractor_id,application_id,invoice_number,description,amount_minor,currency,due_date,status,idempotency_key) "
                + "values(?,?,?,?,?,?,?,'USDC',current_date+7,?,?)",
            id, TestRecipients.ORG, TestRecipients.CONTRACTOR, application, "TEST-" + id, "Work", amountMinor, status, id.toString());
        return id;
    }

    private void paid(UUID invoiceId, long amountMinor, String commitment, String signature) {
        UUID payment = jdbc.query("select id from payment_requests where invoice_id=?", (rs, row) -> rs.getObject(1, UUID.class), invoiceId)
            .stream().findFirst().orElseGet(() -> {
                UUID created = UUID.randomUUID();
                jdbc.update("insert into payment_requests(id,invoice_id,network,status) values(?,?,'Solana Devnet','PAID_ON_CHAIN')", created, invoiceId);
                return created;
            });
        jdbc.update("insert into payment_ledger_entries(payment_request_id,commitment,signature,recipient,mint,amount_minor,reference) values(?,?,?,?,?,?,?)",
            payment, commitment, signature, "Eiz8weAjGbquFPPw98EkgLeQyoRkH2i9hUzqLHh64dyr", "BRjpCHtyQLNCo8gqRUr8jtdAj5AjPYQaoqbvcZiHok1k", amountMinor, "ref-" + signature);
    }

    @Test
    void summaryCountsFinalizedPaymentsOnceAndNeverAsPersonalBalance() throws Exception {
        session(TestRecipients.CONTRACTOR, TOKEN);
        UUID paidInvoice = invoice("PAID_ON_CHAIN", 400_000);
        paid(paidInvoice, 400_000, "confirmed", "sig-a");
        paid(paidInvoice, 400_000, "finalized", "sig-a");
        UUID detected = invoice("PAYMENT_DETECTED", 250_000);
        paid(detected, 250_000, "confirmed", "sig-b");
        invoice("AWAITING_PAYMENT", 1_000_000);
        invoice("DRAFT", 9_000_000);

        for (int refresh = 0; refresh < 2; refresh++) {
            mvc.perform(get("/api/v1/mobile/wallet/summary").header("Authorization", "Bearer " + TOKEN))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.availableBalanceMinor").value("0"))
                .andExpect(jsonPath("$.paidViaDemoWalletMinor").value("400000"))
                .andExpect(jsonPath("$.paidViaDemoWalletUsdc").value("0.40"))
                .andExpect(jsonPath("$.earnedLast7DaysUsdc").value("0.40"))
                // A confirmed-only payment and an unpaid invoice are pending, drafts are not.
                .andExpect(jsonPath("$.pendingBalanceMinor").value("1250000"))
                // Legacy ledger rows went to the demo wallet; new payments never do.
                .andExpect(jsonPath("$.paidToPersonalWalletMinor").value("0"))
                .andExpect(jsonPath("$.isDemoWallet").value(false))
                .andExpect(jsonPath("$.payoutWalletStatus").value("NOT_CONFIGURED"))
                .andExpect(jsonPath("$.demoRecipientAddress").value("Eiz8weAjGbquFPPw98EkgLeQyoRkH2i9hUzqLHh64dyr"))
                .andExpect(jsonPath("$.walletAddress").doesNotExist())
                .andExpect(jsonPath("$.network").value("devnet"));
        }
        mvc.perform(get("/api/v1/mobile/wallet/transactions").header("Authorization", "Bearer " + TOKEN))
            .andExpect(jsonPath("$.length()").value(1))
            .andExpect(jsonPath("$[0].signature").value("sig-a"));

        jdbc.update("insert into talent_profiles(contractor_id,display_name,headline) values('contractor-wallet-other','Other','')");
        session("contractor-wallet-other", OTHER_TOKEN);
        mvc.perform(get("/api/v1/mobile/wallet/summary").header("Authorization", "Bearer " + OTHER_TOKEN))
            .andExpect(jsonPath("$.paidViaDemoWalletMinor").value("0"))
            .andExpect(jsonPath("$.pendingBalanceMinor").value("0"));
        mvc.perform(get("/api/v1/mobile/wallet/summary")).andExpect(status().isUnauthorized());
    }

    @Test
    void coverIsStoredVersionedAndRemovable() throws Exception {
        session(TestRecipients.CONTRACTOR, TOKEN);
        byte[] png = {(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A, 0, 0};
        String coverUrl = com.jayway.jsonpath.JsonPath.read(mvc.perform(put("/api/v1/profile/me/cover")
                .header("Authorization", "Bearer " + TOKEN).contentType(MediaType.IMAGE_PNG).content(png))
            .andExpect(status().isOk())
            .andReturn().getResponse().getContentAsString(), "$.coverUrl");
        org.junit.jupiter.api.Assertions.assertTrue(coverUrl.startsWith("/api/v1/profile/" + TestRecipients.CONTRACTOR + "/cover?v="), coverUrl);
        mvc.perform(get("/api/v1/profile/me").header("Authorization", "Bearer " + TOKEN))
            .andExpect(jsonPath("$.coverUrl").value(coverUrl));
        mvc.perform(get("/api/v1/profile/{id}/cover", TestRecipients.CONTRACTOR))
            .andExpect(status().isOk());
        mvc.perform(put("/api/v1/profile/me/cover").header("Authorization", "Bearer " + TOKEN)
                .contentType(MediaType.IMAGE_PNG).content(new byte[] {1, 2, 3}))
            .andExpect(status().isUnsupportedMediaType());

        mvc.perform(delete("/api/v1/profile/me/cover").header("Authorization", "Bearer " + TOKEN))
            .andExpect(status().isOk()).andExpect(jsonPath("$.coverUrl").doesNotExist());
        mvc.perform(get("/api/v1/profile/{id}/cover", TestRecipients.CONTRACTOR)).andExpect(status().isNotFound());
    }
}
