package com.nova.backend.application;

import com.nova.backend.wallet.PayoutWallets;
import java.time.Instant;
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
 * The payout wallet is only read for these accepted candidates.
 */
@RestController
@RequestMapping("/api/v1/business/recipients")
public class BusinessRecipientController {
    private static final UUID ORGANIZATION = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private final JdbcTemplate jdbc;
    private final PayoutWallets wallets;

    public BusinessRecipientController(JdbcTemplate jdbc, PayoutWallets wallets) {
        this.jdbc = jdbc;
        this.wallets = wallets;
    }

    @GetMapping
    public List<Recipient> list() {
        return jdbc.query(
            "select distinct on (a.contractor_id) a.contractor_id, a.id, t.display_name, t.headline, t.email, cp.avatar_url, a.job_id, j.title, a.status, " +
                "w.id, w.wallet_address, w.network, w.token_symbol, w.token_mint, w.verified_at, w.created_at, w.updated_at " +
                "from job_applications a join talent_profiles t on t.contractor_id=a.contractor_id join jobs j on j.id=a.job_id " +
                "left join community_profiles cp on cp.id=a.contractor_id " +
                "left join contractor_payout_wallets w on w.contractor_id=a.contractor_id and w.network='solana:devnet' and w.deactivated_at is null " +
                "where a.organization_id=? and a.status='accepted' order by a.contractor_id, a.updated_at desc, w.created_at desc",
            (rs, row) -> {
                var wallet = rs.getObject(10) == null ? null : new PayoutWallets.Wallet(rs.getObject(10, UUID.class),
                    rs.getString(1), rs.getString(11), rs.getString(12), rs.getString(13), rs.getString(14),
                    instant(rs.getTimestamp(15)), instant(rs.getTimestamp(16)), instant(rs.getTimestamp(17)));
                String readiness = wallets.readiness(wallet);
                return new Recipient(
                    rs.getString(1), rs.getObject(2, UUID.class), rs.getString(3), rs.getString(4), rs.getString(5),
                    rs.getString(6), rs.getObject(7, UUID.class), rs.getString(8), rs.getString(9), readiness,
                    // Only a usable address is shared; an invalid stored value is never shown as a recipient.
                    PayoutWallets.READY.equals(readiness) ? wallet.walletAddress() : null,
                    PayoutWallets.READY.equals(readiness) ? wallet.network() : null);
            },
            ORGANIZATION);
    }

    private static Instant instant(java.sql.Timestamp value) {
        return value == null ? null : value.toInstant();
    }

    public record Recipient(String contractorId, UUID applicationId, String displayName, String headline, String email,
        String avatarUrl, UUID jobId, String jobTitle, String applicationStatus, String payoutReadiness, String walletAddress,
        String walletNetwork) {}
}
