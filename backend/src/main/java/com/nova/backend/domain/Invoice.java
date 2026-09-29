package com.nova.backend.domain;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * recipientName, recipientAvatarUrl and jobTitle are read from the talent and
 * application tables; they are null for legacy invoices whose contractor does
 * not exist in the backend.
 */
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
    Instant createdAt,
    UUID paymentRequestId,
    UUID applicationId,
    String recipientName,
    String recipientAvatarUrl,
    String jobTitle
) {}
