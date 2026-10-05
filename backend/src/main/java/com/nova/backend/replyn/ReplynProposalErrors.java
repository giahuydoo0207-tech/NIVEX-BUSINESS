package com.nova.backend.replyn;

import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/** One JSON shape for refused proposal requests: {status, message, errors?}. */
@RestControllerAdvice(assignableTypes = {BusinessReplynProposalController.class, MobileReplynProposalController.class})
class ReplynProposalErrors {
    @ExceptionHandler(ReplynProposalException.class)
    ResponseEntity<Map<String, Object>> refused(ReplynProposalException exception) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status", exception.code());
        body.put("message", exception.getMessage());
        if (!exception.errors().isEmpty()) body.put("errors", exception.errors());
        return ResponseEntity.status(exception.status()).body(body);
    }

    /** Malformed JSON, a date that is not yyyy-MM-dd or a non-numeric amount. */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    ResponseEntity<Map<String, Object>> unreadable(HttpMessageNotReadableException exception) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(Map.of("status", "INVALID_REQUEST", "message", "Dữ liệu đề xuất không đúng định dạng."));
    }
}
