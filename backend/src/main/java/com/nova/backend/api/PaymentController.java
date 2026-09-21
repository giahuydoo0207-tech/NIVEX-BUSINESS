package com.nova.backend.api;

import com.nova.backend.payment.PaymentService;
import com.nova.backend.payment.PaymentService.PaymentView;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.util.UUID;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/payment-requests")
public class PaymentController {
    private final PaymentService service;
    public PaymentController(PaymentService service) { this.service = service; }
    @GetMapping("/{id}")
    public PaymentView get(@PathVariable UUID id) { return service.get(id); }
    @PostMapping("/{id}/prepare")
    public PaymentView prepare(@PathVariable UUID id) { return service.prepare(id); }
    @PostMapping("/{id}/verify")
    public PaymentView verify(@PathVariable UUID id, @Valid @RequestBody VerifyRequest request) {
        return service.verify(id, request.signature());
    }
    public record VerifyRequest(@NotBlank String signature) {}
}
