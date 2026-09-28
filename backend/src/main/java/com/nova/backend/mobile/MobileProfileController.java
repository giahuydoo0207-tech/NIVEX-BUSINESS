package com.nova.backend.mobile;

import com.nova.backend.community.CommunityPost;
import com.nova.backend.community.CommunityRepository;
import java.util.List;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/profile")
public class MobileProfileController {
    private final JdbcTemplate jdbc;
    private final MobileSessionAuthenticator sessions;
    private final CommunityRepository community;

    public MobileProfileController(JdbcTemplate jdbc, MobileSessionAuthenticator sessions, CommunityRepository community) {
        this.jdbc = jdbc; this.sessions = sessions; this.community = community;
    }

    @GetMapping("/me")
    public ProfileView me(@RequestHeader(value = "Authorization", required = false) String authorization) {
        return profile(sessions.authenticate(authorization).contractorId());
    }

    @GetMapping("/{userId}")
    public WallView wall(@RequestHeader(value = "Authorization", required = false) String authorization, @PathVariable String userId) {
        String viewer = sessions.authenticate(authorization).contractorId();
        ProfileView profile = profile(userId);
        return new WallView(profile, community.authorPosts(userId, viewer, 50));
    }

    @PatchMapping("/me")
    public ProfileView update(@RequestHeader(value = "Authorization", required = false) String authorization, @RequestBody UpdateRequest request) {
        String id = sessions.authenticate(authorization).contractorId();
        String name = require(request.displayName(), 2, 160, "displayName");
        String headline = require(request.headline(), 0, 240, "headline");
        String bio = require(request.bio(), 0, 5000, "bio");
        jdbc.update("update community_profiles set display_name=?, headline=?, bio=?, avatar_url=coalesce(?, avatar_url), updated_at=now() where id=?", name, headline, bio, acceptedAvatarUrl(id, request.avatarUrl()), id);
        jdbc.update("update talent_profiles set display_name=?, headline=? where contractor_id=?", name, headline, id);
        return profile(id);
    }

    @PutMapping(value = "/me/avatar", consumes = MediaType.IMAGE_JPEG_VALUE)
    public ProfileView avatarJpeg(@RequestHeader(value = "Authorization", required = false) String authorization, @RequestBody byte[] bytes) { return saveAvatar(authorization, bytes, MediaType.IMAGE_JPEG_VALUE); }
    @PutMapping(value = "/me/avatar", consumes = MediaType.IMAGE_PNG_VALUE)
    public ProfileView avatarPng(@RequestHeader(value = "Authorization", required = false) String authorization, @RequestBody byte[] bytes) { return saveAvatar(authorization, bytes, MediaType.IMAGE_PNG_VALUE); }
    @PutMapping(value = "/me/avatar", consumes = "image/webp")
    public ProfileView avatarWebp(@RequestHeader(value = "Authorization", required = false) String authorization, @RequestBody byte[] bytes) { return saveAvatar(authorization, bytes, "image/webp"); }
    @PutMapping(value = "/me/avatar", consumes = MediaType.APPLICATION_OCTET_STREAM_VALUE)
    public ProfileView avatarBinary(@RequestHeader(value = "Authorization", required = false) String authorization, @RequestBody byte[] bytes) { return saveAvatar(authorization, bytes, MediaType.APPLICATION_OCTET_STREAM_VALUE); }

    @GetMapping("/{userId}/avatar")
    public ResponseEntity<byte[]> avatar(@PathVariable String userId) {
        var rows = jdbc.query("select avatar_content_type, avatar_content from community_profiles where id=? and avatar_content is not null", (rs, row) -> new Avatar(rs.getString(1), rs.getBytes(2)), userId);
        if (rows.isEmpty()) return ResponseEntity.notFound().build();
        return ResponseEntity.ok().header(HttpHeaders.CACHE_CONTROL, "public, max-age=3600").contentType(MediaType.parseMediaType(rows.getFirst().type())).body(rows.getFirst().bytes());
    }

    private ProfileView profile(String id) {
        return jdbc.query("select id, display_name, headline, bio, avatar_url, (select count(*) from community_posts p where p.author_id=cp.id and p.deleted_at is null) from community_profiles cp where id=?", (rs, row) -> new ProfileView(rs.getString(1), rs.getString(2), rs.getString(3), rs.getString(4), avatarUrl(rs.getString(5)), rs.getLong(6)), id)
            .stream().findFirst().orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(HttpStatus.NOT_FOUND, "Profile not found"));
    }

    private ProfileView saveAvatar(String authorization, byte[] declared, String declaredType) {
        byte[] bytes = declared;
        if (bytes == null || bytes.length == 0 || bytes.length > 2_500_000) throw new org.springframework.web.server.ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid avatar");
        String type = sniffImageType(bytes);
        if (type == null) throw new org.springframework.web.server.ResponseStatusException(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "Avatar must be a PNG, JPEG or WebP image");
        String id = sessions.authenticate(authorization).contractorId();
        // The version query changes on every upload so post, comment and chat avatars do not keep a
        // stale image from HTTP or Flutter image caches.
        String url = "/api/v1/profile/" + id + "/avatar?v=" + System.currentTimeMillis();
        jdbc.update("update community_profiles set avatar_content_type=?, avatar_content=?, avatar_url=?, updated_at=now() where id=?", type, bytes, url, id);
        return profile(id);
    }
    private String avatarUrl(String stored) { return stored == null || stored.isBlank() ? null : stored; }
    private static String sniffImageType(byte[] b) {
        if (b.length >= 3 && (b[0] & 0xff) == 0xff && (b[1] & 0xff) == 0xd8 && (b[2] & 0xff) == 0xff) return MediaType.IMAGE_JPEG_VALUE;
        if (b.length >= 8 && (b[0] & 0xff) == 0x89 && b[1] == 'P' && b[2] == 'N' && b[3] == 'G') return MediaType.IMAGE_PNG_VALUE;
        if (b.length >= 12 && b[0] == 'R' && b[1] == 'I' && b[2] == 'F' && b[3] == 'F' && b[8] == 'W' && b[9] == 'E' && b[10] == 'B' && b[11] == 'P') return "image/webp";
        return null;
    }
    private String require(String value, int min, int max, String field) { String v = value == null ? "" : value.trim(); if (v.length() < min || v.length() > max) throw new org.springframework.web.server.ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid " + field); return v; }
    /** Only an external HTTPS image or this profile's own uploaded avatar may be stored as the avatar URL. */
    private String acceptedAvatarUrl(String id, String value) {
        if (value == null || value.isBlank()) return null;
        String url = value.trim();
        if (url.length() > 2048) return null;
        return url.startsWith("https://") || url.startsWith("/api/v1/profile/" + id + "/avatar") ? url : null;
    }
    public record UpdateRequest(String displayName, String headline, String bio, String avatarUrl) {}
    public record ProfileView(String id, String displayName, String headline, String bio, String avatarUrl, long postCount) {}
    public record WallView(ProfileView profile, List<CommunityPost> posts) {}
    private record Avatar(String type, byte[] bytes) {}
}
