package com.nova.backend.credential;

import java.util.Map;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Lets a Nova service check a Business's Nova ID + Nova Key pair. It does not issue a session. */
@RestController
@RequestMapping("/api/v1/nova-credentials")
public class NovaIdentityController {
    private static final int MAX_ID_LENGTH = 32;
    private static final int MAX_KEY_LENGTH = 128;
    private static final Map<String, String> INVALID = Map.of("message", "Nova ID or Nova Key is invalid.");
    private static final Map<String, String> MALFORMED = Map.of("message", "novaId and novaKey are required.");
    private final NovaCredentialService credentials;

    public NovaIdentityController(NovaCredentialService credentials) { this.credentials = credentials; }

    @PostMapping("/verify")
    public ResponseEntity<?> verify(@RequestBody VerifyRequest request) {
        // Validated by hand: Bean Validation failures are logged with the rejected value, which would leak the key.
        if (!present(request.novaId(), MAX_ID_LENGTH) || !present(request.novaKey(), MAX_KEY_LENGTH)) {
            return respond(HttpStatus.BAD_REQUEST, MALFORMED);
        }
        return credentials.verify(request.novaId(), request.novaKey())
            .<ResponseEntity<?>>map(identity -> respond(HttpStatus.OK, identity))
            .orElseGet(() -> respond(HttpStatus.UNAUTHORIZED, INVALID));
    }

    private static boolean present(String value, int maxLength) {
        return value != null && !value.isBlank() && value.length() <= maxLength;
    }

    private static ResponseEntity<?> respond(HttpStatus status, Object body) {
        return ResponseEntity.status(status).cacheControl(CacheControl.noStore()).body(body);
    }

    public record VerifyRequest(String novaId, String novaKey) {
        @Override public String toString() { return "VerifyRequest[novaId=" + novaId + "]"; }
    }
}
