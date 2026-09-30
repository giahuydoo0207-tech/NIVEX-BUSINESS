package com.nova.backend.wallet;

import com.nova.backend.payment.DevnetRpc;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * The one network and token Nova pays out in, read from backend configuration
 * (SOLANA_NETWORK, SOLANA_USDC_MINT). Clients never choose either.
 */
@Component
public class PayoutNetwork {
    public static final String CHAIN = "solana:devnet";
    public static final String TOKEN_SYMBOL = "USDC";

    private final String network;
    private final String mint;

    public PayoutNetwork(@Value("${nova.network:devnet}") String network, @Value("${nova.usdc-mint:}") String mint) {
        this.network = network == null ? "" : network.trim();
        String configured = mint == null ? "" : mint.trim();
        this.mint = configured.isEmpty() ? DevnetRpc.MINT : configured;
        if (SolanaAddress.decode(this.mint) == null) {
            throw new IllegalStateException("SOLANA_USDC_MINT is not a Solana address");
        }
    }

    /** Payouts are only offered on Solana Devnet in this release. */
    public boolean isDevnet() { return "devnet".equalsIgnoreCase(network); }

    public String network() { return network; }

    public String mint() { return mint; }
}
