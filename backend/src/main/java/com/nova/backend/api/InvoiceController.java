package com.nova.backend.api;

import com.nova.backend.domain.Invoice;
import com.nova.backend.domain.InvoiceRepository;
import com.nova.backend.domain.InvoiceRepository.CreateResult;
import com.nova.backend.domain.InvoiceRepository.IssuedInvoice;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@Validated
@RequestMapping("/api/v1/invoices")
public class InvoiceController {
    private static final UUID DEFAULT_ORGANIZATION_ID =
        UUID.fromString("00000000-0000-0000-0000-000000000001");

    private final InvoiceRepository repository;

    public InvoiceController(InvoiceRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<Invoice> list(
        @RequestParam(required = false) UUID organizationId
    ) {
        return repository.findByOrganization(
            organizationId == null ? DEFAULT_ORGANIZATION_ID : organizationId
        );
    }

    @PostMapping
    public ResponseEntity<Invoice> create(
        @RequestHeader("Idempotency-Key") @NotBlank String idempotencyKey,
        @Valid @RequestBody CreateInvoiceRequest request
    ) {
        validateDueDate(request.dueDate());
        CreateResult result = repository.createOrFind(request, idempotencyKey);
        return ResponseEntity.status(result.created() ? HttpStatus.CREATED : HttpStatus.OK)
            .body(result.invoice());
    }

    @PostMapping("/{invoiceId}/issue")
    public IssuedInvoice issue(
        @PathVariable UUID invoiceId,
        @RequestHeader("Idempotency-Key") @NotBlank String idempotencyKey
    ) {
        if (repository.findById(invoiceId).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Invoice not found.");
        }
        return repository.issue(invoiceId).orElseThrow(() -> new ResponseStatusException(
            HttpStatus.CONFLICT,
            "Invoice must exist and be a draft before it can be issued."
        ));
    }

    private void validateDueDate(String value) {
        try {
            if (!LocalDate.parse(value).isAfter(LocalDate.now())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Due date must be in the future.");
            }
        } catch (ResponseStatusException exception) {
            throw exception;
        } catch (RuntimeException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Due date must be ISO-8601.");
        }
    }

    public record CreateInvoiceRequest(
        UUID organizationId,
        @NotBlank String contractorId,
        @NotBlank String description,
        @NotBlank @Pattern(regexp = "^[1-9][0-9]*$") String amountMinor,
        @NotBlank String dueDate
    ) {}
}
