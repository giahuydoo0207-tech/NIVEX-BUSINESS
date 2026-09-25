package com.nova.backend.businessprofile;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest(properties = "nova.demo.api-key=test-profile-key")
@AutoConfigureMockMvc
@Transactional
class BusinessProfileControllerTest {
    @Autowired MockMvc mvc;

    @Test
    void readsUpdatesAndReplacesAnAvatarFromTheComputerLibrary() throws Exception {
        mvc.perform(get("/api/v1/business/profile"))
            .andExpect(status().isUnauthorized());

        mvc.perform(patch("/api/v1/business/profile")
                .header("X-Nova-Demo-Key", "test-profile-key")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Nova Labs\",\"category\":\"Fintech\",\"bio\":\"Hồ sơ đã cập nhật.\"}"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.bio").value("Hồ sơ đã cập nhật."));

        MockMultipartFile png = new MockMultipartFile("file", "nova-logo.png", MediaType.IMAGE_PNG_VALUE,
            new byte[] {(byte) 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a});
        String body = mvc.perform(multipart("/api/v1/business/profile/avatar").file(png)
                .header("X-Nova-Demo-Key", "test-profile-key"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.avatarUrl").isString())
            .andReturn().getResponse().getContentAsString();
        String assetPath = body.replaceFirst(".*\\\"avatarUrl\\\":\\\"([^\\\"]+)\\\".*", "$1");

        mvc.perform(get(assetPath)).andExpect(status().isOk())
            .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.content().contentType(MediaType.IMAGE_PNG));
    }

    @Test
    void rejectsAFileThatOnlyPretendsToBeAnImage() throws Exception {
        MockMultipartFile invalid = new MockMultipartFile("file", "not-an-image.png", MediaType.IMAGE_PNG_VALUE, "not an image".getBytes());
        mvc.perform(multipart("/api/v1/business/profile/cover").file(invalid)
                .header("X-Nova-Demo-Key", "test-profile-key"))
            .andExpect(status().isUnsupportedMediaType());
    }
}
