package com.nova.backend.mobile;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
public class MobileSessionAuthenticator {
    private final JdbcTemplate jdbc;
    public MobileSessionAuthenticator(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    public Scope authenticate(String authorization) {
        if (authorization == null || !authorization.matches("Bearer [A-Za-z0-9_-]{43,128}")) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Mobile session required");
        }
        var rows = jdbc.query("select organization_id, contractor_id from mobile_sessions where token_hash=? and revoked_at is null and expires_at>now()",
            (rs, row) -> new Scope(rs.getObject(1, UUID.class), rs.getString(2)), hashToken(authorization.substring(7)));
        if (rows.isEmpty()) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Mobile session expired or invalid");
        return rows.getFirst();
    }

    public static String hashToken(String token) {
        try { return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8))); }
        catch (NoSuchAlgorithmException exception) { throw new IllegalStateException(exception); }
    }
    public record Scope(UUID organizationId, String contractorId) {}
}
