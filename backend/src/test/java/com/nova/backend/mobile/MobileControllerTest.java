package com.nova.backend.mobile;

import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class MobileControllerTest {
    @Autowired MockMvc mvc;
    @Autowired JdbcTemplate jdbc;
    static final UUID ORG = UUID.fromString("00000000-0000-0000-0000-000000000001");
    static final String TOKEN = "a".repeat(43);

    void session() {
        jdbc.update("insert into mobile_sessions(token_hash,organization_id,contractor_id,expires_at) values(?,?,?,now()+interval '1 hour')",
            MobileController.hashToken(TOKEN), ORG, "alice");
    }

    void invoice(UUID organization, String contractor, String number, String status) {
        jdbc.update("insert into invoices(id,organization_id,contractor_id,invoice_number,description,amount_minor,due_date,status,idempotency_key) " +
            "values(?,?,?,?,?,10000,current_date+1,?,?)",
            UUID.randomUUID(), organization, contractor, number, "test", status, number);
    }

    @Test void rejectsMissingExpiredAndRevokedTokens() throws Exception {
        mvc.perform(get("/api/v1/mobile/invoices")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/v1/mobile/transactions").header("X-Nova-Demo-Key","anything")).andExpect(status().isUnauthorized());
        session();
        mvc.perform(get("/api/v1/mobile/me").header("Authorization","Bearer "+TOKEN))
            .andExpect(status().isOk()).andExpect(jsonPath("$.contractorId").value("alice"));
        jdbc.update("update mobile_sessions set expires_at=now()-interval '1 second'");
        mvc.perform(get("/api/v1/mobile/me").header("Authorization","Bearer "+TOKEN)).andExpect(status().isUnauthorized());
        jdbc.update("update mobile_sessions set expires_at=now()+interval '1 hour', revoked_at=now()");
        mvc.perform(get("/api/v1/mobile/me").header("Authorization","Bearer "+TOKEN)).andExpect(status().isUnauthorized());
    }

    @Test void isolatesOrganizationAndContractorAndHidesDrafts() throws Exception {
        session();
        UUID other = UUID.randomUUID();
        jdbc.update("insert into organizations(id,legal_name,trading_name,handle) values(?,?,?,?)",
            other,"Other","Other","other-"+other);
        invoice(ORG,"alice","mobile-alice","ISSUED");
        invoice(ORG,"bob","mobile-bob","ISSUED");
        invoice(other,"alice","mobile-other","ISSUED");
        invoice(ORG,"alice","mobile-draft","DRAFT");
        mvc.perform(get("/api/v1/mobile/invoices").param("contractorId","bob")
            .param("organizationId",other.toString()).header("Authorization","Bearer "+TOKEN))
            .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(1))
            .andExpect(header().string("Cache-Control","no-store"))
            .andExpect(jsonPath("$[0].invoiceNumber").value("mobile-alice"))
            .andExpect(jsonPath("$[0].amountMinor").value("10000"));
        mvc.perform(get("/api/v1/mobile/invoices").param("limit","101").header("Authorization","Bearer "+TOKEN))
            .andExpect(status().isBadRequest());
        mvc.perform(get("/api/v1/mobile/invoices").param("offset","1").header("Authorization","Bearer "+TOKEN))
            .andExpect(jsonPath("$.length()").value(0));
    }

    @Test void returnsOnlyFinalizedTransactionsForSessionScope() throws Exception {
        session();
        invoice(ORG,"alice","alice-final","PAID_ON_CHAIN");
        invoice(ORG,"alice","alice-pending","PAYMENT_DETECTED");
        invoice(ORG,"bob","bob-final","PAID_ON_CHAIN");
        var invoices = jdbc.queryForList("select id, invoice_number from invoices where invoice_number in ('alice-final','alice-pending','bob-final')");
        for (var invoice : invoices) {
            UUID payment = UUID.randomUUID();
            String number = invoice.get("invoice_number").toString();
            jdbc.update("insert into payment_requests(id,invoice_id) values(?,?)",payment,invoice.get("id"));
            jdbc.update("insert into payment_ledger_entries(payment_request_id,commitment,signature,recipient,mint,amount_minor,reference) " +
                "values(?,?,?,?,?,10000,?)",payment,number.equals("alice-pending")?"confirmed":"finalized",
                number,"recipient","mint","nova:"+payment);
        }
        mvc.perform(get("/api/v1/mobile/transactions").header("Authorization","Bearer "+TOKEN))
            .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(1))
            .andExpect(jsonPath("$[0].signature").value("alice-final"))
            .andExpect(jsonPath("$[0].amountMinor").value("10000"));
    }
}
