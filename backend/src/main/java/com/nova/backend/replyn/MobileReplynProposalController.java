package com.nova.backend.replyn;

import com.nova.backend.mobile.MobileSessionAuthenticator;
import java.util.UUID;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** The Talent signed in on Nova Mobile accepts or rejects a proposal in one of their conversations. */
@RestController
@RequestMapping("/api/v1/mobile/messages/{threadId}/replyn-proposals/{proposalId}")
public class MobileReplynProposalController {
    private final MobileSessionAuthenticator sessions;
    private final ReplynProposalService proposals;

    public MobileReplynProposalController(MobileSessionAuthenticator sessions, ReplynProposalService proposals) {
        this.sessions = sessions;
        this.proposals = proposals;
    }

    @PostMapping("/accept")
    public ReplynProposal accept(@RequestHeader(value = "Authorization", required = false) String authorization,
                                 @PathVariable UUID threadId, @PathVariable UUID proposalId) {
        return proposals.accept(threadId, proposalId, sessions.authenticate(authorization).contractorId());
    }

    @PostMapping("/reject")
    public ReplynProposal reject(@RequestHeader(value = "Authorization", required = false) String authorization,
                                 @PathVariable UUID threadId, @PathVariable UUID proposalId,
                                 @RequestBody(required = false) RejectRequest request) {
        return proposals.reject(threadId, proposalId, sessions.authenticate(authorization).contractorId(),
            request == null ? null : request.reason());
    }

    public record RejectRequest(String reason) {}
}
