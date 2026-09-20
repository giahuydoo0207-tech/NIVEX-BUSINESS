package com.nova.backend.api;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
@AutoConfigureMockMvc
class JobControllerTest {
    @Autowired
    private MockMvc mvc;

    @Test
    void healthEndpointReportsV1() throws Exception {
        mvc.perform(get("/api/v1/health"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.ok").value(true))
            .andExpect(jsonPath("$.version").value("v1"));
    }

    @Test
    void allowsTheLocalBusinessClientThroughCors() throws Exception {
        mvc.perform(options("/api/v1/jobs")
                .header("Origin", "http://localhost:3000")
                .header("Access-Control-Request-Method", "POST"))
            .andExpect(status().isOk())
            .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers
                .header().string("Access-Control-Allow-Origin", "http://localhost:3000"));
    }

    @Test
    void createsDraftJobAgainstPostgres() throws Exception {
        mvc.perform(post("/api/v1/jobs")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "organizationId": "00000000-0000-0000-0000-000000000001",
                      "title": "Backend Integration Engineer",
                      "category": "Engineering",
                      "summary": "Connect Nova clients to the shared API.",
                      "budgetMinMinor": 100000000,
                      "budgetMaxMinor": 200000000,
                      "locationScope": "Remote",
                      "applicationDeadline": "2026-10-01"
                    }
                    """))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.title").value("Backend Integration Engineer"))
            .andExpect(jsonPath("$.status").value("DRAFT"))
            .andExpect(jsonPath("$.currency").value("USDC"));
    }

    @Test
    void createsAndIssuesAnInvoiceWithoutDuplicatingTheCommand() throws Exception {
        String createKey = "invoice-api-test-" + UUID.randomUUID();
        String issueKey = "invoice-issue-test-" + UUID.randomUUID();
        String body = """
            {
              "contractorId": "contractor-tran-quoc-bao",
              "description": "Backend API integration milestone",
              "amountMinor": "125000000",
              "dueDate": "2026-10-15"
            }
            """;

        String invoiceId = mvc.perform(post("/api/v1/invoices")
                .header("Idempotency-Key", createKey)
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.status").value("DRAFT"))
            .andExpect(jsonPath("$.amountMinor").value("125000000"))
            .andReturn()
            .getResponse()
            .getContentAsString()
            .replaceAll(".*\\\"id\\\":\\\"([^\\\"]+)\\\".*", "$1");

        mvc.perform(post("/api/v1/invoices")
                .header("Idempotency-Key", createKey)
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(invoiceId));

        mvc.perform(get("/api/v1/invoices"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].id").value(invoiceId));

        mvc.perform(post("/api/v1/invoices/{invoiceId}/issue", invoiceId)
                .header("Idempotency-Key", issueKey))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.invoice.status").value("ISSUED"))
            .andExpect(jsonPath("$.paymentRequest.status").value("CREATED"))
            .andExpect(jsonPath("$.paymentRequest.network").value("Solana Devnet"));
    }
}
