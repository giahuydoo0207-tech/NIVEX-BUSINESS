package com.nova.backend.domain;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record Job(
    UUID id,
    UUID organizationId,
    String title,
    String category,
    String summary,
    long budgetMinMinor,
    long budgetMaxMinor,
    String currency,
    String locationScope,
    LocalDate applicationDeadline,
    String status,
    Instant createdAt
) {}
