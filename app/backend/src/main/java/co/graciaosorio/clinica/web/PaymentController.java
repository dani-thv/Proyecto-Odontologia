package co.graciaosorio.clinica.web;

import java.net.URI;
import java.util.List;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import co.graciaosorio.clinica.dto.Dtos.PaymentRequest;
import co.graciaosorio.clinica.dto.Dtos.PlanDto;
import co.graciaosorio.clinica.dto.Dtos.PlanRequest;
import co.graciaosorio.clinica.dto.Dtos.ReceiptDto;
import co.graciaosorio.clinica.service.Formats;
import co.graciaosorio.clinica.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api")
@Tag(name = "Pagos y Recibos", description = "Tratamientos, abonos y comprobantes de recibo de caja")
public class PaymentController {

    private final PaymentService service;

    public PaymentController(PaymentService service) {
        this.service = service;
    }

    @GetMapping("/treatment-plans")
    @Operation(summary = "Tratamientos con sus abonos, saldo y total abonado (opcional: patientId)")
    public List<PlanDto> list(@RequestParam(required = false) String patientId) {
        return service.list(patientId == null || patientId.isBlank() ? null : Formats.id(patientId, "paciente"));
    }

    @GetMapping("/treatment-plans/{id}")
    public PlanDto get(@PathVariable String id) {
        return service.get(Formats.id(id, "tratamiento"));
    }

    @PostMapping("/treatment-plans")
    public ResponseEntity<PlanDto> create(@Valid @RequestBody PlanRequest request) {
        PlanDto created = service.create(request);
        return ResponseEntity.created(URI.create("/api/treatment-plans/" + created.id())).body(created);
    }

    @PostMapping("/treatment-plans/{id}/payments")
    @Operation(summary = "Registra un abono y devuelve el tratamiento actualizado. 422 si supera el saldo pendiente.")
    public ResponseEntity<PlanDto> addPayment(@PathVariable String id, @Valid @RequestBody PaymentRequest request) {
        PlanDto updated = service.addPayment(Formats.id(id, "tratamiento"), request);
        return ResponseEntity.created(URI.create("/api/treatment-plans/" + updated.id())).body(updated);
    }

    // ── Comprobantes de Recibo de Caja ──

    @GetMapping("/payments/{id}/receipt")
    @Operation(summary = "Obtiene los datos contables y legales del comprobante de recibo de caja (RC-XXXXX)")
    public ReceiptDto receipt(@PathVariable String id) {
        return service.getReceipt(Formats.id(id, "pago"));
    }

    @GetMapping(value = "/payments/{id}/receipt/html", produces = MediaType.TEXT_HTML_VALUE)
    @Operation(summary = "Genera el comprobante de recibo en HTML con membrete, imprimible y con enlace a WhatsApp")
    public ResponseEntity<String> receiptHtml(@PathVariable String id) {
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("text/html;charset=UTF-8"))
                .body(service.getReceiptHtml(Formats.id(id, "pago")));
    }

    @GetMapping("/treatment-plans/{planId}/payments/{paymentId}/receipt")
    @Operation(summary = "Alias para obtener el comprobante de recibo de caja de un plan")
    public ReceiptDto planReceipt(@PathVariable String planId, @PathVariable String paymentId) {
        return receipt(paymentId);
    }

    @GetMapping(value = "/treatment-plans/{planId}/payments/{paymentId}/receipt/html", produces = MediaType.TEXT_HTML_VALUE)
    @Operation(summary = "Alias para obtener el comprobante de recibo de caja en HTML")
    public ResponseEntity<String> planReceiptHtml(@PathVariable String planId, @PathVariable String paymentId) {
        return receiptHtml(paymentId);
    }
}
