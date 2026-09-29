package com.nova.backend.api;

import com.nova.backend.payment.DevnetRpc;
import java.time.Instant;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class HealthController {
    @Value("${nova.network:devnet}")
    private String network;

    @Value("${nova.solana.recipient:}")
    private String recipient;

    @GetMapping("/health")
    public Map<String, Object> health() {
        return Map.of(
            "ok", true,
            "service", "nova-backend",
            "version", "v1",
            "network", network,
            "usdcMint", DevnetRpc.MINT,
            "paymentsConfigured", recipient.matches("[1-9A-HJ-NP-Za-km-z]{32,44}"),
            "timestamp", Instant.now().toString()
        );
    }
}
