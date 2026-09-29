package com.nova.backend.mobile;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * One wallet read model for Mobile Home and Wallet, computed from the payment
 * ledger of the signed-in contractor only.
 *
 * Devnet payments currently settle into the server-configured demo recipient,
 * not into a wallet owned by the contractor. Those amounts are reported as
 * paid through the demo wallet and never as the contractor's own balance:
 * availableBalance stays 0 until contractors have their own payout wallets.
 * The ledger key (payment_request_id, commitment) and the unique signature
 * make every finalized payment count exactly once.
 */
@RestController
@RequestMapping("/api/v1/mobile/wallet")
public class MobileWalletController {
    private static final String FINALIZED_FOR_CONTRACTOR =
        "from payment_ledger_entries l join payment_requests p on p.id=l.payment_request_id " +
        "join invoices i on i.id=p.invoice_id where i.organization_id=? and i.contractor_id=? and l.commitment='finalized'";

    private final JdbcTemplate jdbc;
    private final MobileSessionAuthenticator sessions;
    private final MobileController transactions;
    private final String network;
    private final String demoRecipient;

    public MobileWalletController(JdbcTemplate jdbc, MobileSessionAuthenticator sessions, MobileController transactions,
        @Value("${nova.network:devnet}") String network, @Value("${nova.solana.recipient:}") String demoRecipient) {
        this.jdbc = jdbc;
        this.sessions = sessions;
        this.transactions = transactions;
        this.network = network;
        this.demoRecipient = demoRecipient;
    }

    @ModelAttribute
    public void preventCaching(jakarta.servlet.http.HttpServletResponse response) {
        response.setHeader("Cache-Control", "no-store");
    }

    @GetMapping("/summary")
    public WalletSummary summary(@RequestHeader(value = "Authorization", required = false) String authorization) {
        var scope = sessions.authenticate(authorization);
        BigDecimal paidAllTime = sum("select coalesce(sum(l.amount_minor),0) " + FINALIZED_FOR_CONTRACTOR, scope);
        BigDecimal paidLast7Days = sum("select coalesce(sum(l.amount_minor),0) " + FINALIZED_FOR_CONTRACTOR
            + " and l.recorded_at >= now() - interval '7 days'", scope);
        // Issued but not yet finalized on chain: never counted as received.
        BigDecimal pending = sum("select coalesce(sum(i.amount_minor),0) from invoices i where i.organization_id=? and i.contractor_id=? "
            + "and i.status in ('ISSUED','AWAITING_PAYMENT','PAYMENT_DETECTED')", scope);
        BigDecimal personal = BigDecimal.ZERO;
        return new WalletSummary(
            personal.toPlainString(), usdc(personal),
            paidAllTime.toPlainString(), usdc(paidAllTime),
            paidLast7Days.toPlainString(), usdc(paidLast7Days),
            pending.toPlainString(), usdc(pending),
            "USDC", network, true, null, demoRecipient.isBlank() ? null : demoRecipient, Instant.now());
    }

    @GetMapping("/transactions")
    public List<MobileController.MobileTransaction> transactions(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @RequestParam(defaultValue = "0") int offset,
        @RequestParam(defaultValue = "25") int limit) {
        return transactions.transactions(authorization, offset, limit);
    }

    private BigDecimal sum(String sql, MobileSessionAuthenticator.Scope scope) {
        BigDecimal value = jdbc.queryForObject(sql, BigDecimal.class, scope.organizationId(), scope.contractorId());
        return value == null ? BigDecimal.ZERO : value;
    }

    private static String usdc(BigDecimal minor) {
        return minor.movePointLeft(6).setScale(2, RoundingMode.DOWN).toPlainString();
    }

    public record WalletSummary(
        String availableBalanceMinor, String availableBalanceUsdc,
        String paidViaDemoWalletMinor, String paidViaDemoWalletUsdc,
        String earnedLast7DaysMinor, String earnedLast7DaysUsdc,
        String pendingBalanceMinor, String pendingBalanceUsdc,
        String currency, String network, boolean isDemoWallet,
        String walletAddress, String demoRecipientAddress, Instant lastUpdatedAt) {}
}
