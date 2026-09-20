package com.nova.backend.domain;

import java.time.Instant;
import java.util.UUID;

public record PaymentRequest(
    UUID id,
    UUID invoiceId,
    String network,
    String status,
    Instant createdAt
) {}
