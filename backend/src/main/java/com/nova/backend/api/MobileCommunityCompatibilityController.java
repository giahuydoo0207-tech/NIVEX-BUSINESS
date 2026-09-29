package com.nova.backend.api;

import com.nova.backend.community.CommunityComment;
import com.nova.backend.community.CommunityPost;
import com.nova.backend.community.CommunityReaction;
import com.nova.backend.community.CommunityRepository;
import com.nova.backend.mobile.MobileSessionAuthenticator;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/** Mobile-compatible community contract backed by the same tables as the web community API. */
@RestController
@RequestMapping("/api/v1/posts")
public class MobileCommunityCompatibilityController {
    private static final List<String> PRIVACY = List.of("PUBLIC", "FOLLOWERS", "ONLY_ME");
    private final CommunityRepository repository;
    private final MobileSessionAuthenticator sessions;
    private final org.springframework.jdbc.core.JdbcTemplate jdbc;

    public MobileCommunityCompatibilityController(CommunityRepository repository, MobileSessionAuthenticator sessions,
                                                  org.springframework.jdbc.core.JdbcTemplate jdbc) {
        this.repository = repository;
        this.sessions = sessions;
        this.jdbc = jdbc;
    }

    @GetMapping("/feed")
    public Feed feed(@RequestHeader("Authorization") String authorization,
                     @RequestParam(required = false) String cursor,
                     @RequestParam(defaultValue = "20") int limit) {
        int offset;
        try {
            offset = cursor == null || cursor.isBlank() ? 0 : Integer.parseInt(cursor);
        } catch (NumberFormatException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid cursor");
        }
        if (offset < 0 || offset > 100000 || limit < 1 || limit > 25) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid pagination");
        var items = repository.feed(actor(authorization), offset, limit);
        return new Feed(items, items.size() < limit ? null : Integer.toString(offset + items.size()));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CommunityPost create(@RequestHeader("Authorization") String authorization,
                                @Valid @RequestBody CreatePost request) {
        String actor = actor(authorization);
        return repository.create(actor, request.content(), ownImages(actor, request.images()), topics(request.topics()), privacy(request.privacy()));
    }

    @GetMapping("/{postId}")
    public CommunityPost post(@RequestHeader("Authorization") String authorization, @PathVariable UUID postId) {
        return repository.visiblePost(postId, actor(authorization));
    }

    @PatchMapping("/{postId}")
    public CommunityPost edit(@RequestHeader("Authorization") String authorization, @PathVariable UUID postId,
                              @Valid @RequestBody EditPost request) {
        String actor = actor(authorization);
        CommunityPost current = repository.visiblePost(postId, actor);
        return repository.edit(postId, actor, request.content() == null ? current.content() : request.content(),
            current.topics(), request.privacy() == null ? current.privacy() : privacy(request.privacy()));
    }

    @DeleteMapping("/{postId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletePost(@RequestHeader("Authorization") String authorization, @PathVariable UUID postId) {
        repository.delete(postId, actor(authorization));
    }

    @PutMapping("/{postId}/pin")
    public CommunityPost pin(@RequestHeader("Authorization") String authorization, @PathVariable UUID postId,
                             @RequestBody Toggle request) {
        return repository.setPinned(postId, actor(authorization), request.enabled());
    }

    @PutMapping("/{postId}/saved")
    public CommunityPost saved(@RequestHeader("Authorization") String authorization, @PathVariable UUID postId,
                               @RequestBody Toggle request) {
        return repository.toggleSaved(postId, actor(authorization), request.enabled());
    }

    @PutMapping("/{postId}/hidden")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void hidden(@RequestHeader("Authorization") String authorization, @PathVariable UUID postId,
                       @RequestBody Toggle request) {
        repository.setHidden(postId, actor(authorization), request.enabled());
    }

    @GetMapping("/{postId}/reactions")
    public List<CommunityReaction> reactions(@RequestHeader("Authorization") String authorization, @PathVariable UUID postId) {
        return repository.reactions(postId, actor(authorization));
    }

    @PostMapping("/{postId}/reactions")
    public CommunityPost react(@RequestHeader("Authorization") String authorization, @PathVariable UUID postId,
                               @Valid @RequestBody Reaction request) {
        return repository.setReaction(postId, actor(authorization), request.type());
    }

    @DeleteMapping("/{postId}/reactions")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeReaction(@RequestHeader("Authorization") String authorization, @PathVariable UUID postId) {
        repository.removeReaction(postId, actor(authorization));
    }

    @GetMapping("/{postId}/comments")
    public CommentList comments(@RequestHeader("Authorization") String authorization, @PathVariable UUID postId) {
        return new CommentList(repository.commentsForPost(postId, actor(authorization)));
    }

    @PostMapping("/{postId}/comments")
    @ResponseStatus(HttpStatus.CREATED)
    public CommunityComment comment(@RequestHeader("Authorization") String authorization, @PathVariable UUID postId,
                                    @Valid @RequestBody CreateComment request) {
        return repository.comment(postId, actor(authorization), request.content(), request.parentId());
    }

    @PatchMapping("/comments/{commentId}")
    public CommunityComment edit(@RequestHeader("Authorization") String authorization, @PathVariable UUID commentId,
                                 @Valid @RequestBody EditComment request) {
        return repository.editComment(commentId, actor(authorization), request.content());
    }

    @DeleteMapping("/comments/{commentId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@RequestHeader("Authorization") String authorization, @PathVariable UUID commentId) {
        repository.deleteComment(commentId, actor(authorization));
    }

    @PostMapping("/comments/{commentId}/reactions")
    public CommunityComment reactComment(@RequestHeader("Authorization") String authorization, @PathVariable UUID commentId,
                                         @Valid @RequestBody Reaction request) {
        return repository.setCommentReaction(commentId, actor(authorization), request.type());
    }

    @DeleteMapping("/comments/{commentId}/reactions")
    public CommunityComment removeCommentReaction(@RequestHeader("Authorization") String authorization, @PathVariable UUID commentId) {
        return repository.removeCommentReaction(commentId, actor(authorization));
    }

    private String actor(String authorization) { return sessions.authenticate(authorization).contractorId(); }

    /** Only media the member uploaded through /mobile/media may be attached, never other users' files or external URLs. */
    private List<String> ownImages(String actor, List<String> images) {
        if (images == null || images.isEmpty()) return List.of();
        if (images.size() > 10) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Use at most 10 images");
        List<UUID> ids = images.stream().map(url -> {
            if (url == null || !url.matches("/media/community/[0-9a-fA-F-]{36}")) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Upload images through /api/v1/mobile/media first");
            }
            return UUID.fromString(url.substring("/media/community/".length()));
        }).distinct().toList();
        Object[] args = new Object[ids.size() + 1];
        args[0] = actor;
        for (int i = 0; i < ids.size(); i++) args[i + 1] = ids.get(i);
        Integer owned = jdbc.queryForObject("select count(*) from community_media where owner_id=? and id in ("
            + String.join(",", java.util.Collections.nCopies(ids.size(), "?")) + ")", Integer.class, args);
        if (owned == null || owned != ids.size()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Images must be your own uploads");
        return ids.stream().map(id -> "/media/community/" + id).toList();
    }

    private List<String> topics(List<String> topics) {
        if (topics == null) return List.of();
        if (topics.size() > 5 || topics.stream().anyMatch(topic -> topic == null || topic.isBlank() || topic.trim().length() > 80)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Use between 0 and 5 valid topics");
        }
        return topics.stream().map(String::trim).distinct().toList();
    }
    private String privacy(String value) {
        String normalized = value == null ? "PUBLIC" : value.trim().toUpperCase(Locale.ROOT);
        if (!PRIVACY.contains(normalized)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid privacy");
        return normalized;
    }

    public record Feed(List<CommunityPost> items, String nextCursor) {}
    public record CommentList(List<CommunityComment> items) {}
    public record CreatePost(@NotBlank @Size(max = 2000) String content, String privacy, List<String> images, List<String> topics) {}
    public record EditPost(@Size(min = 1, max = 2000) String content, String privacy) {}
    public record Toggle(boolean enabled) {}
    public record CreateComment(@NotBlank @Size(max = 1000) String content, UUID parentId) {}
    public record EditComment(@NotBlank @Size(max = 1000) String content) {}
    public record Reaction(@NotNull @Pattern(regexp = "LIKE|LOVE|HAHA|TRUST|BUILD|INSIGHTFUL|DEAL|LAUNCH") String type) {}
}
