package co.graciaosorio.clinica.service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import co.graciaosorio.clinica.domain.Appointment;
import co.graciaosorio.clinica.domain.AppointmentStatus;
import co.graciaosorio.clinica.domain.Doctor;
import co.graciaosorio.clinica.domain.Patient;
import co.graciaosorio.clinica.dto.Dtos.AppointmentDto;
import co.graciaosorio.clinica.dto.Dtos.AppointmentRequest;
import co.graciaosorio.clinica.dto.Dtos.PendingDto;
import co.graciaosorio.clinica.dto.Mappers;
import co.graciaosorio.clinica.exception.ApiException;
import co.graciaosorio.clinica.repository.AppointmentRepository;
import co.graciaosorio.clinica.repository.DoctorRepository;
import co.graciaosorio.clinica.repository.PatientRepository;
import co.graciaosorio.clinica.repository.PendingRescheduleRepository;
import jakarta.persistence.criteria.Predicate;

@Service
@Transactional(readOnly = true)
public class AppointmentService {

    private final AppointmentRepository appointments;
    private final DoctorRepository doctors;
    private final PatientRepository patients;
    private final PendingRescheduleRepository pending;

    public AppointmentService(AppointmentRepository appointments, DoctorRepository doctors,
                              PatientRepository patients, PendingRescheduleRepository pending) {
        this.appointments = appointments;
        this.doctors = doctors;
        this.patients = patients;
        this.pending = pending;
    }

    public List<AppointmentDto> list(LocalDate from, LocalDate to, String doctorId) {
        Specification<Appointment> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (from != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("date"), from));
            }
            if (to != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("date"), to));
            }
            if (doctorId != null && !doctorId.isBlank()) {
                predicates.add(cb.equal(root.get("doctor").get("id"), doctorId));
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };
        return appointments.findAll(spec, Sort.by("date", "startTime")).stream().map(Mappers::toDto).toList();
    }

    public AppointmentDto get(Long id) {
        return Mappers.toDto(find(id));
    }

    public List<PendingDto> pendingReschedule() {
        return pending.findAllByOrderByRequestedOnAscIdAsc().stream().map(Mappers::toDto).toList();
    }

    /**
     * @param fromPendingId paciente de "pendientes de reagendar" que se está agendando; sale de esa lista
     *                      (igual que cualquier otra solicitud pendiente del mismo paciente).
     */
    @Transactional
    public AppointmentDto create(AppointmentRequest req, Long fromPendingId) {
        Appointment appointment = new Appointment();
        apply(appointment, req, null);
        Appointment saved = appointments.save(appointment);

        if (fromPendingId != null) {
            pending.deleteById(fromPendingId);
        }
        if (saved.getPatient() != null) {
            pending.deleteByPatientId(saved.getPatient().getId());
        }
        return Mappers.toDto(saved);
    }

    @Transactional
    public AppointmentDto update(Long id, AppointmentRequest req) {
        Appointment appointment = find(id);
        apply(appointment, req, id);
        return Mappers.toDto(appointment);
    }

    @Transactional
    public AppointmentDto updateStatus(Long id, AppointmentStatus status) {
        Appointment appointment = find(id);
        if (status != AppointmentStatus.CANCELLED) {
            // Reactivar una cita cancelada puede chocar con otra que ocupó su horario.
            ClinicSchedule.requireNoConflict(
                    appointments.findByDoctorIdAndDate(appointment.getDoctor().getId(), appointment.getDate()),
                    appointment.startMinutes(), appointment.getDurationMin(), id);
        }
        appointment.setStatus(status);
        return Mappers.toDto(appointment);
    }

    @Transactional
    public void delete(Long id) {
        appointments.delete(find(id));
    }

    private void apply(Appointment target, AppointmentRequest req, Long ignoreId) {
        Doctor doctor = doctors.findById(req.doctorId())
                .orElseThrow(() -> ApiException.unprocessable("El doctor '" + req.doctorId() + "' no existe."));
        Patient patient = req.patientId() == null || req.patientId().isBlank()
                ? null
                : patients.findById(Formats.id(req.patientId(), "paciente"))
                        .orElseThrow(() -> ApiException.notFound("Paciente", req.patientId()));
        if (req.patient().isBlank()) {
            throw ApiException.badRequest("Escribe el nombre del paciente.");
        }

        int start = req.startHour() * 60 + req.startMin();
        ClinicSchedule.requireWithinHours(req.date(), start, req.durationMin());
        if (req.status() != AppointmentStatus.CANCELLED) {
            ClinicSchedule.requireNoConflict(appointments.findByDoctorIdAndDate(doctor.getId(), req.date()), start,
                    req.durationMin(), ignoreId);
        }

        target.set(patient, req.patient().trim(), req.treatment() == null ? "" : req.treatment().trim(), doctor,
                req.date(), LocalTime.of(req.startHour(), req.startMin()), req.durationMin(), req.status());
    }

    private Appointment find(Long id) {
        return appointments.findById(id).orElseThrow(() -> ApiException.notFound("Cita", id));
    }
}
