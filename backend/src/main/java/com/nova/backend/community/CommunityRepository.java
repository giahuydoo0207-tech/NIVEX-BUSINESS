package com.nova.backend.community;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@Repository
public class CommunityRepository {
    private final JdbcTemplate jdbc;

    public CommunityRepository(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    public boolean profileExists(String profileId) {
        return Boolean.TRUE.equals(jdbc.queryForObject(
            "select exists(select 1 from community_profiles where id = ?)", Boolean.class, profileId));
    }

    public List<CommunityPost> feed(String actorId, int offset, int limit) {
        return jdbc.query("select p.id from community_posts p where p.deleted_at is null " +
                "and not exists (select 1 from community_blocks b where b.actor_id=? and b.blocked_profile_id=p.author_id) " +
                "and not exists (select 1 from community_hidden_posts h where h.actor_id=? and h.post_id=p.id) " +
                "and (p.privacy='PUBLIC' or p.author_id=? or (p.privacy='FOLLOWERS' and exists " +
                "(select 1 from community_follows f where f.actor_id=? and f.followed_profile_id=p.author_id))) " +
                "order by p.is_pinned desc, p.created_at desc, p.id desc limit ? offset ?",
            (rs, row) -> rs.getObject(1, UUID.class), actorId, actorId, actorId, actorId, limit, offset)
            .stream().map(id -> post(id, actorId)).toList();
    }

    public CommunityPost post(UUID postId, String actorId) {
        var rows = jdbc.query("select p.id, p.content, p.privacy, p.is_pinned, p.created_at, p.updated_at, " +
                "a.id author_id, a.kind author_kind, a.display_name, a.handle, a.headline, a.avatar_url " +
                "from community_posts p join community_profiles a on a.id=p.author_id " +
                "where p.id=? and p.deleted_at is null", this::mapPostBase, postId);
        if (rows.isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Community post not found");
        BasePost base = rows.getFirst();
        List<String> images = jdbc.query("select image_url from community_post_images where post_id=? order by sort_order",
            (rs, row) -> rs.getString(1), postId);
        List<String> topics = jdbc.query("select topic from community_post_topics where post_id=? order by topic",
            (rs, row) -> rs.getString(1), postId);
        Map<String, Long> reactionCounts = new LinkedHashMap<>();
        jdbc.query("select reaction_type, count(*) from community_post_reactions where post_id=? group by reaction_type",
            (rs, row) -> Map.entry(rs.getString(1), rs.getLong(2)), postId)
            .forEach(entry -> reactionCounts.put(entry.getKey(), entry.getValue()));
        String myReaction = jdbc.query("select reaction_type from community_post_reactions where post_id=? and actor_id=?",
            (rs, row) -> rs.getString(1), postId, actorId).stream().findFirst().orElse(null);
        boolean saved = exists("select 1 from community_saved_posts where actor_id=? and post_id=?", actorId, postId);
        boolean hidden = exists("select 1 from community_hidden_posts where actor_id=? and post_id=?", actorId, postId);
        boolean following = exists("select 1 from community_follows where actor_id=? and followed_profile_id=?", actorId, base.author().id());
        return new CommunityPost(base.id(), base.content(), images, topics, base.privacy(), base.pinned(),
            base.createdAt(), base.updatedAt(), reactionCounts.values().stream().mapToLong(Long::longValue).sum(), myReaction,
            reactionCounts, saved, hidden, following, base.author(), comments(postId, actorId));
    }

    @Transactional
    public CommunityPost create(String actorId, String content, List<String> images, List<String> topics, String privacy) {
        UUID id = UUID.randomUUID();
        jdbc.update("insert into community_posts (id, author_id, content, privacy) values (?, ?, ?, ?)",
            id, actorId, content.trim(), privacy);
        replaceImages(id, images);
        replaceTopics(id, topics);
        return post(id, actorId);
    }

    @Transactional
    public CommunityPost edit(UUID postId, String actorId, String content, List<String> topics, String privacy) {
        owned(postId, actorId);
        jdbc.update("update community_posts set content=?, privacy=?, updated_at=now() where id=?", content.trim(), privacy, postId);
        replaceTopics(postId, topics);
        return post(postId, actorId);
    }

    @Transactional
    public void delete(UUID postId, String actorId) {
        owned(postId, actorId);
        jdbc.update("update community_posts set deleted_at=now(), updated_at=now() where id=?", postId);
    }

    @Transactional
    public CommunityPost setPinned(UUID postId, String actorId, boolean pinned) {
        owned(postId, actorId);
        jdbc.update("update community_posts set is_pinned=?, updated_at=now() where id=?", pinned, postId);
        return post(postId, actorId);
    }

    @Transactional
    public CommunityPost setPrivacy(UUID postId, String actorId, String privacy) {
        owned(postId, actorId);
        jdbc.update("update community_posts set privacy=?, updated_at=now() where id=?", privacy, postId);
        return post(postId, actorId);
    }

    @Transactional
    public CommunityPost react(UUID postId, String actorId, String reaction) {
        requirePost(postId);
        String current = jdbc.query("select reaction_type from community_post_reactions where post_id=? and actor_id=?",
            (rs, row) -> rs.getString(1), postId, actorId).stream().findFirst().orElse(null);
        if (reaction.equals(current)) {
            jdbc.update("delete from community_post_reactions where post_id=? and actor_id=?", postId, actorId);
        } else {
            jdbc.update("insert into community_post_reactions (post_id, actor_id, reaction_type) values (?, ?, ?) " +
                "on conflict (post_id, actor_id) do update set reaction_type=excluded.reaction_type, created_at=now()",
                postId, actorId, reaction);
        }
        return post(postId, actorId);
    }

    @Transactional
    public CommunityPost toggleSaved(UUID postId, String actorId, boolean saved) {
        requirePost(postId);
        if (saved) jdbc.update("insert into community_saved_posts (actor_id, post_id) values (?, ?) on conflict do nothing", actorId, postId);
        else jdbc.update("delete from community_saved_posts where actor_id=? and post_id=?", actorId, postId);
        return post(postId, actorId);
    }

    @Transactional
    public void setHidden(UUID postId, String actorId, boolean hidden) {
        requirePost(postId);
        if (hidden) jdbc.update("insert into community_hidden_posts (actor_id, post_id) values (?, ?) on conflict do nothing", actorId, postId);
        else jdbc.update("delete from community_hidden_posts where actor_id=? and post_id=?", actorId, postId);
    }

    @Transactional
    public CommunityComment comment(UUID postId, String actorId, String content, UUID parentCommentId) {
        requirePost(postId);
        if (parentCommentId != null && !exists("select 1 from community_comments where id=? and post_id=? and deleted_at is null", parentCommentId, postId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Parent comment does not belong to this post");
        }
        UUID id = UUID.randomUUID();
        jdbc.update("insert into community_comments (id, post_id, parent_comment_id, author_id, content) values (?, ?, ?, ?, ?)",
            id, postId, parentCommentId, actorId, content.trim());
        return comments(postId, actorId).stream().flatMap(comment -> flatten(comment).stream())
            .filter(comment -> comment.id().equals(id)).findFirst().orElseThrow();
    }

    @Transactional
    public CommunityPost toggleCommentLike(UUID postId, UUID commentId, String actorId, boolean liked) {
        requireComment(postId, commentId);
        if (liked) jdbc.update("insert into community_comment_likes (comment_id, actor_id, reaction_type) values (?, ?, 'LIKE') on conflict (comment_id, actor_id) do update set reaction_type='LIKE'", commentId, actorId);
        else jdbc.update("delete from community_comment_likes where comment_id=? and actor_id=?", commentId, actorId);
        return post(postId, actorId);
    }

    @Transactional
    public CommunityPost reactToComment(UUID postId, UUID commentId, String actorId, String reaction) {
        requireComment(postId, commentId);
        String current = jdbc.query("select reaction_type from community_comment_likes where comment_id=? and actor_id=?",
            (rs, row) -> rs.getString(1), commentId, actorId).stream().findFirst().orElse(null);
        if (reaction.equals(current)) jdbc.update("delete from community_comment_likes where comment_id=? and actor_id=?", commentId, actorId);
        else jdbc.update("insert into community_comment_likes (comment_id, actor_id, reaction_type) values (?, ?, ?) on conflict (comment_id, actor_id) do update set reaction_type=excluded.reaction_type", commentId, actorId, reaction);
        return post(postId, actorId);
    }

    @Transactional
    public void setFollowing(String actorId, String targetProfileId, boolean following) {
        requireProfile(targetProfileId);
        if (actorId.equals(targetProfileId)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot follow yourself");
        if (following) jdbc.update("insert into community_follows (actor_id, followed_profile_id) values (?, ?) on conflict do nothing", actorId, targetProfileId);
        else jdbc.update("delete from community_follows where actor_id=? and followed_profile_id=?", actorId, targetProfileId);
    }

    @Transactional
    public void setBlocked(String actorId, String targetProfileId, boolean blocked) {
        requireProfile(targetProfileId);
        if (actorId.equals(targetProfileId)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot block yourself");
        if (blocked) {
            jdbc.update("insert into community_blocks (actor_id, blocked_profile_id) values (?, ?) on conflict do nothing", actorId, targetProfileId);
            jdbc.update("delete from community_follows where actor_id=? and followed_profile_id=?", actorId, targetProfileId);
        } else jdbc.update("delete from community_blocks where actor_id=? and blocked_profile_id=?", actorId, targetProfileId);
    }

    public void report(String actorId, UUID postId, String profileId, String reason, String details) {
        if (postId != null) requirePost(postId);
        if (profileId != null) requireProfile(profileId);
        jdbc.update("insert into community_reports (id, reporter_id, post_id, reported_profile_id, reason, details) values (?, ?, ?, ?, ?, ?)",
            UUID.randomUUID(), actorId, postId, profileId, reason.trim(), details == null ? null : details.trim());
    }

    private List<CommunityComment> comments(UUID postId, String actorId) {
        List<CommentRow> rows = jdbc.query("select c.id, c.parent_comment_id, c.content, c.created_at, a.id author_id, a.kind, a.display_name, a.handle, a.headline, a.avatar_url " +
                "from community_comments c join community_profiles a on a.id=c.author_id where c.post_id=? and c.deleted_at is null order by c.created_at",
            this::mapCommentRow, postId);
        Map<UUID, MutableComment> byId = new LinkedHashMap<>();
        for (CommentRow row : rows) byId.put(row.id(), new MutableComment(row, commentReactionCounts(row.id()), commentReaction(row.id(), actorId)));
        List<MutableComment> roots = new ArrayList<>();
        for (MutableComment comment : byId.values()) {
            if (comment.parentId != null && byId.containsKey(comment.parentId)) byId.get(comment.parentId).replies.add(comment);
            else roots.add(comment);
        }
        return roots.stream().map(MutableComment::toRecord).toList();
    }

    private List<CommunityComment> flatten(CommunityComment comment) {
        List<CommunityComment> all = new ArrayList<>(); all.add(comment);
        for (CommunityComment reply : comment.replies()) all.addAll(flatten(reply));
        return all;
    }

    private void replaceTopics(UUID postId, List<String> topics) {
        jdbc.update("delete from community_post_topics where post_id=?", postId);
        for (String topic : topics) jdbc.update("insert into community_post_topics (post_id, topic) values (?, ?)", postId, topic.trim());
    }

    private void replaceImages(UUID postId, List<String> images) {
        for (int index = 0; index < images.size(); index++) jdbc.update(
            "insert into community_post_images (id, post_id, image_url, sort_order) values (?, ?, ?, ?)", UUID.randomUUID(), postId, images.get(index), index);
    }

    private void owned(UUID postId, String actorId) {
        if (!exists("select 1 from community_posts where id=? and author_id=? and deleted_at is null", postId, actorId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the author can change this post");
        }
    }
    private void requirePost(UUID postId) { if (!exists("select 1 from community_posts where id=? and deleted_at is null", postId)) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Community post not found"); }
    private void requireComment(UUID postId, UUID commentId) { if (!exists("select 1 from community_comments where id=? and post_id=? and deleted_at is null", commentId, postId)) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Comment not found"); }
    private void requireProfile(String profileId) { if (!profileExists(profileId)) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Community profile not found"); }
    private boolean exists(String sql, Object... arguments) { return !jdbc.query(sql, (rs, row) -> 1, arguments).isEmpty(); }

    private BasePost mapPostBase(ResultSet rs, int row) throws SQLException { return new BasePost(rs.getObject("id", UUID.class), rs.getString("content"), rs.getString("privacy"), rs.getBoolean("is_pinned"), rs.getTimestamp("created_at").toInstant(), rs.getTimestamp("updated_at").toInstant(), new CommunityProfile(rs.getString("author_id"), rs.getString("author_kind"), rs.getString("display_name"), rs.getString("handle"), rs.getString("headline"), rs.getString("avatar_url"))); }
    private Map<String, Long> commentReactionCounts(UUID commentId) { Map<String, Long> counts = new LinkedHashMap<>(); jdbc.query("select reaction_type, count(*) from community_comment_likes where comment_id=? group by reaction_type", (rs, row) -> Map.entry(rs.getString(1), rs.getLong(2)), commentId).forEach(entry -> counts.put(entry.getKey(), entry.getValue())); return counts; }
    private String commentReaction(UUID commentId, String actorId) { return jdbc.query("select reaction_type from community_comment_likes where comment_id=? and actor_id=?", (rs, row) -> rs.getString(1), commentId, actorId).stream().findFirst().orElse(null); }
    private CommentRow mapCommentRow(ResultSet rs, int row) throws SQLException { return new CommentRow(rs.getObject("id", UUID.class), rs.getObject("parent_comment_id", UUID.class), rs.getString("content"), rs.getTimestamp("created_at").toInstant(), new CommunityProfile(rs.getString("author_id"), rs.getString("kind"), rs.getString("display_name"), rs.getString("handle"), rs.getString("headline"), rs.getString("avatar_url"))); }
    private record BasePost(UUID id, String content, String privacy, boolean pinned, Instant createdAt, Instant updatedAt, CommunityProfile author) {}
    private record CommentRow(UUID id, UUID parentId, String content, Instant createdAt, CommunityProfile author) {}
    private static final class MutableComment { private final UUID id, parentId; private final String content; private final Instant createdAt; private final CommunityProfile author; private final Map<String, Long> reactionCounts; private final String myReaction; private final List<MutableComment> replies = new ArrayList<>(); MutableComment(CommentRow row, Map<String, Long> reactionCounts, String myReaction) { id=row.id(); parentId=row.parentId(); content=row.content(); createdAt=row.createdAt(); author=row.author(); this.reactionCounts=reactionCounts; this.myReaction=myReaction; } CommunityComment toRecord() { long total = reactionCounts.values().stream().mapToLong(Long::longValue).sum(); return new CommunityComment(id, parentId, content, createdAt, author, total, "LIKE".equals(myReaction), myReaction, reactionCounts, replies.stream().map(MutableComment::toRecord).toList()); } }
}
