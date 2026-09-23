package com.nova.backend.payment;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class PaymentService {
    private final JdbcTemplate jdbc;
    private final DevnetRpc rpc;
    private final String recipient;

    public PaymentService(JdbcTemplate jdbc, DevnetRpc rpc,
        @Value("${nova.solana.recipient:}") String recipient) {
        this.jdbc = jdbc;
        this.rpc = rpc;
        this.recipient = recipient;
    }

    public PaymentView get(UUID id) {
        return read(id, false);
    }

    @Transactional
    public PaymentView prepare(UUID id) {
        var payment = read(id, true);
        if (payment.reference() != null) return payment;
        if (!"ISSUED".equals(payment.invoiceStatus())) throw error(HttpStatus.CONFLICT, "Invoice is not issued");
        if (recipient.isBlank() || !recipient.matches("[1-9A-HJ-NP-Za-km-z]{32,44}")) {
            throw error(HttpStatus.SERVICE_UNAVAILABLE, "Demo recipient is not configured");
        }
        if (payment.dueDate().isBefore(java.time.LocalDate.now(java.time.ZoneOffset.UTC))) {
            throw error(HttpStatus.CONFLICT, "Invoice expired");
        }
        rpc.requireDevnet();
        var mint = rpc.call("getAccountInfo", List.of(DevnetRpc.MINT, Map.of("encoding", "jsonParsed", "commitment", "confirmed"))).path("value");
        if (!DevnetRpc.TOKEN_PROGRAM.equals(mint.path("owner").asText())
            || !"mint".equals(mint.at("/data/parsed/type").asText())
            || mint.at("/data/parsed/info/decimals").asInt(-1) != 6) {
            throw error(HttpStatus.SERVICE_UNAVAILABLE, "USDC mint validation failed");
        }
        String reference = "nova:" + id;
        jdbc.update("update payment_requests set recipient_address=?, token_mint=?, amount_minor=?, reference=?, status='AWAITING_PAYMENT', updated_at=now() where id=?",
            recipient, DevnetRpc.MINT, new java.math.BigDecimal(payment.amountMinor()), reference, id);
        jdbc.update("update invoices set status='AWAITING_PAYMENT', updated_at=now() where id=?", payment.invoiceId());
        return read(id, false);
    }

    @Transactional
    public PaymentView verify(UUID id, String signature) {
        if (!signature.matches("[1-9A-HJ-NP-Za-km-z]{64,88}")) throw error(HttpStatus.BAD_REQUEST, "Invalid signature");
        var payment = read(id, true);
        if (payment.reference() == null) throw error(HttpStatus.CONFLICT, "Prepare payment first");
        if (payment.signature() != null && !payment.signature().equals(signature)) {
            throw error(HttpStatus.CONFLICT, "This invoice already has a verified transaction");
        }
        if ("PAID_ON_CHAIN".equals(payment.status())) return payment;
        if (!List.of("AWAITING_PAYMENT", "PAYMENT_DETECTED").contains(payment.status())) {
            throw error(HttpStatus.CONFLICT, "Payment is not payable");
        }
        rpc.requireDevnet();
        var statuses = rpc.call("getSignatureStatuses", List.of(List.of(signature), Map.of("searchTransactionHistory", true)));
        var status = statuses.path("value").path(0);
        String commitment = status.path("confirmationStatus").asText();
        if (status.isNull() || status.isMissingNode() || "processed".equals(commitment)) {
            throw error(HttpStatus.ACCEPTED, "Transaction pending; retry verification");
        }
        if (!status.has("err") || !status.get("err").isNull()) throw error(HttpStatus.UNPROCESSABLE_ENTITY, "Transaction failed");
        if (!List.of("confirmed", "finalized").contains(commitment)) throw error(HttpStatus.SERVICE_UNAVAILABLE, "Unknown confirmation status");
        var tx = rpc.call("getTransaction", List.of(signature, Map.of("encoding", "jsonParsed", "commitment", commitment, "maxSupportedTransactionVersion", 1)));
        if (tx.isNull()) throw error(HttpStatus.ACCEPTED, "Transaction not yet indexed; retry verification");
        PaymentVerifier.verify(tx, signature, payment.recipient(), payment.mint(), payment.reference(),
            payment.amountMinor(), payment.createdAt().getEpochSecond());
        var used = jdbc.queryForList("select id from payment_requests where transaction_signature=? and id<>?", signature, id);
        if (!used.isEmpty()) throw error(HttpStatus.CONFLICT, "Transaction already belongs to another invoice");
        String next = "finalized".equals(commitment) ? "PAID_ON_CHAIN" : "PAYMENT_DETECTED";
        jdbc.update("insert into payment_ledger_entries (payment_request_id, commitment, signature, recipient, mint, amount_minor, reference) " +
            "values (?, ?, ?, ?, ?, ?, ?) on conflict (payment_request_id, commitment) do nothing",
            id, commitment, signature, payment.recipient(), payment.mint(),
            new java.math.BigDecimal(payment.amountMinor()), payment.reference());
        jdbc.update("update payment_requests set status=?, transaction_signature=?, confirmed_at=coalesce(confirmed_at,now()), finalized_at=case when ?='PAID_ON_CHAIN' then now() else finalized_at end, updated_at=now() where id=?",
            next, signature, next, id);
        jdbc.update("update invoices set status=?, updated_at=now() where id=?", next, payment.invoiceId());
        return read(id, false);
    }

    private PaymentView read(UUID id, boolean lock) {
        var rows = jdbc.query("select p.*, i.invoice_number, i.description, i.due_date, i.amount_minor::text as invoice_amount, i.status as invoice_status from payment_requests p join invoices i on i.id=p.invoice_id where p.id=?" + (lock ? " for update of p,i" : ""),
            (rs, row) -> new PaymentView(rs.getObject("id", UUID.class), rs.getObject("invoice_id", UUID.class),
                rs.getString("invoice_number"), rs.getString("description"), rs.getDate("due_date").toLocalDate(),
                "solana:devnet", rs.getString("recipient_address"), rs.getString("token_mint"),
                rs.getString("amount_minor") == null ? rs.getString("invoice_amount") : rs.getString("amount_minor"),
                rs.getString("reference"), rs.getString("status"), rs.getString("invoice_status"),
                rs.getString("transaction_signature"), rs.getTimestamp("created_at").toInstant()), id);
        if (rows.isEmpty()) throw error(HttpStatus.NOT_FOUND, "Payment request not found");
        return rows.getFirst();
    }

    private static ResponseStatusException error(HttpStatus status, String reason) {
        return new ResponseStatusException(status, reason);
    }

    public record PaymentView(UUID id, UUID invoiceId, String invoiceNumber, String description,
        java.time.LocalDate dueDate, String chain, String recipient, String mint, String amountMinor,
        String reference, String status, String invoiceStatus, String signature, Instant createdAt) {}
}
