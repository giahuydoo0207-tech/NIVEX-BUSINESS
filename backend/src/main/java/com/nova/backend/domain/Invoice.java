package com.nova.backend.domain;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record Invoice(
    UUID id,
    UUID organizationId,
    String contractorId,
    String invoiceNumber,
    String description,
    String amountMinor,
    String currency,
    LocalDate dueDate,
    String status,
    Instant createdAt
) {}
