package co.graciaosorio.clinica.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import co.graciaosorio.clinica.domain.Doctor;
import co.graciaosorio.clinica.domain.Patient;
import co.graciaosorio.clinica.dto.Dtos.PatientDto;
import co.graciaosorio.clinica.dto.Dtos.PatientRequest;
import co.graciaosorio.clinica.dto.Mappers;
import co.graciaosorio.clinica.exception.ApiException;
import co.graciaosorio.clinica.repository.DoctorRepository;
import co.graciaosorio.clinica.repository.PatientRepository;
import co.graciaosorio.clinica.repository.TreatmentPlanRepository;
import jakarta.persistence.criteria.Predicate;

@Service
@Transactional(readOnly = true)
public class PatientService {

    public enum BalanceFilter {
        PENDIENTE, AL_DIA;

        public static BalanceFilter parse(String raw) {
            if (raw == null || raw.isBlank() || raw.equalsIgnoreCase("all")) {
                return null;
            }
            return switch (raw.toLowerCase()) {
                case "pendiente" -> PENDIENTE;
                case "al-dia", "al_dia", "aldia" -> AL_DIA;
                default -> throw ApiException.badRequest("Filtro de saldo inválido: " + raw + " (usa pendiente o al-dia)");
            };
        }
    }

    private final PatientRepository patients;
    private final DoctorRepository doctors;
    private final TreatmentPlanRepository plans;

    public PatientService(PatientRepository patients, DoctorRepository doctors, TreatmentPlanRepository plans) {
        this.patients = patients;
        this.doctors = doctors;
        this.plans = plans;
    }

    public List<PatientDto> list(String q, BalanceFilter filter) {
        Specification<Patient> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (q != null && !q.isBlank()) {
                String like = "%" + q.trim().toLowerCase() + "%";
                predicates.add(cb.or(cb.like(cb.lower(root.get("fullName")), like),
                        cb.like(root.get("documentId"), "%" + q.trim() + "%")));
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };
        Map<Long, Long> balances = balances();
        return patients.findAll(spec, Sort.by("fullName")).stream()
                .filter(p -> filter == null
                        || (filter == BalanceFilter.PENDIENTE) == (balances.getOrDefault(p.getId(), 0L) > 0))
                .map(p -> Mappers.toDto(p, balances.getOrDefault(p.getId(), 0L)))
                .toList();
    }

    public PatientDto get(Long id) {
        return Mappers.toDto(find(id), balances().getOrDefault(id, 0L));
    }

    @Transactional
    public PatientDto create(PatientRequest req) {
        String cedula = Formats.cedula(req.cedula());
        if (patients.existsByDocumentId(cedula)) {
            throw ApiException.conflict("Ya existe un paciente con esta cédula.");
        }
        Patient saved = patients.save(new Patient(cedula, req.name().trim(), Formats.phone(req.phone()),
                doctor(req.doctorId()), req.lastVisit()));
        return Mappers.toDto(saved, 0);
    }

    @Transactional
    public PatientDto update(Long id, PatientRequest req) {
        Patient patient = find(id);
        String cedula = Formats.cedula(req.cedula());
        patients.findByDocumentId(cedula).filter(other -> !other.getId().equals(id)).ifPresent(other -> {
            throw ApiException.conflict("Ya existe un paciente con esta cédula.");
        });
        patient.update(cedula, req.name().trim(), Formats.phone(req.phone()), doctor(req.doctorId()), req.lastVisit());
        return Mappers.toDto(patient, balances().getOrDefault(id, 0L));
    }

    @Transactional
    public void delete(Long id) {
        Patient patient = find(id);
        if (plans.existsByPatientId(id)) {
            throw ApiException.conflict("No se puede eliminar un paciente con tratamientos o pagos registrados.");
        }
        patients.delete(patient);
    }

    private Map<Long, Long> balances() {
        Map<Long, Long> map = new HashMap<>();
        for (Object[] row : patients.findBalanceRows()) {
            map.put(((Number) row[0]).longValue(), ((Number) row[1]).longValue());
        }
        return map;
    }

    private Patient find(Long id) {
        return patients.findById(id).orElseThrow(() -> ApiException.notFound("Paciente", id));
    }

    private Doctor doctor(String id) {
        return doctors.findById(id).orElseThrow(() -> ApiException.unprocessable("El doctor '" + id + "' no existe."));
    }
}
