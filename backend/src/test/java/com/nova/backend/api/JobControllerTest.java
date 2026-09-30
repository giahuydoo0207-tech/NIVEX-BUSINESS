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

@SpringBootTest(
    webEnvironment = SpringBootTest.WebEnvironment.MOCK,
    properties = "nova.demo.api-key=test-demo-key"
)
@AutoConfigureMockMvc
@org.springframework.transaction.annotation.Transactional
class JobControllerTest {
    private static final String DEMO_KEY = "test-demo-key";

    @Autowired
    private MockMvc mvc;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbc;

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
    void creatingAJobRequiresTheBusinessKey() throws Exception {
        mvc.perform(post("/api/v1/jobs")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\":\"x\"}"))
            .andExpect(status().isUnauthorized());
        mvc.perform(get("/api/v1/jobs")).andExpect(status().isOk());
    }

    @Test
    void publishedBusinessJobAppearsOnTheMobileBoardWithTheOrganizationName() throws Exception {
        String jobId = mvc.perform(post("/api/v1/business/jobs")
                .header("X-Nova-Demo-Key", DEMO_KEY)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"title":"Solana Mobile Engineer","category":"Engineering","summary":"Ship wallet flows.",
                     "budgetMinMinor":100000000,"budgetMaxMinor":200000000,"locationScope":"Remote",
                     "applicationDeadline":"2099-01-01","skills":["Flutter","Solana"],"engagement":"contract",
                     "paymentType":"milestone","duration":"6 tuần"}
                    """))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.status").value("DRAFT"))
            .andExpect(jsonPath("$.skills[1]").value("Solana"))
            .andReturn().getResponse().getContentAsString().replaceFirst("^\\{\\\"id\\\":\\\"([^\\\"]+)\\\".*", "$1");

        mvc.perform(get("/api/v1/jobs"))
            .andExpect(jsonPath("$[?(@.id=='" + jobId + "')]").isEmpty());

        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch("/api/v1/business/jobs/{id}/status", jobId)
                .header("X-Nova-Demo-Key", DEMO_KEY)
                .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"published\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("PUBLISHED"))
            .andExpect(jsonPath("$.publishedAt").isNotEmpty());

        mvc.perform(get("/api/v1/jobs"))
            .andExpect(jsonPath("$[?(@.id=='" + jobId + "')].organizationName").value(org.hamcrest.Matchers.hasItem(org.hamcrest.Matchers.notNullValue())))
            .andExpect(jsonPath("$[?(@.id=='" + jobId + "')].engagement").value(org.hamcrest.Matchers.hasItem("CONTRACT")));

        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch("/api/v1/business/jobs/{id}/status", jobId)
                .header("X-Nova-Demo-Key", DEMO_KEY)
                .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"draft\"}"))
            .andExpect(status().isConflict());
    }

    @Test
    void rejectsPublishingAJobWhoseDeadlineHasPassed() throws Exception {
        mvc.perform(post("/api/v1/business/jobs")
                .header("X-Nova-Demo-Key", DEMO_KEY)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"title":"Expired","category":"Engineering","summary":"x","budgetMinMinor":1,"budgetMaxMinor":2,
                     "locationScope":"Remote","applicationDeadline":"2000-01-01","publish":true}
                    """))
            .andExpect(status().isBadRequest());
    }

    @Test
    void createsDraftJobAgainstPostgres() throws Exception {
        mvc.perform(post("/api/v1/jobs")
                .header("X-Nova-Demo-Key", DEMO_KEY)
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
        com.nova.backend.TestRecipients.acceptedApplication(jdbc, "accepted");
        // Issuing creates a payment request, which needs the contractor's payout wallet.
        com.nova.backend.TestRecipients.payoutWallet(jdbc, com.nova.backend.TestRecipients.CONTRACTOR, com.nova.backend.TestRecipients.WALLET);
        String body = """
            {
              "contractorId": "%s",
              "description": "Backend API integration milestone",
              "amountMinor": "125000000",
              "dueDate": "%s"
            }
            """.formatted(com.nova.backend.TestRecipients.CONTRACTOR, java.time.LocalDate.now().plusDays(14));

        String invoiceId = mvc.perform(post("/api/v1/invoices")
                .header("Idempotency-Key", createKey)
                .header("X-Nova-Demo-Key", DEMO_KEY)
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
                .header("X-Nova-Demo-Key", DEMO_KEY)
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(invoiceId));

        mvc.perform(get("/api/v1/invoices"))
            .andExpect(status().isUnauthorized());

        mvc.perform(get("/api/v1/invoices")
                .header("X-Nova-Demo-Key", DEMO_KEY))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].id").value(invoiceId));

        mvc.perform(post("/api/v1/invoices/{invoiceId}/issue", invoiceId)
                .header("Idempotency-Key", issueKey)
                .header("X-Nova-Demo-Key", DEMO_KEY))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.invoice.status").value("ISSUED"))
            .andExpect(jsonPath("$.paymentRequest.status").value("CREATED"))
            .andExpect(jsonPath("$.paymentRequest.network").value("Solana Devnet"));
    }
}
