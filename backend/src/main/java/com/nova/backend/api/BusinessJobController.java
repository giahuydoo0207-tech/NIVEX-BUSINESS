package com.nova.backend.api;

import com.nova.backend.domain.Job;
import com.nova.backend.domain.JobRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/** Job management for the Nova Business workspace; protected by the server-side demo key. */
@RestController
@RequestMapping("/api/v1/business/jobs")
public class BusinessJobController {
    private static final UUID ORGANIZATION = JobRepository.DEFAULT_ORGANIZATION;
    private final JobRepository repository;

    public BusinessJobController(JobRepository repository) { this.repository = repository; }

    @GetMapping
    public List<Job> list() { return repository.forOrganization(ORGANIZATION); }

    @GetMapping("/{jobId}")
    public Job get(@PathVariable UUID jobId) {
        Job job = repository.find(jobId);
        if (!job.organizationId().equals(ORGANIZATION)) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Job not found");
        return job;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Job create(@Valid @RequestBody JobController.CreateJobRequest request) {
        return repository.create(new JobController.CreateJobRequest(ORGANIZATION, request.title(), request.category(),
            request.summary(), request.budgetMinMinor(), request.budgetMaxMinor(), request.locationScope(),
            request.applicationDeadline(), request.skills(), request.engagement(), request.paymentType(),
            request.duration(), request.publish()));
    }

    @PatchMapping("/{jobId}/status")
    public Job status(@PathVariable UUID jobId, @Valid @RequestBody StatusRequest request) {
        return repository.changeStatus(jobId, ORGANIZATION, request.status().trim().toUpperCase(Locale.ROOT));
    }

    public record StatusRequest(@NotBlank String status) {}
}
