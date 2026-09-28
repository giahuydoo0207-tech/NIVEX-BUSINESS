package com.nova.backend.api;

import com.nova.backend.community.CommunityComment;
import com.nova.backend.community.CommunityPost;
import com.nova.backend.community.CommunityRepository;
import com.nova.backend.mobile.MobileSessionAuthenticator;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** Mobile-compatible community contract backed by the same tables as the web community API. */
@RestController
@RequestMapping("/api/v1/posts")
public class MobileCommunityCompatibilityController {
    private final CommunityRepository repository;
    private final MobileSessionAuthenticator sessions;

    public MobileCommunityCompatibilityController(CommunityRepository repository, MobileSessionAuthenticator sessions) {
        this.repository = repository;
        this.sessions = sessions;
    }

    @GetMapping("/feed")
    public Feed feed(@RequestHeader("Authorization") String authorization,
                     @RequestParam(required = false) String cursor,
                     @RequestParam(defaultValue = "20") int limit) {
        int offset = cursor == null || cursor.isBlank() ? 0 : Integer.parseInt(cursor);
        if (offset < 0 || limit < 1 || limit > 25) throw new IllegalArgumentException("Invalid pagination");
        var items = repository.feed(actor(authorization), offset, limit);
        return new Feed(items, items.size() < limit ? null : Integer.toString(offset + items.size()));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CommunityPost create(@RequestHeader("Authorization") String authorization,
                                @Valid @RequestBody CreatePost request) {
        return repository.create(actor(authorization), request.content(), List.of(), List.of(), "PUBLIC");
    }

    @PostMapping("/{postId}/reactions")
    public CommunityPost react(@RequestHeader("Authorization") String authorization, @PathVariable UUID postId,
                               @Valid @RequestBody Reaction request) {
        return repository.react(postId, actor(authorization), request.type());
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
        return repository.reactToComment(commentId, actor(authorization), request.type());
    }

    @DeleteMapping("/comments/{commentId}/reactions")
    public CommunityComment removeCommentReaction(@RequestHeader("Authorization") String authorization, @PathVariable UUID commentId) {
        return repository.removeCommentReaction(commentId, actor(authorization));
    }

    private String actor(String authorization) { return sessions.authenticate(authorization).contractorId(); }

    public record Feed(List<CommunityPost> items, String nextCursor) {}
    public record CommentList(List<CommunityComment> items) {}
    public record CreatePost(@NotBlank @Size(max = 2000) String content) {}
    public record CreateComment(@NotBlank @Size(max = 1000) String content, UUID parentId) {}
    public record EditComment(@NotBlank @Size(max = 1000) String content) {}
    public record Reaction(@Pattern(regexp = "LIKE|LOVE|HAHA|TRUST|BUILD|INSIGHTFUL|DEAL|LAUNCH") String type) {}
}
