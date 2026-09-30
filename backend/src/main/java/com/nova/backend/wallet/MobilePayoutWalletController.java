package com.nova.backend.wallet;

import com.nova.backend.mobile.MobileSessionAuthenticator;
import java.time.Instant;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * The signed-in contractor's own payout wallet. The contractor always comes from
 * the mobile session, never from the request, so nobody can edit another
 * contractor's wallet. Only a public address is accepted.
 */
@RestController
@RequestMapping("/api/v1/mobile/wallet/receive")
public class MobilePayoutWalletController {
    private final MobileSessionAuthenticator sessions;
    private final PayoutWallets wallets;
    private final PayoutNetwork payoutNetwork;
    private final String demoRecipient;

    public MobilePayoutWalletController(MobileSessionAuthenticator sessions, PayoutWallets wallets, PayoutNetwork payoutNetwork,
        @Value("${nova.solana.recipient:}") String demoRecipient) {
        this.sessions = sessions;
        this.wallets = wallets;
        this.payoutNetwork = payoutNetwork;
        this.demoRecipient = demoRecipient == null ? "" : demoRecipient.trim();
    }

    @ModelAttribute
    public void preventCaching(jakarta.servlet.http.HttpServletResponse response) {
        response.setHeader("Cache-Control", "no-store");
    }

    @GetMapping
    public ReceiveWallet get(@RequestHeader(value = "Authorization", required = false) String authorization) {
        var scope = sessions.authenticate(authorization);
        return view(wallets.active(scope.contractorId()).orElse(null));
    }

    @PutMapping
    public ReceiveWallet put(@RequestHeader(value = "Authorization", required = false) String authorization,
                             @RequestBody SaveWalletRequest request) {
        var scope = sessions.authenticate(authorization);
        if (!payoutNetwork.isDevnet()) {
            throw new PayoutWalletException(HttpStatus.SERVICE_UNAVAILABLE, "PAYOUTS_UNAVAILABLE",
                "Máy chủ chưa bật nhận tiền trên Solana Devnet.");
        }
        if (!PayoutNetwork.CHAIN.equals(request.network())) {
            throw new PayoutWalletException(HttpStatus.BAD_REQUEST, "UNSUPPORTED_NETWORK",
                "Nova hiện chỉ nhận ví trên Solana Devnet (solana:devnet).");
        }
        if (!Boolean.TRUE.equals(request.confirmPublicAddress())) {
            throw new PayoutWalletException(HttpStatus.BAD_REQUEST, "CONFIRMATION_REQUIRED",
                "Hãy xác nhận đây là địa chỉ ví công khai của bạn trước khi lưu.");
        }
        String address = validate(request.walletAddress());
        return view(wallets.save(scope.contractorId(), address));
    }

    @DeleteMapping
    public ReceiveWallet delete(@RequestHeader(value = "Authorization", required = false) String authorization) {
        var scope = sessions.authenticate(authorization);
        wallets.remove(scope.contractorId());
        return view(null);
    }

    private String validate(String raw) {
        String value = raw == null ? "" : raw.strip();
        if (value.length() > 2000 || value.split("\\s+").length >= 12) {
            throw invalid("SECRET_REJECTED", "Không nhập cụm từ khôi phục (seed phrase). Nova chỉ cần địa chỉ ví công khai.");
        }
        if (value.startsWith("[") || value.length() >= 80 && value.length() <= 90
                && value.chars().allMatch(c -> c < 128 && Character.isLetterOrDigit(c))) {
            // Keypair JSON arrays and 64-byte Base58 strings are exported secret keys, not addresses.
            throw invalid("SECRET_REJECTED", "Đây có vẻ là private key. Không chia sẻ nó với bất kỳ ai; Nova chỉ cần địa chỉ ví công khai.");
        }
        if (SolanaAddress.decode(value) == null) {
            throw invalid("INVALID_WALLET_ADDRESS",
                "Địa chỉ ví không hợp lệ. Hãy dán địa chỉ ví Solana công khai (32–44 ký tự Base58).");
        }
        if (!SolanaAddress.isWalletAddress(value)) {
            throw invalid("NOT_A_WALLET_ADDRESS",
                "Đây là địa chỉ chương trình hoặc tài khoản token (ví dụ tài khoản USDC), không phải ví cá nhân. Hãy dán địa chỉ ví trong Phantom hoặc Solflare.");
        }
        if (value.equals(payoutNetwork.mint()) || value.equals(demoRecipient)) {
            throw invalid("RESERVED_ADDRESS", "Địa chỉ này thuộc hệ thống Nova, không phải ví của bạn.");
        }
        return value;
    }

    private static PayoutWalletException invalid(String code, String message) {
        return new PayoutWalletException(HttpStatus.BAD_REQUEST, code, message);
    }

    private ReceiveWallet view(PayoutWallets.Wallet wallet) {
        String readiness = wallets.readiness(wallet);
        return new ReceiveWallet(
            PayoutWallets.READY.equals(readiness) ? "CONFIGURED" : readiness,
            wallet == null ? null : wallet.walletAddress(),
            PayoutNetwork.CHAIN, PayoutNetwork.TOKEN_SYMBOL, payoutNetwork.mint(),
            wallet != null && wallet.verifiedAt() != null,
            wallet == null ? null : wallet.createdAt(),
            wallet == null ? null : wallet.updatedAt());
    }

    public record SaveWalletRequest(String walletAddress, String network, Boolean confirmPublicAddress) {}

    /** status is CONFIGURED, NOT_CONFIGURED or INVALID. Never carries a secret. */
    public record ReceiveWallet(String status, String walletAddress, String network, String tokenSymbol, String tokenMint,
        boolean ownershipVerified, Instant createdAt, Instant updatedAt) {}
}
