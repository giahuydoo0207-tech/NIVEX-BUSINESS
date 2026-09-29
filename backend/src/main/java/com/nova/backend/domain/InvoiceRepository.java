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
            invoiceSelect() + " where i.organization_id = ? order by i.created_at desc",
            this::mapInvoice,
            organizationId
        );
    }

    public Optional<Invoice> findById(UUID id) {
        return jdbc.query(invoiceSelect() + " where i.id = ?", this::mapInvoice, id)
            .stream()
            .findFirst();
    }

    /**
     * The accepted application an invoice for this contractor pays for. Only an
     * accepted candidate of the organization may be invoiced.
     */
    private UUID acceptedApplication(UUID organizationId, String contractorId, UUID requested) {
        List<UUID> accepted = jdbc.query(
            "select id from job_applications where organization_id=? and contractor_id=? and status='accepted' " +
                "and (?::uuid is null or id=?::uuid) order by updated_at desc limit 1",
            (rs, row) -> rs.getObject(1, UUID.class),
            organizationId, contractorId, requested, requested
        );
        if (accepted.isEmpty()) {
            throw new org.springframework.web.server.ResponseStatusException(
                org.springframework.http.HttpStatus.UNPROCESSABLE_ENTITY,
                "Recipient must be an accepted candidate of this organization"
            );
        }
        return accepted.getFirst();
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

        UUID applicationId = acceptedApplication(organizationId, request.contractorId(), request.applicationId());
        UUID id = UUID.randomUUID();
        long sequence = jdbc.queryForObject("select nextval('invoice_number_seq')", Long.class);
        String invoiceNumber = "NOVA-" + LocalDate.now().getYear() + "-" + String.format("%04d", sequence);
        LocalDate dueDate = LocalDate.parse(request.dueDate());
        BigInteger amountMinor = new BigInteger(request.amountMinor());

        int inserted = jdbc.update(
            "insert into invoices (id, organization_id, contractor_id, application_id, invoice_number, description, amount_minor, currency, due_date, status, idempotency_key) " +
                "values (?, ?, ?, ?, ?, ?, ?, 'USDC', ?, 'DRAFT', ?) " +
                "on conflict (organization_id, idempotency_key) do nothing",
            id,
            organizationId,
            request.contractorId(),
            applicationId,
            invoiceNumber,
            request.description(),
            amountMinor,
            dueDate,
            idempotencyKey
        );
        if (inserted == 1) {
            return new CreateResult(findById(id).orElseThrow(), true);
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
        jdbc.query("select id from invoices where id = ? for update", (rs, row) -> rs.getObject(1), invoiceId);
        Optional<Invoice> invoice = findById(invoiceId);
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
            invoiceSelect() + " where i.organization_id = ? and i.idempotency_key = ?",
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
        return "select i.id, i.organization_id, i.contractor_id, i.invoice_number, i.description, i.amount_minor::text as amount_minor, i.currency, i.due_date, i.status, i.created_at, " +
            "(select p.id from payment_requests p where p.invoice_id=i.id) as payment_request_id, i.application_id, " +
            "t.display_name as recipient_name, cp.avatar_url as recipient_avatar_url, j.title as job_title " +
            "from invoices i left join talent_profiles t on t.contractor_id=i.contractor_id " +
            "left join community_profiles cp on cp.id=i.contractor_id " +
            "left join job_applications a on a.id=i.application_id left join jobs j on j.id=a.job_id";
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
            rs.getObject("payment_request_id", UUID.class),
            rs.getObject("application_id", UUID.class),
            rs.getString("recipient_name"),
            rs.getString("recipient_avatar_url"),
            rs.getString("job_title")
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
