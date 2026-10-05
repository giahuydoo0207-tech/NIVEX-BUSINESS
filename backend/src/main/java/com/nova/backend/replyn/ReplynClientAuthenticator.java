package com.nova.backend.replyn;

import com.nova.backend.mobile.MobileSessionAuthenticator;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/** Checks the server-to-server secret that only Replyn's server holds. */
@Component
public class ReplynClientAuthenticator {
    static final String HEADER = "X-Replyn-Client-Secret";
    private static final int MIN_SECRET_LENGTH = 32;
    private static final Logger log = LoggerFactory.getLogger(ReplynClientAuthenticator.class);
    private final byte[] expectedHash;

    public ReplynClientAuthenticator(@Value("${nova.replyn.qr-client-secret:}") String secret) {
        String value = secret == null ? "" : secret.trim();
        if (!value.isEmpty() && value.length() < MIN_SECRET_LENGTH) {
            log.warn("REPLYN_QR_CLIENT_SECRET is shorter than {} characters; Replyn QR login stays disabled.", MIN_SECRET_LENGTH);
        }
        this.expectedHash = value.length() < MIN_SECRET_LENGTH ? null : digest(value);
    }

    public boolean configured() { return expectedHash != null; }

    public boolean matches(String presented) {
        if (expectedHash == null || presented == null || presented.isEmpty()) return false;
        // Digests have a fixed length, so the comparison time does not depend on the presented value.
        return MessageDigest.isEqual(expectedHash, digest(presented));
    }

    private static byte[] digest(String value) {
        return MobileSessionAuthenticator.hashToken(value).getBytes(StandardCharsets.US_ASCII);
    }
}
