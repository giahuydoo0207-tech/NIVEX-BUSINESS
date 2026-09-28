package com.nova.backend.mobile;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class MobileAuthController {
    private final MobileAuthService auth;

    public MobileAuthController(MobileAuthService auth) {
        this.auth = auth;
    }

    @PostMapping("/register/email")
    @ResponseStatus(HttpStatus.CREATED)
    public MobileAuthService.MobileAuthSession registerEmail(@Valid @RequestBody EmailRegistration request, HttpServletResponse response) {
        noStore(response);
        return auth.registerEmail(request.email(), request.phoneE164(), request.displayName(), request.password());
    }

    @PostMapping("/login/email")
    public MobileAuthService.MobileAuthSession loginEmail(@Valid @RequestBody EmailLogin request, HttpServletResponse response) {
        noStore(response);
        return auth.loginEmail(request.email(), request.password());
    }

    @PostMapping("/refresh")
    public MobileAuthService.MobileAuthSession refresh(@Valid @RequestBody RefreshRequest request, HttpServletResponse response) {
        noStore(response);
        return auth.refresh(request.refreshToken());
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(@RequestHeader(name = "Authorization", required = false) String authorization,
                       @RequestBody(required = false) LogoutRequest request) {
        auth.logout(authorization, request == null ? null : request.refreshToken());
    }

    @PostMapping("/phone/request-otp")
    public MobileAuthService.PhoneChallenge requestPhoneOtp(@Valid @RequestBody PhoneOtpRequest request, HttpServletResponse response) {
        noStore(response);
        return auth.requestPhoneOtp(request.phoneE164());
    }

    @PostMapping("/phone/verify-otp")
    public MobileAuthService.MobileAuthSession verifyPhoneOtp(@Valid @RequestBody PhoneOtpVerification request, HttpServletResponse response) {
        noStore(response);
        return auth.verifyPhoneOtp(request.challengeId(), request.code(), request.displayName());
    }

    @GetMapping("/me")
    public MobileAuthService.MobileAccountView me(@RequestHeader(name = "Authorization", required = false) String authorization, HttpServletResponse response) {
        noStore(response);
        return auth.me(authorization);
    }

    private void noStore(HttpServletResponse response) {
        response.setHeader("Cache-Control", "no-store");
    }

    public record EmailRegistration(
        @NotBlank @Email @Size(max = 254) String email,
        @NotBlank @Pattern(regexp = "^\\+[1-9][0-9]{7,14}$") String phoneE164,
        @NotBlank @Size(min = 2, max = 160) String displayName,
        @NotBlank @Size(min = 8, max = 128) String password
    ) {}

    public record EmailLogin(
        @NotBlank @Email @Size(max = 254) String email,
        @NotBlank @Size(min = 8, max = 128) String password
    ) {}

    public record RefreshRequest(
        @NotBlank @Pattern(regexp = "^[A-Za-z0-9_-]{43,128}$") String refreshToken
    ) {}

    public record LogoutRequest(String refreshToken) {}

    public record PhoneOtpRequest(
        @NotBlank @Pattern(regexp = "^\\+[1-9][0-9]{7,14}$") String phoneE164
    ) {}

    public record PhoneOtpVerification(
        @NotNull UUID challengeId,
        @NotBlank @Pattern(regexp = "^[0-9]{6}$") String code,
        @NotBlank @Size(min = 2, max = 160) String displayName
    ) {}
}
