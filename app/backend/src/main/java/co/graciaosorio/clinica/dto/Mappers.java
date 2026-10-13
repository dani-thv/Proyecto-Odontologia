package co.graciaosorio.clinica.dto;

import java.util.List;

import co.graciaosorio.clinica.domain.Appointment;
import co.graciaosorio.clinica.domain.Doctor;
import co.graciaosorio.clinica.domain.Patient;
import co.graciaosorio.clinica.domain.PendingReschedule;
import co.graciaosorio.clinica.domain.Payment;
import co.graciaosorio.clinica.domain.Reminder;
import co.graciaosorio.clinica.domain.Treatment;
import co.graciaosorio.clinica.domain.TreatmentPlan;
import co.graciaosorio.clinica.dto.Dtos.AppointmentDto;
import co.graciaosorio.clinica.dto.Dtos.DoctorDto;
import co.graciaosorio.clinica.dto.Dtos.PatientDto;
import co.graciaosorio.clinica.dto.Dtos.PaymentDto;
import co.graciaosorio.clinica.dto.Dtos.PendingDto;
import co.graciaosorio.clinica.dto.Dtos.PlanDto;
import co.graciaosorio.clinica.dto.Dtos.ReminderDto;
import co.graciaosorio.clinica.dto.Dtos.TreatmentDto;
import co.graciaosorio.clinica.service.Formats;

/** Entidad → DTO. Deben llamarse dentro de una transacción (hay relaciones lazy). */
public final class Mappers {

    private Mappers() {
    }

    public static DoctorDto toDto(Doctor d) {
        return new DoctorDto(d.getId(), d.getName(), d.getLabel(), d.getSpecialty(), d.getSortOrder(), d.isActive());
    }

    public static TreatmentDto toDto(Treatment t) {
        return new TreatmentDto(String.valueOf(t.getId()), t.getName(), t.getBasePrice(), t.getDefaultDurationMin());
    }

    public static PatientDto toDto(Patient p, long balance) {
        return new PatientDto(String.valueOf(p.getId()), p.getFullName(), p.getDocumentId(), p.getDoctor().getId(),
                p.getPhone(), p.getLastVisit(), balance);
    }

    public static AppointmentDto toDto(Appointment a) {
        String phone = a.getPatient() != null ? a.getPatient().getPhone() : null;
        String time = Formats.time(a.getStartTime().getHour(), a.getStartTime().getMinute());
        String msg = "Hola *" + a.getPatientName() + "*, te recordamos tu cita odontológica en Gracia & Osorio el día *"
                + a.getDate() + "* a las *" + time + "*. ¡Te esperamos!";
        String whatsappUrl = phone != null ? Formats.whatsappUrl(phone, msg) : null;
        return new AppointmentDto(String.valueOf(a.getId()),
                a.getPatient() == null ? null : String.valueOf(a.getPatient().getId()),
                a.getPatientName(), a.getTreatment(), a.getDoctor().getId(), a.getDate(),
                a.getStartTime().getHour(), a.getStartTime().getMinute(), a.getDurationMin(), a.getStatus(),
                phone, whatsappUrl);
    }

    public static PendingDto toDto(PendingReschedule p) {
        String msg = "Hola *" + p.getName() + "*, te saludamos de la Clínica Odontológica Gracia & Osorio. "
                + "Te escribimos para reagendar tu cita de *" + p.getTreatment() + "*. ¿Qué día y horario te convendría?";
        String whatsappUrl = Formats.whatsappUrl(p.getPhone(), msg);
        return new PendingDto(String.valueOf(p.getId()),
                p.getPatient() == null ? null : String.valueOf(p.getPatient().getId()),
                p.getName(), p.getTreatment(), p.getPhone(), p.getRequestedOn(), whatsappUrl);
    }

    public static PaymentDto toDto(Payment p) {
        return new PaymentDto(String.valueOf(p.getId()), p.getPaidOn(), p.getConcept(), p.getAmount(), p.getMethod(),
                p.getSignature());
    }

    public static PlanDto toDto(TreatmentPlan plan) {
        List<PaymentDto> payments = plan.getPayments().stream().map(Mappers::toDto).toList();
        return new PlanDto(String.valueOf(plan.getId()), String.valueOf(plan.getPatient().getId()), plan.getConcept(),
                plan.getTotalCost(), plan.totalPaid(), plan.pending(), payments);
    }

    public static ReminderDto toDto(Reminder r) {
        Appointment a = r.getAppointment();
        String phone = a.getPatient() != null ? a.getPatient().getPhone() : null;
        String time = Formats.time(a.getStartTime().getHour(), a.getStartTime().getMinute());
        String docName = a.getDoctor() != null ? a.getDoctor().getName() : "";
        String msg = "Hola *" + a.getPatientName() + "*, te saludamos de la Clínica Odontológica Gracia & Osorio. "
                + "Te recordamos tu cita para *" + a.getTreatment() + "* con " + docName + " el día *"
                + a.getDate() + "* a las *" + time + "*. ¿Nos confirmas tu asistencia? ¡Gracias!";
        String whatsappUrl = phone != null ? Formats.whatsappUrl(phone, msg) : null;
        return new ReminderDto(String.valueOf(r.getId()), String.valueOf(a.getId()), r.getStatus(),
                a.getPatientName(), phone, docName, a.getDate(), time, a.getTreatment(), whatsappUrl);
    }
}
