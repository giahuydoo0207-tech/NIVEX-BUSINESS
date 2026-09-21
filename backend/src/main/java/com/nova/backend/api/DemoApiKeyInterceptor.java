package com.nova.backend.api;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class DemoApiKeyInterceptor implements HandlerInterceptor {
    private final String apiKey;

    public DemoApiKeyInterceptor(@Value("${nova.demo.api-key:}") String apiKey) {
        this.apiKey = apiKey == null ? "" : apiKey;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        if (HttpMethod.OPTIONS.matches(request.getMethod())) {
            return true;
        }
        String provided = request.getHeader("X-Nova-Demo-Key");
        if (matches(provided)) {
            return true;
        }
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json");
        response.getWriter().write("{\"message\":\"Demo API key is required.\"}");
        return false;
    }

    private boolean matches(String provided) {
        if (apiKey.isBlank() || provided == null || provided.isBlank()) {
            return false;
        }
        return MessageDigest.isEqual(
            apiKey.getBytes(StandardCharsets.UTF_8),
            provided.getBytes(StandardCharsets.UTF_8)
        );
    }
}
