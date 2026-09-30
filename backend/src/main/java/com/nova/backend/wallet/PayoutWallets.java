package com.nova.backend.wallet;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

/**
 * Contractor payout wallets. A contractor has at most one active wallet per
 * network; replacing or removing it deactivates the old row, which keeps the
 * history of every address the contractor used.
 */
@Repository
public class PayoutWallets {
    public static final String READY = "READY";
    public static final String NOT_CONFIGURED = "NOT_CONFIGURED";
    public static final String INVALID = "INVALID";

    private static final Logger LOG = LoggerFactory.getLogger(PayoutWallets.class);
    private static final String COLUMNS =
        "id, contractor_id, wallet_address, network, token_symbol, token_mint, verified_at, created_at, updated_at";

    private final JdbcTemplate jdbc;
    private final PayoutNetwork payoutNetwork;

    public PayoutWallets(JdbcTemplate jdbc, PayoutNetwork payoutNetwork) {
        this.jdbc = jdbc;
        this.payoutNetwork = payoutNetwork;
    }

    public Optional<Wallet> active(String contractorId) {
        return jdbc.query("select " + COLUMNS + " from contractor_payout_wallets where contractor_id=? and network=? " +
                "and deactivated_at is null order by created_at desc limit 1",
            this::map, contractorId, PayoutNetwork.CHAIN).stream().findFirst();
    }

    /** READY only for a valid wallet address on the network and token the backend pays out in. */
    public String readiness(Wallet wallet) {
        if (wallet == null) return NOT_CONFIGURED;
        return payoutNetwork.isDevnet()
            && PayoutNetwork.CHAIN.equals(wallet.network())
            && payoutNetwork.mint().equals(wallet.tokenMint())
            && SolanaAddress.isWalletAddress(wallet.walletAddress()) ? READY : INVALID;
    }

    /** The contractor's wallet to pay right now, or a 422 explaining why there is none. */
    public Wallet requireReady(String contractorId) {
        Wallet wallet = active(contractorId).orElseThrow(PayoutWalletException::notConfigured);
        if (!READY.equals(readiness(wallet))) throw PayoutWalletException.invalidStored();
        return wallet;
    }

    /** Saves an address already validated by the caller. Saving the current address again changes nothing. */
    @Transactional
    public Wallet save(String contractorId, String walletAddress) {
        // Serialize concurrent saves of one contractor on their profile row.
        if (jdbc.query("select 1 from talent_profiles where contractor_id=? for update", (rs, row) -> 1, contractorId).isEmpty()) {
            throw new PayoutWalletException(HttpStatus.FORBIDDEN, "PROFILE_NOT_FOUND", "Không tìm thấy hồ sơ của phiên đăng nhập này.");
        }
        Optional<Wallet> current = active(contractorId);
        if (current.isPresent() && current.get().walletAddress().equals(walletAddress)
                && payoutNetwork.mint().equals(current.get().tokenMint())) {
            return current.get();
        }
        deactivate(contractorId);
        UUID id = UUID.randomUUID();
        jdbc.update("insert into contractor_payout_wallets (id, contractor_id, wallet_address, network, token_symbol, token_mint) " +
            "values (?, ?, ?, ?, ?, ?)", id, contractorId, walletAddress, PayoutNetwork.CHAIN, PayoutNetwork.TOKEN_SYMBOL, payoutNetwork.mint());
        LOG.info("Payout wallet changed for contractor {} ({})", contractorId, previous(current));
        return active(contractorId).orElseThrow();
    }

    /** Deactivates the contractor's wallet; payment requests and ledger rows keep the address they used. */
    @Transactional
    public boolean remove(String contractorId) {
        boolean removed = deactivate(contractorId) > 0;
        if (removed) LOG.info("Payout wallet removed for contractor {}", contractorId);
        return removed;
    }

    private int deactivate(String contractorId) {
        return jdbc.update("update contractor_payout_wallets set deactivated_at=now(), updated_at=now() " +
            "where contractor_id=? and network=? and deactivated_at is null", contractorId, PayoutNetwork.CHAIN);
    }

    private static String previous(Optional<Wallet> current) {
        return current.isPresent() ? "replaced " + current.get().id() : "first wallet";
    }

    private Wallet map(ResultSet rs, int row) throws SQLException {
        return new Wallet(rs.getObject("id", UUID.class), rs.getString("contractor_id"), rs.getString("wallet_address"),
            rs.getString("network"), rs.getString("token_symbol"), rs.getString("token_mint"),
            instant(rs, "verified_at"), instant(rs, "created_at"), instant(rs, "updated_at"));
    }

    private static Instant instant(ResultSet rs, String column) throws SQLException {
        var value = rs.getTimestamp(column);
        return value == null ? null : value.toInstant();
    }

    public record Wallet(UUID id, String contractorId, String walletAddress, String network, String tokenSymbol,
        String tokenMint, Instant verifiedAt, Instant createdAt, Instant updatedAt) {}
}
