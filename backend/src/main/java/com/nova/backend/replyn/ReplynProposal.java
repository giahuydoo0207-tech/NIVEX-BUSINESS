package com.nova.backend.replyn;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * A Replyn proposal as both Nova clients see it. Organization and contractor ids are left out on
 * purpose: the conversation already identifies both parties and internal profile ids are never shown.
 * Amounts are simulated; nothing is funded or held.
 */
public record ReplynProposal(UUID id, UUID threadId, String status, String projectName, String scope,
    List<String> deliverables, Integer revisionLimit, String currency, BigDecimal totalAmount, LocalDate startDate,
    LocalDate deadline, Integer reviewPeriodDays, List<Milestone> milestones, String notes, UUID supersedesId,
    UUID workspaceId, String rejectionReason, Instant createdAt, Instant updatedAt, Instant sentAt, Instant expiresAt,
    Instant acceptedAt, Instant rejectedAt, Instant cancelledAt) {

    public record Milestone(String title, BigDecimal amount, LocalDate deadline) {}

    public boolean draft() { return "DRAFT".equals(status); }
}
