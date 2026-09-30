package com.nova.backend.api;

import com.nova.backend.wallet.PayoutNetwork;
import java.time.Instant;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class HealthController {
    private final PayoutNetwork payoutNetwork;

    public HealthController(PayoutNetwork payoutNetwork) {
        this.payoutNetwork = payoutNetwork;
    }

    @GetMapping("/health")
    public Map<String, Object> health() {
        return Map.of(
            "ok", true,
            "service", "nova-backend",
            "version", "v1",
            "network", payoutNetwork.network(),
            "usdcMint", payoutNetwork.mint(),
            "paymentsConfigured", payoutNetwork.isDevnet(),
            // Payments go to each contractor's own wallet, never a server wallet.
            "payoutRecipient", "CONTRACTOR_WALLET",
            "timestamp", Instant.now().toString()
        );
    }
}
