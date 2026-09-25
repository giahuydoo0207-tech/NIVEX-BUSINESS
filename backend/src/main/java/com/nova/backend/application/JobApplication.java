package com.nova.backend.application;

import java.time.Instant;
import java.util.UUID;

public record JobApplication(UUID id, UUID jobId, String jobTitle, String contractorId, String candidateName,
    String headline, String email, String location, String skillsJson, String coverNote, String status,
    Instant submittedAt, Instant updatedAt, Instant withdrawnAt) {}
