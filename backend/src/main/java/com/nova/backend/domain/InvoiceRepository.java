package com.nova.backend.domain;

import com.nova.backend.api.InvoiceController.CreateInvoiceRequest;
import java.math.BigInteger;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public class InvoiceRepository {
    private static final UUID DEFAULT_ORGANIZATION_ID =
        UUID.fromString("00000000-0000-0000-0000-000000000001");

    private final JdbcTemplate jdbc;

    public InvoiceRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public List<Invoice> findByOrganization(UUID organizationId) {
        return jdbc.query(
            invoiceSelect() + " where organization_id = ? order by created_at desc",
            this::mapInvoice,
            organizationId
        );
    }

    public Optional<Invoice> findById(UUID id) {
        return jdbc.query(invoiceSelect() + " where id = ?", this::mapInvoice, id)
            .stream()
            .findFirst();
    }

    public CreateResult createOrFind(CreateInvoiceRequest request, String idempotencyKey) {
        UUID organizationId = request.organizationId() == null
            ? DEFAULT_ORGANIZATION_ID
            : request.organizationId();
        Optional<Invoice> existing = findByIdempotencyKey(organizationId, idempotencyKey);
        if (existing.isPresent()) {
            checkReplay(existing.get(), request);
            return new CreateResult(existing.get(), false);
        }

        UUID id = UUID.randomUUID();
        long sequence = jdbc.queryForObject("select nextval('invoice_number_seq')", Long.class);
        String invoiceNumber = "NOVA-" + LocalDate.now().getYear() + "-" + String.format("%04d", sequence);
        LocalDate dueDate = LocalDate.parse(request.dueDate());
        BigInteger amountMinor = new BigInteger(request.amountMinor());

        List<Invoice> inserted = jdbc.query(
            "insert into invoices (id, organization_id, contractor_id, invoice_number, description, amount_minor, currency, due_date, status, idempotency_key) " +
                "values (?, ?, ?, ?, ?, ?, 'USDC', ?, 'DRAFT', ?) " +
                "on conflict (organization_id, idempotency_key) do nothing " +
                "returning id, organization_id, contractor_id, invoice_number, description, amount_minor::text as amount_minor, currency, due_date, status, created_at, null::uuid as payment_request_id",
            this::mapInvoice,
            id,
            organizationId,
            request.contractorId(),
            invoiceNumber,
            request.description(),
            amountMinor,
            dueDate,
            idempotencyKey
        );
        if (!inserted.isEmpty()) {
            return new CreateResult(inserted.getFirst(), true);
        }
        Invoice replay = findByIdempotencyKey(organizationId, idempotencyKey).orElseThrow();
        checkReplay(replay, request);
        return new CreateResult(replay, false);
    }

    private void checkReplay(Invoice existing, CreateInvoiceRequest request) {
        if (!existing.contractorId().equals(request.contractorId()) || !existing.description().equals(request.description())
            || !existing.amountMinor().equals(request.amountMinor()) || !existing.dueDate().toString().equals(request.dueDate())) {
            throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.CONFLICT,
                "Idempotency key already used for a different invoice");
        }
    }

    @Transactional
    public Optional<IssuedInvoice> issue(UUID invoiceId) {
        Optional<Invoice> invoice = jdbc.query(invoiceSelect() + " where id = ? for update", this::mapInvoice, invoiceId).stream().findFirst();
        if (invoice.isEmpty()) {
            return Optional.empty();
        }
        Optional<PaymentRequest> existingPayment = findPaymentByInvoiceId(invoiceId);
        if (existingPayment.isPresent()) {
            return Optional.of(new IssuedInvoice(invoice.get(), existingPayment.get()));
        }
        if (!"DRAFT".equals(invoice.get().status())) {
            return Optional.empty();
        }

        PaymentRequest payment = jdbc.queryForObject(
            "insert into payment_requests (id, invoice_id, network, status) values (?, ?, 'Solana Devnet', 'CREATED') " +
                "returning id, invoice_id, network, status, created_at",
            this::mapPaymentRequest,
            UUID.randomUUID(),
            invoiceId
        );
        jdbc.update(
            "update invoices set status = 'ISSUED', updated_at = now() where id = ?",
            invoiceId
        );
        return Optional.of(new IssuedInvoice(findById(invoiceId).orElseThrow(), payment));
    }

    private Optional<Invoice> findByIdempotencyKey(UUID organizationId, String idempotencyKey) {
        return jdbc.query(
            invoiceSelect() + " where organization_id = ? and idempotency_key = ?",
            this::mapInvoice,
            organizationId,
            idempotencyKey
        ).stream().findFirst();
    }

    private Optional<PaymentRequest> findPaymentByInvoiceId(UUID invoiceId) {
        return jdbc.query(
            "select id, invoice_id, network, status, created_at from payment_requests where invoice_id = ?",
            this::mapPaymentRequest,
            invoiceId
        ).stream().findFirst();
    }

    private String invoiceSelect() {
        return "select id, organization_id, contractor_id, invoice_number, description, amount_minor::text as amount_minor, currency, due_date, status, created_at, " +
            "(select p.id from payment_requests p where p.invoice_id=invoices.id) as payment_request_id from invoices";
    }

    private Invoice mapInvoice(ResultSet rs, int row) throws SQLException {
        return new Invoice(
            rs.getObject("id", UUID.class),
            rs.getObject("organization_id", UUID.class),
            rs.getString("contractor_id"),
            rs.getString("invoice_number"),
            rs.getString("description"),
            rs.getString("amount_minor"),
            rs.getString("currency"),
            rs.getDate("due_date").toLocalDate(),
            rs.getString("status"),
            rs.getTimestamp("created_at").toInstant(),
            rs.getObject("payment_request_id", UUID.class)
        );
    }

    private PaymentRequest mapPaymentRequest(ResultSet rs, int row) throws SQLException {
        return new PaymentRequest(
            rs.getObject("id", UUID.class),
            rs.getObject("invoice_id", UUID.class),
            rs.getString("network"),
            rs.getString("status"),
            rs.getTimestamp("created_at").toInstant()
        );
    }

    public record CreateResult(Invoice invoice, boolean created) {}

    public record IssuedInvoice(Invoice invoice, PaymentRequest paymentRequest) {}
}
