package com.nova.backend.mobile;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

/** Read-only access scoped by the server-side session. */
@RestController
@RequestMapping("/api/v1/mobile")
public class MobileController {
    private final JdbcTemplate jdbc;

    public MobileController(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    @ModelAttribute
    public void preventCaching(jakarta.servlet.http.HttpServletResponse response) {
        response.setHeader("Cache-Control", "no-store");
    }

    private Scope authenticate(String authorization) {
        if (authorization == null || !authorization.matches("Bearer [A-Za-z0-9_-]{43,128}")) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Mobile session required");
        }
        var rows = jdbc.query("select organization_id, contractor_id from mobile_sessions " +
            "where token_hash=? and revoked_at is null and expires_at>now()",
            (rs, row) -> new Scope(rs.getObject(1, UUID.class), rs.getString(2)),
            hashToken(authorization.substring(7)));
        if (rows.isEmpty()) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Mobile session expired or invalid");
        return rows.getFirst();
    }

    public static String hashToken(String token) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                .digest(token.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException exception) { throw new IllegalStateException(exception); }
    }

    @GetMapping("/me")
    public Scope me(@RequestHeader(value="Authorization", required=false) String authorization) {
        return authenticate(authorization);
    }

    @GetMapping("/invoices")
    public List<MobileInvoice> invoices(
        @RequestHeader(value="Authorization", required=false) String authorization,
        @RequestParam(defaultValue="0") int offset,
        @RequestParam(defaultValue="25") int limit) {
        var scope = authenticate(authorization);
        page(offset, limit);
        return jdbc.query("select i.id, i.invoice_number, i.description, i.amount_minor::text, i.status, " +
            "i.due_date::text, p.id as payment_id from invoices i left join payment_requests p on p.invoice_id=i.id " +
            "where i.organization_id=? and i.contractor_id=? and i.status<>'DRAFT' " +
            "order by i.created_at desc, i.id desc limit ? offset ?",
            (rs, row) -> new MobileInvoice(rs.getObject(1, UUID.class), rs.getString(2), rs.getString(3),
                rs.getString(4), rs.getString(5), rs.getString(6), rs.getObject(7, UUID.class)),
            scope.organizationId(), scope.contractorId(), limit, offset);
    }

    @GetMapping("/transactions")
    public List<MobileTransaction> transactions(
        @RequestHeader(value="Authorization", required=false) String authorization,
        @RequestParam(defaultValue="0") int offset,
        @RequestParam(defaultValue="25") int limit) {
        var scope = authenticate(authorization);
        page(offset, limit);
        return jdbc.query("select l.signature, l.amount_minor::text, l.recipient, l.mint, l.recorded_at, " +
            "i.id from payment_ledger_entries l join payment_requests p on p.id=l.payment_request_id " +
            "join invoices i on i.id=p.invoice_id where i.organization_id=? and i.contractor_id=? " +
            "and l.commitment='finalized' order by l.recorded_at desc, l.payment_request_id desc limit ? offset ?",
            (rs, row) -> new MobileTransaction(rs.getString(1), rs.getString(2), rs.getString(3),
                rs.getString(4), rs.getTimestamp(5).toInstant().toString(), rs.getObject(6, UUID.class)),
            scope.organizationId(), scope.contractorId(), limit, offset);
    }

    private void page(int offset, int limit) {
        if (offset<0 || offset>100000 || limit<1 || limit>100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid pagination");
        }
    }

    public record Scope(UUID organizationId, String contractorId) {}
    public record MobileInvoice(UUID id, String invoiceNumber, String description, String amountMinor,
        String status, String dueDate, UUID paymentRequestId) {}
    public record MobileTransaction(String signature, String amountMinor, String recipient, String mint,
        String recordedAt, UUID invoiceId) {}
}
