package com.nova.backend.community;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/** Community API for the authenticated Nova Business workspace. Mobile identity is added separately. */
@RestController
@Validated
@RequestMapping("/api/v1/community")
public class CommunityController {
    private static final String BUSINESS_ACTOR = "nova-labs";
    private static final List<String> PRIVACY = List.of("PUBLIC", "FOLLOWERS", "ONLY_ME");
    private static final List<String> REACTIONS = List.of("LIKE", "LOVE", "TRUST", "BUILD", "INSIGHTFUL", "DEAL", "LAUNCH");
    private final CommunityRepository repository;

    public CommunityController(CommunityRepository repository) { this.repository = repository; }

    @GetMapping("/posts")
    public List<CommunityPost> feed(@RequestParam(defaultValue = "0") int offset, @RequestParam(defaultValue = "25") int limit) {
        page(offset, limit); return repository.feed(BUSINESS_ACTOR, offset, limit);
    }

    @GetMapping("/posts/{postId}")
    public CommunityPost post(@PathVariable UUID postId) { return repository.post(postId, BUSINESS_ACTOR); }

    @PostMapping("/posts")
    @ResponseStatus(HttpStatus.CREATED)
    public CommunityPost create(@Valid @RequestBody CreatePostRequest request) {
        return repository.create(BUSINESS_ACTOR, request.content(), cleanImages(request.images()), cleanTopics(request.topics()), privacy(request.privacy()));
    }

    @PatchMapping("/posts/{postId}")
    public CommunityPost edit(@PathVariable UUID postId, @Valid @RequestBody EditPostRequest request) {
        return repository.edit(postId, BUSINESS_ACTOR, request.content(), cleanTopics(request.topics()), privacy(request.privacy()));
    }

    @DeleteMapping("/posts/{postId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID postId) { repository.delete(postId, BUSINESS_ACTOR); }

    @PutMapping("/posts/{postId}/pin")
    public CommunityPost pin(@PathVariable UUID postId, @Valid @RequestBody ToggleRequest request) {
        return repository.setPinned(postId, BUSINESS_ACTOR, request.enabled());
    }

    @PutMapping("/posts/{postId}/privacy")
    public CommunityPost changePrivacy(@PathVariable UUID postId, @Valid @RequestBody PrivacyRequest request) {
        return repository.setPrivacy(postId, BUSINESS_ACTOR, privacy(request.privacy()));
    }

    @PutMapping("/posts/{postId}/reaction")
    public CommunityPost react(@PathVariable UUID postId, @Valid @RequestBody ReactionRequest request) {
        return repository.react(postId, BUSINESS_ACTOR, reaction(request.reaction()));
    }

    @PutMapping("/posts/{postId}/saved")
    public CommunityPost saved(@PathVariable UUID postId, @Valid @RequestBody ToggleRequest request) {
        return repository.toggleSaved(postId, BUSINESS_ACTOR, request.enabled());
    }

    @PutMapping("/posts/{postId}/hidden")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void hidden(@PathVariable UUID postId, @Valid @RequestBody ToggleRequest request) {
        repository.setHidden(postId, BUSINESS_ACTOR, request.enabled());
    }

    @PostMapping("/posts/{postId}/comments")
    @ResponseStatus(HttpStatus.CREATED)
    public CommunityComment comment(@PathVariable UUID postId, @Valid @RequestBody CommentRequest request) {
        return repository.comment(postId, BUSINESS_ACTOR, request.content(), request.parentCommentId());
    }

    @PutMapping("/posts/{postId}/comments/{commentId}/liked")
    public CommunityPost commentLiked(@PathVariable UUID postId, @PathVariable UUID commentId, @Valid @RequestBody ToggleRequest request) {
        return repository.toggleCommentLike(postId, commentId, BUSINESS_ACTOR, request.enabled());
    }

    @PutMapping("/posts/{postId}/comments/{commentId}/reaction")
    public CommunityPost commentReaction(@PathVariable UUID postId, @PathVariable UUID commentId, @Valid @RequestBody ReactionRequest request) {
        return repository.reactToComment(postId, commentId, BUSINESS_ACTOR, reaction(request.reaction()));
    }

    @PutMapping("/profiles/{profileId}/following")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void following(@PathVariable String profileId, @Valid @RequestBody ToggleRequest request) {
        repository.setFollowing(BUSINESS_ACTOR, profileId, request.enabled());
    }

    @PutMapping("/profiles/{profileId}/blocked")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void blocked(@PathVariable String profileId, @Valid @RequestBody ToggleRequest request) {
        repository.setBlocked(BUSINESS_ACTOR, profileId, request.enabled());
    }

    @PostMapping("/reports")
    @ResponseStatus(HttpStatus.CREATED)
    public void report(@Valid @RequestBody ReportRequest request) {
        if (request.postId() == null && (request.profileId() == null || request.profileId().isBlank())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A post or profile must be reported");
        }
        repository.report(BUSINESS_ACTOR, request.postId(), request.profileId(), request.reason(), request.details());
    }

    private void page(int offset, int limit) { if (offset < 0 || offset > 100000 || limit < 1 || limit > 100) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid pagination"); }
    private String privacy(String value) { return allowed(value, PRIVACY, "privacy"); }
    private String reaction(String value) { return allowed(value, REACTIONS, "reaction"); }
    private String allowed(String value, List<String> allowed, String label) { String normalized = value == null ? "PUBLIC" : value.trim().toUpperCase(Locale.ROOT); if (!allowed.contains(normalized)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid " + label); return normalized; }
    private List<String> cleanTopics(List<String> topics) { if (topics == null) return List.of(); if (topics.size() > 5 || topics.stream().anyMatch(topic -> topic == null || topic.trim().isEmpty() || topic.trim().length() > 80)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Use between 0 and 5 valid topics"); return topics.stream().map(String::trim).distinct().toList(); }
    private List<String> cleanImages(List<String> images) { if (images == null) return List.of(); if (images.size() > 10 || images.stream().anyMatch(url -> url == null || url.isBlank() || url.length() > 2048)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Use between 0 and 10 valid image URLs"); return images; }

    public record CreatePostRequest(@NotBlank @Size(max = 5000) String content, List<String> images, List<String> topics, String privacy) {}
    public record EditPostRequest(@NotBlank @Size(max = 5000) String content, List<String> topics, String privacy) {}
    public record ToggleRequest(boolean enabled) {}
    public record PrivacyRequest(@NotBlank String privacy) {}
    public record ReactionRequest(@NotBlank String reaction) {}
    public record CommentRequest(@NotBlank @Size(max = 2000) String content, UUID parentCommentId) {}
    public record ReportRequest(UUID postId, String profileId, @NotBlank @Size(max = 80) String reason, @Size(max = 2000) String details) {}
}
