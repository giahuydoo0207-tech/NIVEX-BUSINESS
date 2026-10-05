package com.nova.backend.replyn;

import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

/** One status code and body per pairing outcome, shared by the mobile and Replyn endpoints. */
final class ReplynResponses {
    private ReplynResponses() {}

    static ResponseEntity<?> outcome(ReplynPairingService.Outcome outcome) {
        HttpStatus status = switch (outcome) {
            case PENDING -> HttpStatus.ACCEPTED;
            case APPROVED, CONSUMED -> HttpStatus.OK;
            case EXPIRED -> HttpStatus.GONE;
            case ALREADY_USED -> HttpStatus.CONFLICT;
            // Unknown ID and wrong secret look identical, so a caller learns nothing about other challenges.
            case NOT_FOUND -> HttpStatus.NOT_FOUND;
            case NO_TALENT_PROFILE -> HttpStatus.FORBIDDEN;
        };
        String message = switch (outcome) {
            case PENDING -> "Waiting for Nova Mobile.";
            case APPROVED -> "Approved.";
            case CONSUMED -> "Consumed.";
            case EXPIRED -> "This QR code has expired.";
            case ALREADY_USED -> "This QR code has already been used.";
            case NOT_FOUND -> "QR code not found.";
            case NO_TALENT_PROFILE -> "This Nova account has no Talent profile.";
        };
        // Cache-Control: no-store comes from the controllers' @ModelAttribute, which also covers error responses.
        return ResponseEntity.status(status).body(Map.of("status", outcome.name(), "message", message));
    }
}
