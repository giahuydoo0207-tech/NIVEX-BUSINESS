package com.nova.backend.application;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@Validated
@RequestMapping("/api/v1/applications")
public class BusinessApplicationController {
    private static final UUID NOVA_LABS = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private final JobApplicationRepository repository;
    public BusinessApplicationController(JobApplicationRepository repository) { this.repository = repository; }

    @GetMapping public List<JobApplication> list(@RequestParam(defaultValue="0") int offset, @RequestParam(defaultValue="25") int limit) { page(offset, limit); return repository.forOrganization(NOVA_LABS, offset, limit); }
    @PatchMapping("/{applicationId}/status") public JobApplication status(@PathVariable UUID applicationId, @Valid @RequestBody StatusRequest request) { return repository.transition(applicationId, NOVA_LABS, status(request.status()), request.note()); }
    private void page(int offset, int limit) { if(offset<0 || offset>100000 || limit<1 || limit>100) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Invalid pagination"); }
    private String status(String status) { String value=status.trim().toLowerCase(); if(!List.of("viewed","shortlisted","interview","accepted","rejected").contains(value)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Invalid status"); return value; }
    public record StatusRequest(@NotBlank String status, @Size(max=1000) String note) {}
}
