package com.nova.backend.application;

import com.nova.backend.mobile.MobileSessionAuthenticator;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@Validated
@RequestMapping("/api/v1/mobile/applications")
public class MobileApplicationController {
    private final JobApplicationRepository repository; private final MobileSessionAuthenticator sessions;
    public MobileApplicationController(JobApplicationRepository repository, MobileSessionAuthenticator sessions) { this.repository=repository; this.sessions=sessions; }
    @GetMapping public List<JobApplication> list(@RequestHeader(value="Authorization",required=false) String authorization, @RequestParam(defaultValue="0") int offset, @RequestParam(defaultValue="25") int limit) { page(offset,limit); return repository.forContractor(sessions.authenticate(authorization).contractorId(),offset,limit); }
    @PostMapping @org.springframework.web.bind.annotation.ResponseStatus(HttpStatus.CREATED) public JobApplication submit(@RequestHeader(value="Authorization",required=false) String authorization, @Valid @RequestBody SubmitRequest request) { return repository.submit(request.jobId(),sessions.authenticate(authorization).contractorId(),request.coverNote()); }
    @PostMapping("/{applicationId}/withdraw") public JobApplication withdraw(@RequestHeader(value="Authorization",required=false) String authorization,@PathVariable UUID applicationId) { return repository.withdraw(applicationId,sessions.authenticate(authorization).contractorId()); }
    private void page(int offset,int limit){if(offset<0||offset>100000||limit<1||limit>100)throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Invalid pagination");}
    public record SubmitRequest(UUID jobId,@NotBlank @Size(max=4000) String coverNote) {}
}
