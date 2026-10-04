package com.nova.backend.mobile;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class MobileAuthControllerTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;

    @Test
    void registersLogsInRotatesRefreshTokensAndScopesMe() throws Exception {
        String suffix = Long.toUnsignedString(System.nanoTime());
        String email = "member-" + suffix + "@example.test";
        String phone = "+84901" + suffix.substring(Math.max(0, suffix.length() - 7));
        MvcResult registered = mvc.perform(post("/api/v1/auth/register/email")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"email":"%s","phoneE164":"%s","displayName":"Gia Huy","password":"nova-demo-password"}
                    """.formatted(email, phone)))
            .andExpect(status().isCreated())
            .andExpect(header().string("Cache-Control", "no-store"))
            .andExpect(jsonPath("$.accessToken").isString())
            .andExpect(jsonPath("$.refreshToken").isString())
            .andReturn();
        String accessToken = value(registered, "accessToken");
        String refreshToken = value(registered, "refreshToken");

        mvc.perform(get("/api/v1/auth/me").header("Authorization", "Bearer " + accessToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.displayName").value("Gia Huy"));

        MvcResult loggedIn = mvc.perform(post("/api/v1/auth/login/email")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"%s\",\"password\":\"nova-demo-password\"}".formatted(email)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.accessToken").isString())
            .andReturn();
        String newAccessToken = value(loggedIn, "accessToken");
        org.junit.jupiter.api.Assertions.assertNotEquals(accessToken, newAccessToken);

        MvcResult refreshed = mvc.perform(post("/api/v1/auth/refresh")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"refreshToken\":\"%s\"}".formatted(refreshToken)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.accessToken").isString())
            .andReturn();
        org.junit.jupiter.api.Assertions.assertNotEquals(accessToken, value(refreshed, "accessToken"));

        mvc.perform(post("/api/v1/auth/refresh")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"refreshToken\":\"%s\"}".formatted(refreshToken)))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void logoutRevokesAccessAndRefreshTokens() throws Exception {
        String suffix = Long.toUnsignedString(System.nanoTime());
        MvcResult registered = mvc.perform(post("/api/v1/auth/register/email")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"email":"logout-%s@example.test","phoneE164":"+84903%s","displayName":"Logout Member","password":"nova-demo-password"}
                    """.formatted(suffix, suffix.substring(Math.max(0, suffix.length() - 7)))))
            .andExpect(status().isCreated())
            .andReturn();
        String accessToken = value(registered, "accessToken");
        String refreshToken = value(registered, "refreshToken");

        mvc.perform(post("/api/v1/auth/logout")
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"refreshToken\":\"%s\"}".formatted(refreshToken)))
            .andExpect(status().isNoContent());

        mvc.perform(get("/api/v1/auth/me").header("Authorization", "Bearer " + accessToken))
            .andExpect(status().isUnauthorized());
        mvc.perform(post("/api/v1/auth/refresh")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"refreshToken\":\"%s\"}".formatted(refreshToken)))
            .andExpect(status().isUnauthorized());
    }

    private String value(MvcResult result, String field) throws Exception {
        JsonNode root = json.readTree(result.getResponse().getContentAsString());
        return root.required(field).asText();
    }
}
