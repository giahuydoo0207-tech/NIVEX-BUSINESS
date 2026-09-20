package com.nova.backend.api;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
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
}
