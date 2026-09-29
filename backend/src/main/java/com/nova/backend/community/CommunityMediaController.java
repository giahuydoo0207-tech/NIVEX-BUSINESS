package com.nova.backend.community;

import com.nova.backend.mobile.MobileSessionAuthenticator;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

/**
 * Community post media. Business Web uploads as the workspace (server-side key);
 * Nova Mobile uploads as the signed-in member. Both are served from the same URL
 * so a post looks identical on either client. Unreferenced uploads can be deleted
 * by their owner, e.g. when publishing fails after the upload.
 */
@RestController
public class CommunityMediaController {
    private static final String BUSINESS_ACTOR = "nova-labs";
    private static final long MAX_BYTES = 5L * 1024 * 1024;
    private static final List<String> ALLOWED_TYPES = List.of("image/jpeg", "image/png", "image/webp");
    private final JdbcTemplate jdbc;
    private final MobileSessionAuthenticator sessions;

    public CommunityMediaController(JdbcTemplate jdbc, MobileSessionAuthenticator sessions) {
        this.jdbc = jdbc;
        this.sessions = sessions;
    }

    @PostMapping(value = "/api/v1/community/media", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public UploadedMedia upload(@RequestPart("file") MultipartFile file) {
        if (file.isEmpty() || file.getSize() > MAX_BYTES || !ALLOWED_TYPES.contains(file.getContentType())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Use a PNG, JPEG, or WebP image under 5 MB");
        }
        try {
            return store(BUSINESS_ACTOR, file.getContentType(), file.getBytes());
        } catch (java.io.IOException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Could not read image upload", exception);
        }
    }

    @PostMapping(value = "/api/v1/mobile/media", consumes = {MediaType.IMAGE_JPEG_VALUE, MediaType.IMAGE_PNG_VALUE, "image/webp"})
    @ResponseStatus(HttpStatus.CREATED)
    public UploadedMedia uploadFromMobile(@RequestHeader(value = "Authorization", required = false) String authorization,
                                          @RequestBody byte[] bytes) {
        String owner = sessions.authenticate(authorization).contractorId();
        if (bytes == null || bytes.length == 0 || bytes.length > MAX_BYTES) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Use a PNG, JPEG, or WebP image under 5 MB");
        }
        String type = sniff(bytes);
        if (type == null) throw new ResponseStatusException(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "Use a PNG, JPEG, or WebP image");
        return store(owner, type, bytes);
    }

    @DeleteMapping("/api/v1/community/media/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteUnused(@PathVariable UUID id) { deleteUnreferenced(id, BUSINESS_ACTOR); }

    @DeleteMapping("/api/v1/mobile/media/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteUnusedFromMobile(@RequestHeader(value = "Authorization", required = false) String authorization,
                                       @PathVariable UUID id) {
        deleteUnreferenced(id, sessions.authenticate(authorization).contractorId());
    }

    @GetMapping("/media/community/{id}")
    public ResponseEntity<byte[]> media(@PathVariable UUID id) {
        return jdbc.query("select content_type, content from community_media where id=?", (resultSet, row) ->
            ResponseEntity.ok()
                .header(HttpHeaders.CACHE_CONTROL, "private, max-age=3600")
                .contentType(MediaType.parseMediaType(resultSet.getString("content_type")))
                .body(resultSet.getBytes("content")), id).stream().findFirst()
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Community media not found"));
    }

    private UploadedMedia store(String owner, String contentType, byte[] bytes) {
        UUID id = UUID.randomUUID();
        jdbc.update("insert into community_media (id, owner_id, content_type, content) values (?, ?, ?, ?)",
            id, owner, contentType, bytes);
        return new UploadedMedia("/media/community/" + id);
    }

    /** Media already attached to a post is kept; deleting it would break that post. */
    private void deleteUnreferenced(UUID id, String owner) {
        jdbc.update("delete from community_media m where m.id=? and m.owner_id=? and not exists "
            + "(select 1 from community_post_images i where i.image_url='/media/community/' || m.id::text)", id, owner);
    }

    private static String sniff(byte[] b) {
        if (b.length >= 3 && (b[0] & 0xff) == 0xff && (b[1] & 0xff) == 0xd8 && (b[2] & 0xff) == 0xff) return "image/jpeg";
        if (b.length >= 8 && (b[0] & 0xff) == 0x89 && b[1] == 'P' && b[2] == 'N' && b[3] == 'G') return "image/png";
        if (b.length >= 12 && b[0] == 'R' && b[1] == 'I' && b[2] == 'F' && b[3] == 'F' && b[8] == 'W' && b[9] == 'E' && b[10] == 'B' && b[11] == 'P') return "image/webp";
        return null;
    }

    public record UploadedMedia(String url) {}
}
