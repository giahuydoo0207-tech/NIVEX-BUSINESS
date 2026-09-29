package com.nova.backend.application;

import java.util.List;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Candidates this organization may invoice: those with an accepted application,
 * one row per contractor (their most recently accepted application).
 * Protected by the server-side demo key like the rest of /business/**.
 */
@RestController
@RequestMapping("/api/v1/business/recipients")
public class BusinessRecipientController {
    private static final UUID ORGANIZATION = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private final JdbcTemplate jdbc;

    public BusinessRecipientController(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    @GetMapping
    public List<Recipient> list() {
        return jdbc.query(
            "select distinct on (a.contractor_id) a.contractor_id, a.id, t.display_name, t.headline, t.email, cp.avatar_url, a.job_id, j.title, a.status " +
                "from job_applications a join talent_profiles t on t.contractor_id=a.contractor_id join jobs j on j.id=a.job_id " +
                "left join community_profiles cp on cp.id=a.contractor_id " +
                "where a.organization_id=? and a.status='accepted' order by a.contractor_id, a.updated_at desc",
            (rs, row) -> new Recipient(
                rs.getString(1), rs.getObject(2, UUID.class), rs.getString(3), rs.getString(4), rs.getString(5),
                rs.getString(6), rs.getObject(7, UUID.class), rs.getString(8), rs.getString(9),
                // Contractor payout wallets are not stored yet; Devnet payments go to the
                // server-configured demo recipient, so readiness is reported honestly.
                "NOT_CONFIGURED", null),
            ORGANIZATION);
    }

    public record Recipient(String contractorId, UUID applicationId, String displayName, String headline, String email,
        String avatarUrl, UUID jobId, String jobTitle, String applicationStatus, String payoutReadiness, String walletAddress) {}
}
