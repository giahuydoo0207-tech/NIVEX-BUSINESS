package com.nova.backend.replyn;

import java.util.Map;
import org.springframework.http.HttpStatus;

/** A refused proposal request with a stable code for clients and, for validation, per-field messages. */
public class ReplynProposalException extends RuntimeException {
    private final HttpStatus status;
    private final String code;
    private final Map<String, String> errors;

    public ReplynProposalException(HttpStatus status, String code, String message) {
        this(status, code, message, Map.of());
    }

    public ReplynProposalException(HttpStatus status, String code, String message, Map<String, String> errors) {
        super(message);
        this.status = status;
        this.code = code;
        this.errors = Map.copyOf(errors);
    }

    public HttpStatus status() { return status; }
    public String code() { return code; }
    public Map<String, String> errors() { return errors; }
}
