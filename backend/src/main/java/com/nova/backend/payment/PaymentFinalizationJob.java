package com.nova.backend.payment;

import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.web.server.ResponseStatusException;

/** Recheck only signatures already verified at confirmed commitment. */
@Configuration
@EnableScheduling
@ConditionalOnProperty(name="nova.payments.finalizer-enabled", havingValue="true")
public class PaymentFinalizationJob {
    private static final Logger LOG = LoggerFactory.getLogger(PaymentFinalizationJob.class);
    private final JdbcTemplate jdbc;
    private final PaymentService payments;

    public PaymentFinalizationJob(JdbcTemplate jdbc, PaymentService payments) {
        this.jdbc = jdbc;
        this.payments = payments;
    }

    @Scheduled(fixedDelayString="${nova.payments.finalizer-delay-ms:30000}")
    public void finalizeDetected() {
        var pending = jdbc.query("select id, transaction_signature from payment_requests " +
            "where status='PAYMENT_DETECTED' and transaction_signature is not null " +
            "order by updated_at, id limit 25",
            (rs, row) -> new Pending(rs.getObject(1, UUID.class), rs.getString(2)));
        for (var item : pending) {
            try {
                payments.verify(item.id(), item.signature());
            } catch (ResponseStatusException exception) {
                LOG.warn("Payment finalization deferred for {} (HTTP {})", item.id(), exception.getStatusCode().value());
            } catch (RuntimeException exception) {
                LOG.error("Payment finalization failed for {} ({})", item.id(), exception.getClass().getSimpleName());
            } finally {
                // Rotate deferred rows so a stale transaction cannot starve newer payments.
                jdbc.update("update payment_requests set updated_at=now() where id=? and status='PAYMENT_DETECTED'", item.id());
            }
        }
    }

    private record Pending(UUID id, String signature) {}
}
