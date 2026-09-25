package com.nova.backend.businessprofile;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public class BusinessProfileRepository {
    public static final UUID NOVA_LABS_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private final JdbcTemplate jdbc;

    public BusinessProfileRepository(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    public BusinessProfile current() { return find(NOVA_LABS_ID).orElseThrow(); }

    public Optional<BusinessProfile> find(UUID organizationId) {
        return jdbc.query("select o.id, o.handle, p.display_name, o.verified, o.network, p.category, p.bio, p.follower_count, p.updated_at, " +
                "(select id from business_profile_assets where organization_id=o.id and asset_type='AVATAR') avatar_id, " +
                "(select id from business_profile_assets where organization_id=o.id and asset_type='COVER') cover_id, " +
                "(select id from business_profile_assets where organization_id=o.id and asset_type='COVER_ORIGINAL') cover_original_id " +
                "from organizations o join business_profiles p on p.organization_id=o.id where o.id=?", this::map, organizationId)
            .stream().findFirst();
    }

    @Transactional
    public BusinessProfile update(String displayName, String category, String bio) {
        jdbc.update("update business_profiles set display_name=?, category=?, bio=?, updated_at=now() where organization_id=?",
            displayName.trim(), category.trim(), bio.trim(), NOVA_LABS_ID);
        return current();
    }

    @Transactional
    public BusinessProfile storeAsset(String assetType, String filename, String contentType, byte[] content) {
        store(assetType, filename, contentType, content);
        jdbc.update("update business_profiles set updated_at=now() where organization_id=?", NOVA_LABS_ID);
        return current();
    }

    @Transactional
    public BusinessProfile storeCoverAssets(String filename, String contentType, byte[] content,
                                            String originalFilename, String originalContentType, byte[] originalContent) {
        store("COVER", filename, contentType, content);
        store("COVER_ORIGINAL", originalFilename, originalContentType, originalContent);
        jdbc.update("update business_profiles set updated_at=now() where organization_id=?", NOVA_LABS_ID);
        return current();
    }

    private void store(String assetType, String filename, String contentType, byte[] content) {
        UUID id = UUID.randomUUID();
        jdbc.update("insert into business_profile_assets (id, organization_id, asset_type, file_name, content_type, byte_size, content) " +
                "values (?, ?, ?, ?, ?, ?, ?) on conflict (organization_id, asset_type) do update set id=excluded.id, file_name=excluded.file_name, " +
                "content_type=excluded.content_type, byte_size=excluded.byte_size, content=excluded.content, updated_at=now()",
            id, NOVA_LABS_ID, assetType, filename, contentType, content.length, content);
    }

    public Optional<BusinessProfileAsset> asset(UUID id) {
        return jdbc.query("select content_type, content from business_profile_assets where id=?",
            (rs, row) -> new BusinessProfileAsset(rs.getString(1), rs.getBytes(2)), id).stream().findFirst();
    }

    private BusinessProfile map(ResultSet rs, int row) throws SQLException {
        UUID avatarId = rs.getObject("avatar_id", UUID.class);
        UUID coverId = rs.getObject("cover_id", UUID.class);
        UUID coverOriginalId = rs.getObject("cover_original_id", UUID.class);
        return new BusinessProfile(rs.getObject("id", UUID.class), rs.getString("handle"), rs.getString("display_name"),
            rs.getBoolean("verified"), rs.getString("network"), rs.getString("category"), rs.getString("bio"),
            rs.getInt("follower_count"), assetUrl(avatarId), assetUrl(coverId), assetUrl(coverOriginalId), rs.getTimestamp("updated_at").toInstant());
    }

    private String assetUrl(UUID id) { return id == null ? null : "/media/business-profile/" + id; }
}
