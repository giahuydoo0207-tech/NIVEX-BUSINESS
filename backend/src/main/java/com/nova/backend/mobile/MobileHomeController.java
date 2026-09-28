package com.nova.backend.mobile;

import java.time.Instant;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * A compact, session-scoped read model for the Mobile home dashboard.
 * Monetary values are strings in minor units so JSON clients do not lose precision.
 */
@RestController
@RequestMapping("/api/v1/mobile/home")
public class MobileHomeController {
    private final JdbcTemplate jdbc;
    private final MobileSessionAuthenticator sessions;

    public MobileHomeController(JdbcTemplate jdbc, MobileSessionAuthenticator sessions) {
        this.jdbc = jdbc;
        this.sessions = sessions;
    }

    @ModelAttribute
    public void preventCaching(jakarta.servlet.http.HttpServletResponse response) {
        response.setHeader("Cache-Control", "no-store");
    }

    @GetMapping
    public MobileHomeSnapshot home(
        @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        var scope = sessions.authenticate(authorization);
        var profile = profile(scope.contractorId());

        return new MobileHomeSnapshot(
            profile,
            finalizedIncome(scope, null),
            finalizedIncome(scope, "7 days"),
            countApplications(scope.contractorId(), "('submitted','viewed','shortlisted','interview')"),
            countApplications(scope.contractorId(), "('accepted')"),
            unreadNotifications(scope.contractorId()),
            communityHighlight(),
            Instant.now()
        );
    }

    private MobileHomeProfile profile(String contractorId) {
        return jdbc.query(
            "select display_name, headline from talent_profiles where contractor_id=?",
            (rs, row) -> new MobileHomeProfile(rs.getString(1), rs.getString(2)),
            contractorId
        ).stream().findFirst().orElse(new MobileHomeProfile("Nova member", "Thành viên Nova"));
    }

    private String finalizedIncome(MobileSessionAuthenticator.Scope scope, String interval) {
        var sql = new StringBuilder(
            "select coalesce(sum(l.amount_minor), 0)::text " +
            "from payment_ledger_entries l " +
            "join payment_requests p on p.id=l.payment_request_id " +
            "join invoices i on i.id=p.invoice_id " +
            "where i.organization_id=? and i.contractor_id=? and l.commitment='finalized'"
        );
        if (interval != null) sql.append(" and l.recorded_at >= now() - interval '").append(interval).append("'");
        return jdbc.queryForObject(sql.toString(), String.class, scope.organizationId(), scope.contractorId());
    }

    private int countApplications(String contractorId, String statuses) {
        Integer count = jdbc.queryForObject(
            "select count(*) from job_applications where contractor_id=? and status in " + statuses,
            Integer.class,
            contractorId
        );
        return count == null ? 0 : count;
    }

    private int unreadNotifications(String contractorId) {
        Integer count = jdbc.queryForObject(
            "select count(*) from notifications where contractor_id=? and read_at is null",
            Integer.class,
            contractorId
        );
        return count == null ? 0 : count;
    }

    private CommunityHighlight communityHighlight() {
        return jdbc.query(
            "select p.id, p.content, p.created_at, a.display_name, a.headline, a.avatar_url, " +
            "count(r.actor_id) as reaction_count " +
            "from community_posts p " +
            "join community_profiles a on a.id=p.author_id " +
            "left join community_post_reactions r on r.post_id=p.id " +
            "where p.deleted_at is null and p.privacy='PUBLIC' " +
            "group by p.id, p.content, p.created_at, a.display_name, a.headline, a.avatar_url " +
            "order by reaction_count desc, p.created_at desc limit 1",
            (rs, row) -> new CommunityHighlight(
                rs.getObject(1, UUID.class),
                rs.getString(2),
                rs.getString(4),
                rs.getString(5),
                rs.getString(6),
                rs.getLong(7),
                rs.getTimestamp(3).toInstant()
            )
        ).stream().findFirst().orElse(null);
    }

    public record MobileHomeSnapshot(
        MobileHomeProfile profile,
        String finalizedIncomeMinor,
        String finalizedIncomeLast7DaysMinor,
        int activeApplicationCount,
        int completedProjectCount,
        int unreadNotificationCount,
        CommunityHighlight communityHighlight,
        Instant generatedAt
    ) {}

    public record MobileHomeProfile(String displayName, String headline) {}

    public record CommunityHighlight(
        UUID postId,
        String content,
        String authorName,
        String authorHeadline,
        String authorAvatarUrl,
        long reactionCount,
        Instant createdAt
    ) {}
}
