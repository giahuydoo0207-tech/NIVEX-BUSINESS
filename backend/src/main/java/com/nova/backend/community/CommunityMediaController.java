package com.nova.backend.community;

import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

/** Stores post media behind the same server-side workspace key as the Community API. */
@RestController
public class CommunityMediaController {
    private static final String BUSINESS_ACTOR = "nova-labs";
    private static final long MAX_BYTES = 5L * 1024 * 1024;
    private static final List<String> ALLOWED_TYPES = List.of("image/jpeg", "image/png", "image/webp");
    private final JdbcTemplate jdbc;

    public CommunityMediaController(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    @PostMapping(value = "/api/v1/community/media", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public UploadedMedia upload(@RequestPart("file") MultipartFile file) {
        if (file.isEmpty() || file.getSize() > MAX_BYTES || !ALLOWED_TYPES.contains(file.getContentType())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Use a PNG, JPEG, or WebP image under 5 MB");
        }
        try {
            UUID id = UUID.randomUUID();
            jdbc.update("insert into community_media (id, owner_id, content_type, content) values (?, ?, ?, ?)",
                id, BUSINESS_ACTOR, file.getContentType(), file.getBytes());
            return new UploadedMedia("/media/community/" + id);
        } catch (Exception exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Could not read image upload", exception);
        }
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

    public record UploadedMedia(String url) {}
}
