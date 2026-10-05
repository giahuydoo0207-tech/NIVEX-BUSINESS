package com.nova.backend.message;

import com.nova.backend.replyn.ReplynProposal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * A conversation between one organization and one talent. {@code unreadForTalent} counts business
 * messages the talent has not opened; {@code unreadForBusiness} counts talent messages the business
 * has not opened. {@code replynProposals} are cards next to the messages, not messages; the talent
 * never sees drafts or business-only preferences such as {@code businessMuted}.
 */
public record MessageThread(UUID id, String contractorId, String candidateName, String headline, String requestStatus,
    Instant createdAt, Instant acceptedAt, Instant updatedAt, UUID organizationId, String organizationName,
    String candidateAvatarUrl, String organizationAvatarUrl, long unreadForTalent, long unreadForBusiness,
    List<ThreadMessage> messages, boolean businessMuted, List<ReplynProposal> replynProposals) {

    /** The talent's view of the thread. */
    MessageThread forTalent() {
        return new MessageThread(id, contractorId, candidateName, headline, requestStatus, createdAt, acceptedAt, updatedAt,
            organizationId, organizationName, candidateAvatarUrl, organizationAvatarUrl, unreadForTalent, unreadForBusiness, messages,
            false, replynProposals.stream().filter(proposal -> !proposal.draft()).toList());
    }
}
