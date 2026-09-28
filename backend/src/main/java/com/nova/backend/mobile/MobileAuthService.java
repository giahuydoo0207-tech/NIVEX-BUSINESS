package com.nova.backend.mobile;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class MobileAuthService {
    private static final UUID DEFAULT_ORGANIZATION = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final int PASSWORD_ITERATIONS = 210_000;
    private static final int DERIVED_KEY_BITS = 256;
    private final JdbcTemplate jdbc;
    private final MobileSessionAuthenticator sessions;
    private final SecureRandom random = new SecureRandom();
    private final int accessTtlSeconds;
    private final int refreshTtlSeconds;
    private final int otpTtlSeconds;
    private final boolean debugOtp;

    public MobileAuthService(
        JdbcTemplate jdbc,
        MobileSessionAuthenticator sessions,
        @Value("${nova.auth.access-ttl-seconds:900}") int accessTtlSeconds,
        @Value("${nova.auth.refresh-ttl-seconds:2592000}") int refreshTtlSeconds,
        @Value("${nova.auth.otp-ttl-seconds:300}") int otpTtlSeconds,
        @Value("${nova.auth.debug-otp:false}") boolean debugOtp
    ) {
        this.jdbc = jdbc;
        this.sessions = sessions;
        this.accessTtlSeconds = positive(accessTtlSeconds, "access TTL");
        this.refreshTtlSeconds = positive(refreshTtlSeconds, "refresh TTL");
        this.otpTtlSeconds = positive(otpTtlSeconds, "OTP TTL");
        this.debugOtp = debugOtp;
    }

    @Transactional
    public MobileAuthSession registerEmail(String email, String phone, String displayName, String password) {
        String normalizedEmail = email(email);
        String normalizedPhone = phone(phone);
        requirePassword(password);
        if (findByEmail(normalizedEmail).isPresent() || findByPhone(normalizedPhone).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An account already exists for this email or phone");
        }
        return issue(createAccount(normalizedEmail, normalizedPhone, displayName, password));
    }

    @Transactional
    public MobileAuthSession loginEmail(String email, String password) {
        String normalizedEmail = email(email);
        Account account = findByEmail(normalizedEmail)
            .orElseThrow(() -> unauthorized());
        if (account.passwordHash() == null || !verifySecret(password, account.passwordHash())) {
            throw unauthorized();
        }
        return issue(account);
    }

    @Transactional
    public PhoneChallenge requestPhoneOtp(String phone) {
        String normalizedPhone = phone(phone);
        jdbc.update(
            "update mobile_phone_otp_challenges set consumed_at=now() where phone_e164=? and consumed_at is null",
            normalizedPhone
        );
        String code = String.format(Locale.ROOT, "%06d", random.nextInt(1_000_000));
        UUID id = UUID.randomUUID();
        jdbc.update(
            "insert into mobile_phone_otp_challenges(id, phone_e164, code_hash, expires_at) values (?, ?, ?, now() + (? * interval '1 second'))",
            id, normalizedPhone, hashSecret(code), otpTtlSeconds
        );
        return new PhoneChallenge(id, otpTtlSeconds, debugOtp ? code : null);
    }

    @Transactional
    public MobileAuthSession verifyPhoneOtp(UUID challengeId, String code, String displayName) {
        if (code == null || !code.matches("^[0-9]{6}$")) throw unauthorized();
        OtpChallenge challenge = jdbc.query(
            "select phone_e164, code_hash, expires_at, attempt_count, consumed_at from mobile_phone_otp_challenges where id=? for update",
            (rs, row) -> new OtpChallenge(rs.getString(1), rs.getString(2), rs.getTimestamp(3).toInstant(), rs.getInt(4), rs.getTimestamp(5) == null),
            challengeId
        ).stream().findFirst().orElseThrow(this::unauthorized);
        if (!challenge.isActive() || challenge.expiresAt().isBefore(Instant.now()) || challenge.attemptCount() >= 5) {
            throw unauthorized();
        }
        if (!verifySecret(code, challenge.codeHash())) {
            jdbc.update("update mobile_phone_otp_challenges set attempt_count=least(attempt_count + 1, 5) where id=?", challengeId);
            throw unauthorized();
        }
        jdbc.update("update mobile_phone_otp_challenges set consumed_at=now() where id=? and consumed_at is null", challengeId);
        Account account = findByPhone(challenge.phone())
            .orElseGet(() -> createAccount(null, challenge.phone(), displayName, null));
        return issue(account);
    }

    @Transactional
    public MobileAuthSession refresh(String refreshToken) {
        if (!validToken(refreshToken)) throw unauthorized();
        Account account = jdbc.query(
            accountSelect() + " join mobile_refresh_tokens r on r.account_id=a.id where r.token_hash=? and r.revoked_at is null and r.expires_at>now() for update of r",
            this::account,
            MobileSessionAuthenticator.hashToken(refreshToken)
        ).stream().findFirst().orElseThrow(this::unauthorized);
        jdbc.update("update mobile_refresh_tokens set revoked_at=now() where token_hash=? and revoked_at is null", MobileSessionAuthenticator.hashToken(refreshToken));
        return issue(account);
    }

    public MobileAccountView me(String authorization) {
        var scope = sessions.authenticate(authorization);
        Account account = jdbc.query(
            accountSelect() + " where a.contractor_id=?",
            this::account,
            scope.contractorId()
        ).stream().findFirst().orElseThrow(this::unauthorized);
        return new MobileAccountView(account.id(), account.email(), account.phone(), account.displayName(), account.headline());
    }

    /**
     * Revokes the presented access token and refresh token. Both are optional so a client whose
     * access token already expired can still revoke the long-lived refresh token.
     */
    @Transactional
    public void logout(String authorization, String refreshToken) {
        if (authorization != null && authorization.matches("Bearer [A-Za-z0-9_-]{43,128}")) {
            String hash = MobileSessionAuthenticator.hashToken(authorization.substring(7));
            jdbc.update("update mobile_sessions set revoked_at=now() where token_hash=? and revoked_at is null", hash);
        }
        if (validToken(refreshToken)) {
            jdbc.update("update mobile_refresh_tokens set revoked_at=now() where token_hash=? and revoked_at is null",
                MobileSessionAuthenticator.hashToken(refreshToken));
        }
    }

    private Account createAccount(String email, String phone, String displayName, String password) {
        String name = displayName(displayName);
        String contractorId = "contractor-" + UUID.randomUUID();
        UUID accountId = UUID.randomUUID();
        String handle = "member-" + accountId.toString().substring(0, 8);
        String headline = "Nova member";
        String passwordHash = password == null ? null : hashSecret(password);
        jdbc.update(
            "insert into talent_profiles(contractor_id, display_name, headline, email) values (?, ?, ?, ?)",
            contractorId, name, headline, email
        );
        jdbc.update(
            "insert into community_profiles(id, kind, display_name, handle, headline) values (?, 'FREELANCER', ?, ?, ?)",
            contractorId, name, handle, headline
        );
        jdbc.update(
            "insert into mobile_accounts(id, organization_id, contractor_id, email_normalized, phone_e164, password_hash) values (?, ?, ?, ?, ?, ?)",
            accountId, DEFAULT_ORGANIZATION, contractorId, email, phone, passwordHash
        );
        return new Account(accountId, DEFAULT_ORGANIZATION, contractorId, email, phone, passwordHash, name, headline);
    }

    private MobileAuthSession issue(Account account) {
        String accessToken = token();
        String refreshToken = token();
        Instant accessExpiresAt = Instant.now().plusSeconds(accessTtlSeconds);
        jdbc.update(
            "insert into mobile_sessions(token_hash, organization_id, contractor_id, expires_at) values (?, ?, ?, ?)",
            MobileSessionAuthenticator.hashToken(accessToken), account.organizationId(), account.contractorId(), java.sql.Timestamp.from(accessExpiresAt)
        );
        jdbc.update(
            "insert into mobile_refresh_tokens(token_hash, account_id, expires_at) values (?, ?, ?)",
            MobileSessionAuthenticator.hashToken(refreshToken), account.id(), java.sql.Timestamp.from(Instant.now().plusSeconds(refreshTtlSeconds))
        );
        return new MobileAuthSession(accessToken, refreshToken, accessExpiresAt);
    }

    private Optional<Account> findByEmail(String email) {
        return jdbc.query(accountSelect() + " where a.email_normalized=?", this::account, email).stream().findFirst();
    }

    private Optional<Account> findByPhone(String phone) {
        return jdbc.query(accountSelect() + " where a.phone_e164=?", this::account, phone).stream().findFirst();
    }

    private String accountSelect() {
        return "select a.id, a.organization_id, a.contractor_id, a.email_normalized, a.phone_e164, a.password_hash, t.display_name, t.headline from mobile_accounts a join talent_profiles t on t.contractor_id=a.contractor_id";
    }

    private Account account(java.sql.ResultSet rs, int row) throws java.sql.SQLException {
        return new Account(rs.getObject(1, UUID.class), rs.getObject(2, UUID.class), rs.getString(3), rs.getString(4), rs.getString(5), rs.getString(6), rs.getString(7), rs.getString(8));
    }

    private String token() {
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String email(String value) {
        if (value == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Valid email is required");
        String normalized = value.trim().toLowerCase(Locale.ROOT);
        if (!normalized.matches("^[^@\\s]{1,64}@[A-Za-z0-9.-]{1,190}\\.[A-Za-z]{2,63}$")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Valid email is required");
        }
        return normalized;
    }

    private String phone(String value) {
        if (value == null || !value.matches("^\\+[1-9][0-9]{7,14}$")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Phone must use E.164 format");
        }
        return value;
    }

    private String displayName(String value) {
        String normalized = value == null ? "" : value.trim();
        if (normalized.length() < 2 || normalized.length() > 160) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Display name must contain 2 to 160 characters");
        }
        return normalized;
    }

    private void requirePassword(String password) {
        if (password == null || password.length() < 8 || password.length() > 128) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password must contain 8 to 128 characters");
        }
    }

    private boolean validToken(String value) {
        return value != null && value.matches("^[A-Za-z0-9_-]{43,128}$");
    }

    private String hashSecret(String value) {
        try {
            byte[] salt = new byte[16];
            random.nextBytes(salt);
            byte[] derived = derive(value.toCharArray(), salt, PASSWORD_ITERATIONS);
            return "pbkdf2-sha256$" + PASSWORD_ITERATIONS + "$" + Base64.getEncoder().encodeToString(salt) + "$" + Base64.getEncoder().encodeToString(derived);
        } catch (Exception exception) {
            throw new IllegalStateException("Unable to hash credential", exception);
        }
    }

    private boolean verifySecret(String value, String stored) {
        try {
            String[] parts = stored.split("\\$", -1);
            if (parts.length != 4 || !"pbkdf2-sha256".equals(parts[0])) return false;
            int iterations = Integer.parseInt(parts[1]);
            if (iterations < 100_000 || iterations > 1_000_000) return false;
            byte[] expected = Base64.getDecoder().decode(parts[3]);
            byte[] actual = derive(value.toCharArray(), Base64.getDecoder().decode(parts[2]), iterations);
            return MessageDigest.isEqual(expected, actual);
        } catch (Exception exception) {
            return false;
        }
    }

    private byte[] derive(char[] secret, byte[] salt, int iterations) throws Exception {
        PBEKeySpec spec = new PBEKeySpec(secret, salt, iterations, DERIVED_KEY_BITS);
        try {
            return SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256").generateSecret(spec).getEncoded();
        } finally {
            spec.clearPassword();
        }
    }

    private int positive(int value, String label) {
        if (value < 60) throw new IllegalArgumentException(label + " must be at least one minute");
        return value;
    }

    private ResponseStatusException unauthorized() {
        return new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email, password, or session");
    }

    public record MobileAuthSession(String accessToken, String refreshToken, Instant accessExpiresAt) {}
    public record PhoneChallenge(UUID challengeId, int expiresInSeconds, String debugOtp) {}
    public record MobileAccountView(UUID id, String email, String phoneE164, String displayName, String headline) {}
    private record Account(UUID id, UUID organizationId, String contractorId, String email, String phone, String passwordHash, String displayName, String headline) {}
    private record OtpChallenge(String phone, String codeHash, Instant expiresAt, int attemptCount, boolean isActive) {}
}
