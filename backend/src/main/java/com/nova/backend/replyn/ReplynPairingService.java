package com.nova.backend.replyn;

import com.nova.backend.mobile.MobileSessionAuthenticator;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.Base64;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Pattern;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * QR login challenges for Replyn, stored in PostgreSQL so every backend instance sees the same state.
 * PENDING -> APPROVED (Nova Mobile) -> CONSUMED (Replyn server), or EXPIRED once expires_at passes.
 * Every transition locks the row and is also guarded by a conditional UPDATE, so a replay or a
 * concurrent second request can never approve or consume a challenge twice.
 */
@Service
public class ReplynPairingService {
    static final String CLIENT_ID = "replyn";
    static final int TTL_SECONDS = 60;
    // 32 random bytes, base64url without padding.
    static final Pattern SECRET = Pattern.compile("^[A-Za-z0-9_-]{43}$");
    static final Pattern PAIRING_ID = Pattern.compile("^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$");
    // Expired rows are kept briefly for troubleshooting, then removed when new challenges are created.
    private static final int RETAIN_EXPIRED_SECONDS = 3600;

    private final JdbcTemplate jdbc;
    private final SecureRandom random = new SecureRandom();

    public ReplynPairingService(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    @Transactional
    public CreatedPairing create() {
        jdbc.update("delete from replyn_pairings where expires_at < now() - make_interval(secs => ?)", RETAIN_EXPIRED_SECONDS);
        UUID id = UUID.randomUUID();
        String qrSecret = secret();
        String browserSecret = secret();
        Instant expiresAt = jdbc.queryForObject(
            "insert into replyn_pairings (id, client_id, qr_secret_hash, browser_secret_hash, action, expires_at) " +
                "values (?, ?, ?, ?, 'LOGIN', now() + make_interval(secs => ?)) returning expires_at",
            Timestamp.class, id, CLIENT_ID, MobileSessionAuthenticator.hashToken(qrSecret),
            MobileSessionAuthenticator.hashToken(browserSecret), TTL_SECONDS).toInstant();
        return new CreatedPairing(id, qrSecret, browserSecret, expiresAt);
    }

    /** Binds a PENDING challenge to the Talent signed in on Nova Mobile. The identity never comes from the client. */
    @Transactional
    public Outcome approve(UUID id, String qrSecret, String contractorId) {
        Optional<Row> found = lock(id);
        if (found.isEmpty() || !matches(qrSecret, found.get().qrSecretHash())) return Outcome.NOT_FOUND;
        Row row = found.get();
        switch (row.status()) {
            case "APPROVED", "CONSUMED": return Outcome.ALREADY_USED;
            case "EXPIRED": return Outcome.EXPIRED;
            default: break;
        }
        if (row.expired()) return expire(id);
        Optional<String> displayName = jdbc.queryForList("select display_name from talent_profiles where contractor_id=?",
            String.class, contractorId).stream().findFirst();
        if (displayName.isEmpty()) return Outcome.NO_TALENT_PROFILE;
        int approved = jdbc.update("update replyn_pairings set status='APPROVED', contractor_id=?, display_name=?, approved_at=now() " +
            "where id=? and status='PENDING' and expires_at > now()", contractorId, displayName.get(), id);
        return approved == 1 ? Outcome.APPROVED : Outcome.ALREADY_USED;
    }

    /** Hands the approved identity to Replyn's server exactly once. */
    @Transactional
    public Consumed consume(UUID id, String browserSecret) {
        Optional<Row> found = lock(id);
        if (found.isEmpty() || !matches(browserSecret, found.get().browserSecretHash())) return new Consumed(Outcome.NOT_FOUND, null);
        Row row = found.get();
        switch (row.status()) {
            case "CONSUMED": return new Consumed(Outcome.ALREADY_USED, null);
            case "EXPIRED": return new Consumed(Outcome.EXPIRED, null);
            default: break;
        }
        if (row.expired()) return new Consumed(expire(id), null);
        if ("PENDING".equals(row.status())) return new Consumed(Outcome.PENDING, null);
        int consumed = jdbc.update("update replyn_pairings set status='CONSUMED', consumed_at=now() where id=? and status='APPROVED' and expires_at > now()", id);
        if (consumed != 1) return new Consumed(Outcome.ALREADY_USED, null);
        return new Consumed(Outcome.CONSUMED, new TalentIdentity(row.contractorId(), row.displayName(), row.approvedAt()));
    }

    private Outcome expire(UUID id) {
        jdbc.update("update replyn_pairings set status='EXPIRED' where id=? and status in ('PENDING', 'APPROVED')", id);
        return Outcome.EXPIRED;
    }

    private Optional<Row> lock(UUID id) {
        return jdbc.query("select qr_secret_hash, browser_secret_hash, status, expires_at <= now() expired, contractor_id, display_name, approved_at " +
                "from replyn_pairings where id=? and client_id=? for update",
            (rs, n) -> new Row(rs.getString(1), rs.getString(2), rs.getString(3), rs.getBoolean(4), rs.getString(5), rs.getString(6),
                rs.getTimestamp(7) == null ? null : rs.getTimestamp(7).toInstant()),
            id, CLIENT_ID).stream().findFirst();
    }

    /** Constant-time comparison of SHA-256 digests, so timing reveals neither the secret nor its length. */
    private static boolean matches(String presented, String storedHash) {
        return MessageDigest.isEqual(MobileSessionAuthenticator.hashToken(presented).getBytes(StandardCharsets.US_ASCII),
            storedHash.getBytes(StandardCharsets.US_ASCII));
    }

    private String secret() {
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    public enum Outcome { PENDING, APPROVED, CONSUMED, EXPIRED, ALREADY_USED, NOT_FOUND, NO_TALENT_PROFILE }

    public record CreatedPairing(UUID pairingId, String qrSecret, String browserSecret, Instant expiresAt) {
        @Override public String toString() { return "CreatedPairing[pairingId=" + pairingId + ", expiresAt=" + expiresAt + "]"; }
    }
    public record TalentIdentity(String contractorId, String displayName, Instant approvedAt) {}
    public record Consumed(Outcome outcome, TalentIdentity identity) {}
    private record Row(String qrSecretHash, String browserSecretHash, String status, boolean expired,
                       String contractorId, String displayName, Instant approvedAt) {}
}
