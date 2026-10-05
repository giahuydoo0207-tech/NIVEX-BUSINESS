package com.nova.backend.replyn;

import com.nova.backend.mobile.MobileSessionAuthenticator;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/** Nova Mobile approves a Replyn QR login for the Talent signed in on the phone. */
@RestController
@RequestMapping("/api/v1/mobile/replyn/pairings")
public class MobileReplynPairingController {
    private final MobileSessionAuthenticator sessions;
    private final ReplynPairingService pairings;

    public MobileReplynPairingController(MobileSessionAuthenticator sessions, ReplynPairingService pairings) {
        this.sessions = sessions;
        this.pairings = pairings;
    }

    /** Also covers framework error responses such as a malformed JSON body. */
    @ModelAttribute
    public void preventCaching(jakarta.servlet.http.HttpServletResponse response) {
        response.setHeader("Cache-Control", "no-store");
    }

    @PostMapping("/{pairingId}/approve")
    public ResponseEntity<?> approve(@RequestHeader(value = "Authorization", required = false) String authorization,
                                     @PathVariable String pairingId,
                                     @RequestBody(required = false) ApproveRequest request) {
        MobileSessionAuthenticator.Scope scope;
        try {
            scope = sessions.authenticate(authorization);
        } catch (ResponseStatusException exception) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("status", "UNAUTHORIZED", "message", "Mobile session expired or invalid."));
        }
        // Validated by hand: Bean Validation would log the rejected value, which is the QR secret.
        if (request == null || request.qrSecret() == null || !ReplynPairingService.SECRET.matcher(request.qrSecret()).matches()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("status", "INVALID_REQUEST", "message", "qrSecret is required."));
        }
        if (!ReplynPairingService.PAIRING_ID.matcher(pairingId).matches()) return ReplynResponses.outcome(ReplynPairingService.Outcome.NOT_FOUND);
        return ReplynResponses.outcome(pairings.approve(UUID.fromString(pairingId), request.qrSecret(), scope.contractorId()));
    }

    public record ApproveRequest(String qrSecret) {
        @Override public String toString() { return "ApproveRequest[]"; }
    }
}
