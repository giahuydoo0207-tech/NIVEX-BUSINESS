package com.nova.backend.api;

import com.nova.backend.domain.Job;
import com.nova.backend.domain.JobRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Validated
@RequestMapping("/api/v1/jobs")
public class JobController {
    private final JobRepository repository;

    public JobController(JobRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<Job> list() {
        return repository.findPublished();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Job create(@Valid @RequestBody CreateJobRequest request) {
        return repository.create(request);
    }

    public record CreateJobRequest(
        UUID organizationId,
        @NotBlank String title,
        @NotBlank String category,
        @NotBlank String summary,
        @PositiveOrZero long budgetMinMinor,
        @PositiveOrZero long budgetMaxMinor,
        @NotBlank String locationScope,
        @NotBlank String applicationDeadline
    ) {}
}
