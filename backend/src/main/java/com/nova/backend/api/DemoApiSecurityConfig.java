package com.nova.backend.api;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class DemoApiSecurityConfig implements WebMvcConfigurer {
    private final DemoApiKeyInterceptor interceptor;

    public DemoApiSecurityConfig(DemoApiKeyInterceptor interceptor) {
        this.interceptor = interceptor;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(interceptor)
            .addPathPatterns("/api/v1/invoices/**", "/api/v1/payment-requests/**", "/api/v1/community/**", "/api/v1/business/**", "/api/v1/applications/**");
    }
}
