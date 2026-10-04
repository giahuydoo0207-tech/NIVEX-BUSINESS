package com.nova.backend.credential;

import com.nova.backend.mobile.MobileSessionAuthenticator;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.Base64;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Pattern;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class NovaCredentialService {
    // Uppercase letters and digits without 0/O, 1/I/L so an ID can be read aloud or retyped.
    static final String NOVA_ID_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
    static final Pattern NOVA_ID = Pattern.compile("^NVB-[2-9A-HJKMNP-Z]{8}$");
    // 32 random bytes = 256 bits, base64url without padding = 43 characters.
    static final Pattern NOVA_KEY = Pattern.compile("^nvk_[A-Za-z0-9_-]{43}$");
    private static final int NOVA_ID_LENGTH = 8;
    private static final int MAX_ID_ATTEMPTS = 5;

    private final JdbcTemplate jdbc;
    private final SecureRandom random = new SecureRandom();

    public NovaCredentialService(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    /** Returns the organization's credential row, issuing its Nova ID on first use. */
    @Transactional
    public Credential status(UUID organizationId) {
        return find(organizationId).orElseGet(() -> provision(organizationId));
    }

    /** Creates the first key or replaces the active one; the previous key stops verifying immediately. */
    @Transactional
    public IssuedKey issueKey(UUID organizationId) {
        status(organizationId);
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        String key = "nvk_" + Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        jdbc.update("update organization_nova_credentials set key_hash=?, key_hint=?, key_created_at=now(), key_last_used_at=null, " +
                "key_revoked_at=null, updated_at=now() where organization_id=?",
            MobileSessionAuthenticator.hashToken(key), key.substring(key.length() - 4), organizationId);
        return new IssuedKey(key, find(organizationId).orElseThrow());
    }

    @Transactional
    public Credential revokeKey(UUID organizationId) {
        status(organizationId);
        int revoked = jdbc.update("update organization_nova_credentials set key_hash=null, key_revoked_at=now(), updated_at=now() " +
            "where organization_id=? and key_hash is not null", organizationId);
        if (revoked == 0) throw new ResponseStatusException(HttpStatus.CONFLICT, "No active Nova Key to revoke");
        return find(organizationId).orElseThrow();
    }

    /** Empty for every failure (unknown ID, wrong key, revoked key) so callers cannot tell them apart. */
    @Transactional
    public Optional<VerifiedIdentity> verify(String novaId, String novaKey) {
        if (novaId == null || novaKey == null) return Optional.empty();
        String id = novaId.trim().toUpperCase(Locale.ROOT);
        // Hash before looking anything up so a well-formed unknown ID costs the same as a wrong key.
        byte[] presented = MobileSessionAuthenticator.hashToken(novaKey).getBytes(StandardCharsets.US_ASCII);
        if (!NOVA_ID.matcher(id).matches() || !NOVA_KEY.matcher(novaKey).matches()) return Optional.empty();
        Optional<StoredKey> stored = jdbc.query(
            "select c.organization_id, c.public_nova_id, c.key_hash, coalesce(p.display_name, o.trading_name) display_name " +
                "from organization_nova_credentials c join organizations o on o.id=c.organization_id " +
                "left join business_profiles p on p.organization_id=c.organization_id " +
                "where c.public_nova_id=? and c.key_hash is not null for update of c",
            (rs, row) -> new StoredKey(rs.getObject(1, UUID.class), rs.getString(2), rs.getString(3), rs.getString(4)), id)
            .stream().findFirst();
        if (stored.isEmpty() || !MessageDigest.isEqual(presented, stored.get().keyHash().getBytes(StandardCharsets.US_ASCII))) {
            return Optional.empty();
        }
        StoredKey match = stored.get();
        Instant verifiedAt = jdbc.queryForObject(
            "update organization_nova_credentials set key_last_used_at=now() where organization_id=? returning key_last_used_at",
            Timestamp.class, match.organizationId()).toInstant();
        return Optional.of(new VerifiedIdentity(true, "ORGANIZATION", match.organizationId(), match.publicNovaId(), match.displayName(), verifiedAt));
    }

    private Credential provision(UUID organizationId) {
        for (int attempt = 0; attempt < MAX_ID_ATTEMPTS; attempt++) {
            // DO NOTHING covers both a concurrent first request (same organization) and an ID collision;
            // in either case nothing is inserted and the transaction stays usable.
            jdbc.update("insert into organization_nova_credentials (organization_id, public_nova_id) " +
                "select id, ? from organizations where id=? on conflict do nothing", newNovaId(), organizationId);
            Optional<Credential> credential = find(organizationId);
            if (credential.isPresent()) return credential.get();
            Integer organizations = jdbc.queryForObject("select count(*) from organizations where id=?", Integer.class, organizationId);
            if (organizations == null || organizations == 0) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Organization not found");
        }
        throw new IllegalStateException("Could not allocate a unique Nova ID");
    }

    String newNovaId() {
        StringBuilder id = new StringBuilder("NVB-");
        for (int i = 0; i < NOVA_ID_LENGTH; i++) id.append(NOVA_ID_ALPHABET.charAt(random.nextInt(NOVA_ID_ALPHABET.length())));
        return id.toString();
    }

    private Optional<Credential> find(UUID organizationId) {
        return jdbc.query("select organization_id, public_nova_id, key_hash is not null active, key_hint, key_created_at, key_last_used_at, " +
                "key_revoked_at, created_at, updated_at from organization_nova_credentials where organization_id=?",
            this::map, organizationId).stream().findFirst();
    }

    private Credential map(ResultSet rs, int row) throws SQLException {
        Instant keyCreatedAt = instant(rs, "key_created_at");
        String status = rs.getBoolean("active") ? "ACTIVE" : keyCreatedAt == null ? "NOT_CREATED" : "REVOKED";
        return new Credential(rs.getObject("organization_id", UUID.class), rs.getString("public_nova_id"), instant(rs, "created_at"),
            new KeyState(status, "NOT_CREATED".equals(status) ? null : rs.getString("key_hint"), keyCreatedAt,
                instant(rs, "key_last_used_at"), instant(rs, "key_revoked_at")),
            instant(rs, "updated_at"));
    }

    private static Instant instant(ResultSet rs, String column) throws SQLException {
        Timestamp value = rs.getTimestamp(column);
        return value == null ? null : value.toInstant();
    }

    /** What the management UI may see: never the key or its hash. */
    public record Credential(UUID organizationId, String novaId, Instant novaIdIssuedAt, KeyState key, Instant updatedAt) {}
    public record KeyState(String status, String hint, Instant createdAt, Instant lastUsedAt, Instant revokedAt) {}
    public record IssuedKey(String novaKey, Credential credential) {}
    public record VerifiedIdentity(boolean verified, String subjectType, UUID subjectId, String publicNovaId, String displayName, Instant verifiedAt) {}
    private record StoredKey(UUID organizationId, String publicNovaId, String keyHash, String displayName) {}
}
