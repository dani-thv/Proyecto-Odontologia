package co.graciaosorio.clinica.service;

import java.time.Clock;
import java.time.LocalDate;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import co.graciaosorio.clinica.domain.Doctor;
import co.graciaosorio.clinica.domain.Patient;
import co.graciaosorio.clinica.domain.Payment;
import co.graciaosorio.clinica.domain.TreatmentPlan;
import co.graciaosorio.clinica.dto.Dtos.PaymentRequest;
import co.graciaosorio.clinica.dto.Dtos.PlanDto;
import co.graciaosorio.clinica.dto.Dtos.PlanRequest;
import co.graciaosorio.clinica.dto.Dtos.ReceiptDto;
import co.graciaosorio.clinica.dto.Mappers;
import co.graciaosorio.clinica.exception.ApiException;
import co.graciaosorio.clinica.repository.PatientRepository;
import co.graciaosorio.clinica.repository.PaymentRepository;
import co.graciaosorio.clinica.repository.TreatmentPlanRepository;

@Service
@Transactional(readOnly = true)
public class PaymentService {

    private final TreatmentPlanRepository plans;
    private final PaymentRepository payments;
    private final PatientRepository patients;
    private final Clock clock;

    public PaymentService(TreatmentPlanRepository plans, PaymentRepository payments,
                          PatientRepository patients, Clock clock) {
        this.plans = plans;
        this.payments = payments;
        this.patients = patients;
        this.clock = clock;
    }

    public List<PlanDto> list(Long patientId) {
        List<TreatmentPlan> found = patientId == null ? plans.findAllByOrderByIdAsc()
                : plans.findByPatientIdOrderByIdAsc(patientId);
        return found.stream().map(Mappers::toDto).toList();
    }

    public PlanDto get(Long id) {
        return Mappers.toDto(find(id));
    }

    @Transactional
    public PlanDto create(PlanRequest req) {
        Patient patient = patients.findById(Formats.id(req.patientId(), "paciente"))
                .orElseThrow(() -> ApiException.notFound("Paciente", req.patientId()));
        return Mappers.toDto(plans.save(new TreatmentPlan(patient, req.concept().trim(), req.totalCost())));
    }

    /** Registra un abono. No puede superar el saldo pendiente del tratamiento. */
    @Transactional
    public PlanDto addPayment(Long planId, PaymentRequest req) {
        TreatmentPlan plan = find(planId);
        long pending = plan.pending();
        if (req.amount() > pending) {
            throw ApiException.unprocessable(
                    "El abono no puede superar el saldo pendiente (%s).".formatted(Formats.cop(pending)));
        }

        LocalDate date = req.date() != null ? req.date() : LocalDate.now(clock);
        plan.addPayment(new Payment(plan, date, concept(plan, req), req.amount(), req.method(),
                req.signature().trim()));
        plans.flush();
        return Mappers.toDto(plan);
    }

    /** Emite el comprobante de recibo de caja de un pago determinado. */
    public ReceiptDto getReceipt(Long paymentId) {
        Payment payment = payments.findById(paymentId)
                .orElseThrow(() -> ApiException.notFound("Pago", paymentId));
        TreatmentPlan plan = payment.getPlan();
        Patient patient = plan.getPatient();
        Doctor doctor = patient.getDoctor();

        long paidBefore = 0;
        for (Payment p : plan.getPayments()) {
            if (p.getId().equals(payment.getId())) {
                break;
            }
            paidBefore += p.getAmount();
        }
        long previousBalance = plan.getTotalCost() - paidBefore;
        long balanceAfterPayment = previousBalance - payment.getAmount();

        String receiptNumber = "RC-" + String.format("%05d", payment.getId());
        String amountFormatted = Formats.cop(payment.getAmount());
        String amountInWords = Formats.numberToWordsCOP(payment.getAmount());
        String totalPlanCostFormatted = Formats.cop(plan.getTotalCost());
        String previousBalanceFormatted = Formats.cop(previousBalance);
        String balanceAfterPaymentFormatted = Formats.cop(balanceAfterPayment);

        String clinicName = "Clínica Odontológica Gracia & Osorio";
        String clinicNit = "900.543.210-1";
        String clinicAddress = "Calle 10 # 4-25, Consultorio 301, Bogotá D.C.";
        String clinicPhone = "PBX: (601) 745 8899 / WhatsApp: 310 452 8814";

        String shareMsg = "Hola *" + patient.getFullName() + "*, te compartimos el soporte de tu pago (" + receiptNumber
                + ") por valor de *" + amountFormatted + "* para tu tratamiento de *" + plan.getConcept()
                + "* en Gracia & Osorio. Saldo pendiente: *" + balanceAfterPaymentFormatted + "*. ¡Muchas gracias!";
        String whatsappShareUrl = Formats.whatsappUrl(patient.getPhone(), shareMsg);

        return new ReceiptDto(
                receiptNumber,
                String.valueOf(payment.getId()),
                String.valueOf(plan.getId()),
                payment.getPaidOn(),
                String.valueOf(patient.getId()),
                patient.getFullName(),
                patient.getDocumentId(),
                patient.getPhone(),
                doctor.getId(),
                doctor.getName(),
                plan.getConcept(),
                payment.getConcept(),
                payment.getAmount(),
                amountFormatted,
                amountInWords,
                payment.getMethod(),
                payment.getSignature(),
                plan.getTotalCost(),
                totalPlanCostFormatted,
                previousBalance,
                previousBalanceFormatted,
                balanceAfterPayment,
                balanceAfterPaymentFormatted,
                clinicName,
                clinicNit,
                clinicAddress,
                clinicPhone,
                whatsappShareUrl);
    }

    /** Genera el comprobante de recibo en formato HTML listo para imprimir o guardar en PDF. */
    public String getReceiptHtml(Long paymentId) {
        ReceiptDto r = getReceipt(paymentId);
        return """
                <!DOCTYPE html>
                <html lang="es">
                <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>Recibo de Caja %s - %s</title>
                  <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
                    .receipt-container { max-width: 680px; margin: 0 auto; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
                    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 24px; }
                    .clinic-title { font-size: 20px; font-weight: 800; color: #1e3a8a; margin: 0 0 4px 0; }
                    .clinic-meta { font-size: 12.5px; color: #64748b; margin: 2px 0; }
                    .receipt-badge { text-align: right; }
                    .badge-tag { background: #dbeafe; color: #1d4ed8; padding: 6px 14px; border-radius: 9999px; font-size: 13px; font-weight: 700; display: inline-block; }
                    .receipt-date { font-size: 12.5px; color: #64748b; margin-top: 6px; }
                    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; background: #f1f5f9; padding: 16px; border-radius: 8px; margin-bottom: 24px; font-size: 13.5px; }
                    .grid-item strong { color: #334155; display: block; font-size: 11.5px; text-transform: uppercase; margin-bottom: 2px; }
                    .amount-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 18px; margin-bottom: 24px; text-align: center; }
                    .amount-num { font-size: 28px; font-weight: 800; color: #166534; margin: 0; }
                    .amount-words { font-size: 13px; color: #15803d; font-style: italic; margin-top: 4px; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13.5px; }
                    th { text-align: left; background: #f8fafc; padding: 10px 12px; border-bottom: 1px solid #e2e8f0; color: #475569; font-weight: 600; }
                    td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; }
                    .balance-summary { margin-left: auto; width: 280px; font-size: 13px; }
                    .balance-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed #e2e8f0; }
                    .balance-row.final { font-weight: 800; font-size: 14.5px; color: #1e3a8a; border-bottom: 2px solid #2563eb; padding-top: 8px; }
                    .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 48px; padding-top: 16px; }
                    .sign-box { border-top: 1px solid #94a3b8; text-align: center; padding-top: 8px; font-size: 12px; color: #475569; }
                    .actions { display: flex; justify-content: center; gap: 12px; margin-top: 28px; }
                    .btn { padding: 10px 20px; font-size: 13.5px; font-weight: 600; border-radius: 8px; cursor: pointer; text-decoration: none; border: none; display: inline-flex; align-items: center; gap: 6px; }
                    .btn-print { background: #2563eb; color: #fff; }
                    .btn-print:hover { background: #1d4ed8; }
                    .btn-wa { background: #16a34a; color: #fff; }
                    .btn-wa:hover { background: #15803d; }
                    @media print {
                      body { background: #fff; padding: 0; }
                      .receipt-container { border: none; box-shadow: none; padding: 0; }
                      .actions { display: none !important; }
                    }
                  </style>
                </head>
                <body>
                  <div class="receipt-container">
                    <div class="header">
                      <div>
                        <h1 class="clinic-title">%s</h1>
                        <p class="clinic-meta">NIT: %s</p>
                        <p class="clinic-meta">%s</p>
                        <p class="clinic-meta">%s</p>
                      </div>
                      <div class="receipt-badge">
                        <span class="badge-tag">RECIBO DE CAJA</span>
                        <div style="font-size: 15px; font-weight: 800; color: #1e3a8a; margin-top: 6px;">%s</div>
                        <div class="receipt-date">Fecha: %s</div>
                      </div>
                    </div>

                    <div class="grid-2">
                      <div class="grid-item">
                        <strong>Paciente</strong>
                        %s (C.C. %s)
                      </div>
                      <div class="grid-item">
                        <strong>Teléfono</strong>
                        %s
                      </div>
                      <div class="grid-item">
                        <strong>Doctor Asignado</strong>
                        %s
                      </div>
                      <div class="grid-item">
                        <strong>Tratamiento</strong>
                        %s
                      </div>
                    </div>

                    <div class="amount-box">
                      <div class="amount-num">%s</div>
                      <div class="amount-words">(%s)</div>
                    </div>

                    <table>
                      <thead>
                        <tr>
                          <th>Concepto del Abono</th>
                          <th>Método de Pago</th>
                          <th style="text-align: right;">Monto</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>%s</td>
                          <td>%s</td>
                          <td style="text-align: right; font-weight: 700;">%s</td>
                        </tr>
                      </tbody>
                    </table>

                    <div class="balance-summary">
                      <div class="balance-row">
                        <span>Costo total plan:</span>
                        <strong>%s</strong>
                      </div>
                      <div class="balance-row">
                        <span>Saldo anterior:</span>
                        <span>%s</span>
                      </div>
                      <div class="balance-row">
                        <span>Abono actual:</span>
                        <span style="color: #16a34a; font-weight: 700;">- %s</span>
                      </div>
                      <div class="balance-row final">
                        <span>Saldo pendiente:</span>
                        <span>%s</span>
                      </div>
                    </div>

                    <div class="signatures">
                      <div class="sign-box">
                        <div style="font-weight: 700; color: #0f172a; margin-bottom: 2px;">%s</div>
                        Firma del Paciente / Recibí conforme
                      </div>
                      <div class="sign-box">
                        <div style="font-weight: 700; color: #0f172a; margin-bottom: 2px;">Gracia &amp; Osorio</div>
                        Firma y Sello Autorizado
                      </div>
                    </div>

                    <div class="actions">
                      <button class="btn btn-print" onclick="window.print()">🖨️ Imprimir / Guardar en PDF</button>
                      <a class="btn btn-wa" href="%s" target="_blank" rel="noreferrer">💬 Compartir por WhatsApp</a>
                    </div>
                  </div>
                </body>
                </html>
                """.formatted(
                r.receiptNumber(), r.patientName(),
                r.clinicName(), r.clinicNit(), r.clinicAddress(), r.clinicPhone(),
                r.receiptNumber(), r.paidOn(),
                r.patientName(), r.patientDocument(),
                r.patientPhone(),
                r.doctorName(),
                r.treatmentConcept(),
                r.amountFormatted(), r.amountInWords(),
                r.paymentConcept(), r.method(), r.amountFormatted(),
                r.totalPlanCostFormatted(), r.previousBalanceFormatted(), r.amountFormatted(), r.balanceAfterPaymentFormatted(),
                r.signature(),
                r.whatsappShareUrl() != null ? r.whatsappShareUrl() : "#"
        );
    }

    private static String concept(TreatmentPlan plan, PaymentRequest req) {
        if (req.concept() != null && !req.concept().isBlank()) {
            return req.concept().trim();
        }
        boolean settlesAll = req.amount() == plan.pending();
        if (settlesAll && plan.getPayments().isEmpty()) {
            return "Pago total – " + plan.getConcept();
        }
        return (plan.getPayments().isEmpty() ? "Cuota inicial – " : "Abono – ") + plan.getConcept();
    }

    private TreatmentPlan find(Long id) {
        return plans.findById(id).orElseThrow(() -> ApiException.notFound("Tratamiento", id));
    }
}
