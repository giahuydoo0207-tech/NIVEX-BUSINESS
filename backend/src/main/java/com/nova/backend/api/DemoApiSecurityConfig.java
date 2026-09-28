package com.nova.backend.api;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.web.servlet.HandlerInterceptor;
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
            .addPathPatterns("/api/v1/invoices/**", "/api/v1/payment-requests/**", "/api/v1/community/**", "/api/v1/business/**", "/api/v1/applications/**", "/api/v1/messages/**", "/api/v1/notifications/**");
        // The job board stays readable by Nova Mobile, but creating jobs is a business action.
        registry.addInterceptor(new HandlerInterceptor() {
            @Override
            public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
                return HttpMethod.GET.matches(request.getMethod()) || interceptor.preHandle(request, response, handler);
            }
        }).addPathPatterns("/api/v1/jobs", "/api/v1/jobs/**");
    }
}
