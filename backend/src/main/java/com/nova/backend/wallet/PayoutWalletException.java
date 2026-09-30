package com.nova.backend.wallet;

import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * A payout-wallet failure with a stable code for clients and a message that is
 * safe to show. The message never echoes what the user typed, so a pasted
 * secret key cannot leak back into responses or logs.
 */
public class PayoutWalletException extends RuntimeException {
    public static final String NOT_CONFIGURED_MESSAGE = "Ứng viên chưa cấu hình ví nhận USDC trên Solana Devnet.";

    private final HttpStatus status;
    private final String code;

    public PayoutWalletException(HttpStatus status, String code, String message) {
        super(message, null, false, false);
        this.status = status;
        this.code = code;
    }

    public static PayoutWalletException notConfigured() {
        return new PayoutWalletException(HttpStatus.UNPROCESSABLE_ENTITY, "WALLET_NOT_CONFIGURED", NOT_CONFIGURED_MESSAGE);
    }

    public static PayoutWalletException invalidStored() {
        return new PayoutWalletException(HttpStatus.UNPROCESSABLE_ENTITY, "WALLET_INVALID",
            "Ví nhận tiền đã lưu của ứng viên không hợp lệ trên Solana Devnet. Ứng viên cần cập nhật lại ví.");
    }

    public HttpStatus status() { return status; }

    public String code() { return code; }

    @RestControllerAdvice
    public static class Handler {
        @ExceptionHandler(PayoutWalletException.class)
        public ResponseEntity<Map<String, Object>> handle(PayoutWalletException exception) {
            return ResponseEntity.status(exception.status()).body(Map.of(
                "status", exception.status().value(),
                "code", exception.code(),
                "message", exception.getMessage()));
        }
    }
}
