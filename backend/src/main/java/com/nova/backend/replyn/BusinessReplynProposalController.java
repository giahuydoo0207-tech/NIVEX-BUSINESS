package com.nova.backend.replyn;

import com.nova.backend.replyn.ReplynProposalService.ProposalInput;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Nova Business drafts, sends and withdraws Replyn proposals in one of its conversations. Guarded by
 * the demo API key like the rest of /api/v1/messages; the organization comes from that credential,
 * never from the request body.
 */
@RestController
@RequestMapping("/api/v1/messages/{threadId}/replyn-proposals")
public class BusinessReplynProposalController {
    private static final UUID ORG = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private final ReplynProposalService proposals;
    private final com.nova.backend.message.MessageRepository threads;

    public BusinessReplynProposalController(ReplynProposalService proposals, com.nova.backend.message.MessageRepository threads) {
        this.proposals = proposals;
        this.threads = threads;
    }

    @GetMapping
    public List<ReplynProposal> list(@PathVariable UUID threadId) {
        threads.requireBusinessThread(threadId, ORG);
        return proposals.forThread(threadId, true);
    }

    /** Saves a draft, or with {@code send=true} validates the whole agreement and sends it at once. */
    @PostMapping
    public ResponseEntity<ReplynProposal> create(@PathVariable UUID threadId, @RequestParam(defaultValue = "false") boolean send,
                                                 @RequestBody ProposalInput input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(proposals.create(threadId, ORG, input, send));
    }

    @PutMapping("/{proposalId}")
    public ReplynProposal update(@PathVariable UUID threadId, @PathVariable UUID proposalId, @RequestBody ProposalInput input) {
        return proposals.updateDraft(threadId, proposalId, ORG, input);
    }

    @PostMapping("/{proposalId}/send")
    public ReplynProposal send(@PathVariable UUID threadId, @PathVariable UUID proposalId) {
        return proposals.send(threadId, proposalId, ORG);
    }

    /** 200 with the withdrawn proposal, or 204 when a draft was discarded. */
    @PostMapping("/{proposalId}/cancel")
    public ResponseEntity<ReplynProposal> cancel(@PathVariable UUID threadId, @PathVariable UUID proposalId) {
        return proposals.cancel(threadId, proposalId, ORG).map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.noContent().build());
    }
}
