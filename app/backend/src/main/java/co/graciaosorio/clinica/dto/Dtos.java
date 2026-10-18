package co.graciaosorio.clinica.dto;

import java.time.LocalDate;
import java.util.List;

import co.graciaosorio.clinica.domain.AppointmentStatus;
import co.graciaosorio.clinica.domain.PaymentMethod;
import co.graciaosorio.clinica.domain.ReminderStatus;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

/**
 * Contratos de la API. Los nombres de campo coinciden con los tipos de `frontend/src/types`
 * para que el frontend los consuma sin transformaciones. Los ids viajan como string.
 */
public final class Dtos {

    private Dtos() {
    }

    // ── Catálogos ──
    public record DoctorDto(String id, String name, String label, String specialty, int sortOrder, boolean active) {
        public DoctorDto(String id, String name, String label, String specialty) {
            this(id, name, label, specialty, 0, true);
        }
    }

    public record DoctorRequest(
            @NotBlank(message = "El identificador del doctor es obligatorio.") @Size(max = 20) String id,
            @NotBlank(message = "El nombre del doctor es obligatorio.") @Size(max = 80) String name,
            @NotBlank(message = "La etiqueta es obligatoria.") @Size(max = 120) String label,
            @NotBlank(message = "La especialidad es obligatoria.") @Size(max = 80) String specialty,
            @Min(0) int sortOrder,
            Boolean active) {
    }

    public record DoctorUpdateRequest(
            @NotBlank(message = "El nombre del doctor es obligatorio.") @Size(max = 80) String name,
            @NotBlank(message = "La etiqueta es obligatoria.") @Size(max = 120) String label,
            @NotBlank(message = "La especialidad es obligatoria.") @Size(max = 80) String specialty,
            @Min(0) int sortOrder) {
    }

    public record DoctorStatusRequest(@NotNull(message = "El estado activo es obligatorio.") Boolean active) {
    }

    public record TreatmentDto(String id, String name, Long basePrice, int defaultDurationMin) {
    }

    public record TreatmentRequest(
            @NotBlank(message = "El nombre del tratamiento es obligatorio.") @Size(max = 80) String name,
            @PositiveOrZero(message = "El precio base debe ser cero o positivo.") Long basePrice,
            @Min(value = 5, message = "La duración mínima es de 5 minutos.")
            @Max(value = 480, message = "La duración máxima es de 480 minutos.") int defaultDurationMin) {
    }

    // ── Pacientes ──
    public record PatientDto(String id, String name, String cedula, String doctorId, String phone,
                             LocalDate lastVisit, long balance) {
    }

    public record PatientRequest(
            @NotBlank(message = "Escribe el nombre completo del paciente.") @Size(max = 120) String name,
            @NotBlank(message = "La cédula es obligatoria.") @Size(max = 20) String cedula,
            @NotBlank(message = "El teléfono es obligatorio.") @Size(max = 30) String phone,
            @NotBlank(message = "Selecciona el doctor asignado.") String doctorId,
            LocalDate lastVisit) {
    }

    // ── Citas ──
    public record AppointmentDto(String id, String patientId, String patient, String treatment, String doctorId,
                                 LocalDate date, int startHour, int startMin, int durationMin,
                                 AppointmentStatus status, String patientPhone, String whatsappUrl) {
        public AppointmentDto(String id, String patientId, String patient, String treatment, String doctorId,
                              LocalDate date, int startHour, int startMin, int durationMin, AppointmentStatus status) {
            this(id, patientId, patient, treatment, doctorId, date, startHour, startMin, durationMin, status, null, null);
        }
    }

    public record AppointmentRequest(
            String patientId,
            @NotBlank(message = "Escribe el nombre del paciente.") @Size(max = 120) String patient,
            @Size(max = 120) String treatment,
            @NotBlank(message = "Selecciona el doctor.") String doctorId,
            @NotNull(message = "Selecciona la fecha de la cita.") LocalDate date,
            @Min(0) @Max(23) int startHour,
            @Min(0) @Max(59) int startMin,
            @Min(5) @Max(480) int durationMin,
            @NotNull(message = "Selecciona el estado de la cita.") AppointmentStatus status) {
    }

    public record StatusRequest(@NotNull(message = "Selecciona el estado.") AppointmentStatus status) {
    }

    public record PendingDto(String id, String patientId, String name, String treatment, String phone,
                             LocalDate requestedOn, String whatsappUrl) {
        public PendingDto(String id, String patientId, String name, String treatment, String phone,
                          LocalDate requestedOn) {
            this(id, patientId, name, treatment, phone, requestedOn, null);
        }
    }

    // ── Pagos y Comprobantes de Recibo ──
    public record PaymentDto(String id, LocalDate date, String concept, long amount, PaymentMethod method,
                             String signature) {
    }

    public record ReceiptDto(
            String receiptNumber,
            String paymentId,
            String planId,
            LocalDate paidOn,
            String patientId,
            String patientName,
            String patientDocument,
            String patientPhone,
            String doctorId,
            String doctorName,
            String treatmentConcept,
            String paymentConcept,
            long amount,
            String amountFormatted,
            String amountInWords,
            PaymentMethod method,
            String signature,
            long totalPlanCost,
            String totalPlanCostFormatted,
            long previousBalance,
            String previousBalanceFormatted,
            long balanceAfterPayment,
            String balanceAfterPaymentFormatted,
            String clinicName,
            String clinicNit,
            String clinicAddress,
            String clinicPhone,
            String whatsappShareUrl) {
    }

    public record PaymentRequest(
            /* Si no se envía, se usa la fecha de hoy. */ LocalDate date,
            @Size(max = 160) String concept,
            @Positive(message = "El abono debe ser mayor a cero.") long amount,
            @NotNull(message = "Selecciona el método de pago.") PaymentMethod method,
            @NotBlank(message = "Registra la firma de conformidad.") @Size(max = 80) String signature) {
    }

    public record PlanDto(String id, String patientId, String concept, long totalCost, long totalPaid,
                          long pending, List<PaymentDto> payments) {
    }

    public record PlanRequest(
            @NotBlank(message = "Selecciona el paciente.") String patientId,
            @NotBlank(message = "Escribe el concepto del tratamiento.") @Size(max = 120) String concept,
            @PositiveOrZero(message = "El costo no puede ser negativo.") long totalCost) {
    }

    // ── Recordatorios, caja y dashboard ──
    public record ReminderDto(String id, String appointmentId, ReminderStatus status,
                             String patientName, String patientPhone, String doctorName,
                             LocalDate date, String time, String treatment, String whatsappUrl) {
        public ReminderDto(String id, String appointmentId, ReminderStatus status) {
            this(id, appointmentId, status, "", "", "", null, "", "", null);
        }
    }

    public record CashClosingDto(LocalDate date, long total, List<DoctorAmount> byDoctor,
                                 List<MethodAmount> byMethod, long expectedCash) {
    }

    public record DoctorAmount(String doctorId, long amount) {
    }

    public record MethodAmount(PaymentMethod method, long amount) {
    }

    public record DashboardSummaryDto(LocalDate today, int appointmentsToday, int urgentToday,
                                      List<DoctorCount> byDoctor, int tomorrowTotal, int tomorrowConfirmed,
                                      long toConfirm, long patients) {
    }

    public record DoctorCount(String doctorId, int count) {
    }
}
