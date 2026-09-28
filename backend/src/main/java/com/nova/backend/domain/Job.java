package com.nova.backend.domain;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record Job(
    UUID id,
    UUID organizationId,
    String organizationName,
    String title,
    String category,
    String summary,
    List<String> skills,
    String engagement,
    String paymentType,
    String duration,
    long budgetMinMinor,
    long budgetMaxMinor,
    String currency,
    String locationScope,
    LocalDate applicationDeadline,
    String status,
    int applicantCount,
    Instant createdAt,
    Instant publishedAt
) {}
