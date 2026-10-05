package com.nova.backend.replyn;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Pattern;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Server-to-server: Replyn's server asks which accepted workspaces the identity in its signed session
 * may open. Authenticated with the same client secret as QR login. The identity travels in the body,
 * not the URL, and only workspaces the identity is a party to are ever returned; an unknown workspace
 * and someone else's look the same.
 */
@RestController
@RequestMapping("/api/v1/integrations/replyn/workspaces")
public class ReplynWorkspaceIntegrationController {
    private static final Pattern TALENT_SUBJECT = Pattern.compile("^[A-Za-z0-9][A-Za-z0-9._:-]{0,119}$");
    private final ReplynClientAuthenticator client;
    private final ReplynProposalService proposals;

    public ReplynWorkspaceIntegrationController(ReplynClientAuthenticator client, ReplynProposalService proposals) {
        this.client = client;
        this.proposals = proposals;
    }

    @ModelAttribute
    public void preventCaching(jakarta.servlet.http.HttpServletResponse response) {
        response.setHeader("Cache-Control", "no-store");
    }

    @PostMapping("/lookup")
    public ResponseEntity<?> lookup(@RequestHeader(value = ReplynClientAuthenticator.HEADER, required = false) String secret,
                                    @RequestBody(required = false) LookupRequest request) {
        if (!client.configured()) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of("status", "DISABLED", "message", "Replyn integration is not configured."));
        }
        if (!client.matches(secret)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("status", "UNAUTHORIZED", "message", "Replyn client authentication failed."));
        }
        if (request == null || !validSubject(request.subjectType(), request.subjectId())) {
            return ResponseEntity.badRequest().body(Map.of("status", "INVALID_REQUEST", "message", "subjectType and subjectId are required."));
        }
        UUID workspaceId = null;
        if (request.workspaceId() != null) {
            try {
                workspaceId = UUID.fromString(request.workspaceId());
            } catch (IllegalArgumentException malformed) {
                return notFound();
            }
        }
        List<ReplynProposalService.WorkspaceView> workspaces = proposals.workspacesFor(request.subjectType(), request.subjectId(), workspaceId);
        if (workspaceId != null && workspaces.isEmpty()) return notFound();
        return ResponseEntity.ok(Map.of("workspaces", workspaces));
    }

    private static boolean validSubject(String type, String id) {
        if (id == null) return false;
        if ("ORGANIZATION".equals(type)) {
            try {
                UUID.fromString(id);
                return id.length() == 36;
            } catch (IllegalArgumentException malformed) {
                return false;
            }
        }
        return "TALENT".equals(type) && TALENT_SUBJECT.matcher(id).matches();
    }

    private static ResponseEntity<?> notFound() {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("status", "NOT_FOUND", "message", "Workspace not found."));
    }

    public record LookupRequest(String subjectType, String subjectId, String workspaceId) {
        @Override public String toString() { return "LookupRequest[subjectType=" + subjectType + "]"; }
    }
}
