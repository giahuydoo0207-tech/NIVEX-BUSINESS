package com.nova.backend.replyn;

import com.nova.backend.replyn.ReplynPairingService.Consumed;
import com.nova.backend.replyn.ReplynPairingService.CreatedPairing;
import java.time.Instant;
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

/**
 * Server-to-server API for Replyn's backend. Browsers never call it: Replyn's server holds
 * REPLYN_QR_CLIENT_SECRET and forwards only what the browser may see.
 */
@RestController
@RequestMapping("/api/v1/integrations/replyn/pairings")
public class ReplynIntegrationController {
    private final ReplynClientAuthenticator client;
    private final ReplynPairingService pairings;

    public ReplynIntegrationController(ReplynClientAuthenticator client, ReplynPairingService pairings) {
        this.client = client;
        this.pairings = pairings;
    }

    /** Also covers framework error responses such as a malformed JSON body. */
    @ModelAttribute
    public void preventCaching(jakarta.servlet.http.HttpServletResponse response) {
        response.setHeader("Cache-Control", "no-store");
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestHeader(value = ReplynClientAuthenticator.HEADER, required = false) String secret,
                                    @RequestBody(required = false) CreateRequest request) {
        ResponseEntity<?> denied = deny(secret);
        if (denied != null) return denied;
        if (request != null && request.action() != null && !"login".equals(request.action())) {
            return respond(HttpStatus.BAD_REQUEST, Map.of("status", "INVALID_REQUEST", "message", "Only action=login is supported."));
        }
        CreatedPairing created = pairings.create();
        return respond(HttpStatus.CREATED, new CreateResponse(created.pairingId(), created.qrSecret(), created.browserSecret(),
            created.expiresAt(), "login"));
    }

    @PostMapping("/{pairingId}/consume")
    public ResponseEntity<?> consume(@RequestHeader(value = ReplynClientAuthenticator.HEADER, required = false) String secret,
                                     @PathVariable String pairingId,
                                     @RequestBody(required = false) ConsumeRequest request) {
        ResponseEntity<?> denied = deny(secret);
        if (denied != null) return denied;
        if (request == null || request.browserSecret() == null || !ReplynPairingService.SECRET.matcher(request.browserSecret()).matches()) {
            return respond(HttpStatus.BAD_REQUEST, Map.of("status", "INVALID_REQUEST", "message", "browserSecret is required."));
        }
        if (!ReplynPairingService.PAIRING_ID.matcher(pairingId).matches()) return ReplynResponses.outcome(ReplynPairingService.Outcome.NOT_FOUND);
        Consumed consumed = pairings.consume(UUID.fromString(pairingId), request.browserSecret());
        if (consumed.identity() == null) return ReplynResponses.outcome(consumed.outcome());
        var identity = consumed.identity();
        return respond(HttpStatus.OK, new ConsumeResponse("CONSUMED",
            new Identity("NOVA", "TALENT", identity.contractorId(), identity.displayName(), "freelancer"), identity.approvedAt()));
    }

    private ResponseEntity<?> deny(String secret) {
        if (!client.configured()) {
            return respond(HttpStatus.SERVICE_UNAVAILABLE, Map.of("status", "DISABLED", "message", "Replyn QR login is not configured."));
        }
        if (!client.matches(secret)) {
            return respond(HttpStatus.UNAUTHORIZED, Map.of("status", "UNAUTHORIZED", "message", "Replyn client authentication failed."));
        }
        return null;
    }

    private static ResponseEntity<?> respond(HttpStatus status, Object body) {
        return ResponseEntity.status(status).body(body);
    }

    public record CreateRequest(String action) {}
    public record CreateResponse(UUID pairingId, String qrSecret, String browserSecret, Instant expiresAt, String action) {
        @Override public String toString() { return "CreateResponse[pairingId=" + pairingId + "]"; }
    }
    public record ConsumeRequest(String browserSecret) {
        @Override public String toString() { return "ConsumeRequest[]"; }
    }
    public record Identity(String provider, String subjectType, String subjectId, String displayName, String role) {}
    public record ConsumeResponse(String status, Identity identity, Instant approvedAt) {}
}
