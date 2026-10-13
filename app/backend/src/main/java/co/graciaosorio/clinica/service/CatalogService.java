package co.graciaosorio.clinica.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import co.graciaosorio.clinica.domain.Doctor;
import co.graciaosorio.clinica.domain.Treatment;
import co.graciaosorio.clinica.dto.Dtos.DoctorDto;
import co.graciaosorio.clinica.dto.Dtos.DoctorRequest;
import co.graciaosorio.clinica.dto.Dtos.DoctorStatusRequest;
import co.graciaosorio.clinica.dto.Dtos.DoctorUpdateRequest;
import co.graciaosorio.clinica.dto.Dtos.TreatmentDto;
import co.graciaosorio.clinica.dto.Dtos.TreatmentRequest;
import co.graciaosorio.clinica.dto.Mappers;
import co.graciaosorio.clinica.exception.ApiException;
import co.graciaosorio.clinica.repository.DoctorRepository;
import co.graciaosorio.clinica.repository.TreatmentRepository;

@Service
@Transactional(readOnly = true)
public class CatalogService {

    private final DoctorRepository doctors;
    private final TreatmentRepository treatments;

    public CatalogService(DoctorRepository doctors, TreatmentRepository treatments) {
        this.doctors = doctors;
        this.treatments = treatments;
    }

    public List<DoctorDto> doctors() {
        return doctors(false);
    }

    public List<DoctorDto> doctors(boolean all) {
        var list = all ? doctors.findAllByOrderBySortOrderAsc() : doctors.findByActiveTrueOrderBySortOrder();
        return list.stream().map(Mappers::toDto).toList();
    }

    public DoctorDto getDoctor(String id) {
        return doctors.findById(id).map(Mappers::toDto)
                .orElseThrow(() -> ApiException.notFound("Doctor", id));
    }

    @Transactional
    public DoctorDto createDoctor(DoctorRequest req) {
        String id = req.id().trim();
        if (doctors.existsById(id)) {
            throw ApiException.conflict("Ya existe un doctor con el id '" + id + "'.");
        }
        boolean active = req.active() == null || req.active();
        Doctor saved = doctors.save(new Doctor(id, req.name().trim(), req.label().trim(), req.specialty().trim(),
                req.sortOrder(), active));
        return Mappers.toDto(saved);
    }

    @Transactional
    public DoctorDto updateDoctor(String id, DoctorUpdateRequest req) {
        Doctor doctor = doctors.findById(id)
                .orElseThrow(() -> ApiException.notFound("Doctor", id));
        doctor.update(req.name().trim(), req.label().trim(), req.specialty().trim(), req.sortOrder());
        return Mappers.toDto(doctor);
    }

    @Transactional
    public DoctorDto updateDoctorStatus(String id, boolean active) {
        Doctor doctor = doctors.findById(id)
                .orElseThrow(() -> ApiException.notFound("Doctor", id));
        doctor.setActive(active);
        return Mappers.toDto(doctor);
    }

    public List<TreatmentDto> treatments() {
        return treatments.findAllByOrderByNameAsc().stream().map(Mappers::toDto).toList();
    }

    public TreatmentDto getTreatment(Long id) {
        return treatments.findById(id).map(Mappers::toDto)
                .orElseThrow(() -> ApiException.notFound("Tratamiento", id));
    }

    @Transactional
    public TreatmentDto createTreatment(TreatmentRequest req) {
        String name = req.name().trim();
        if (treatments.existsByNameIgnoreCase(name)) {
            throw ApiException.conflict("Ya existe un tratamiento con el nombre '" + name + "'.");
        }
        Treatment saved = treatments.save(new Treatment(name, req.basePrice(), req.defaultDurationMin()));
        return Mappers.toDto(saved);
    }

    @Transactional
    public TreatmentDto updateTreatment(Long id, TreatmentRequest req) {
        Treatment treatment = treatments.findById(id)
                .orElseThrow(() -> ApiException.notFound("Tratamiento", id));
        String name = req.name().trim();
        treatments.findByNameIgnoreCase(name).filter(other -> !other.getId().equals(id)).ifPresent(other -> {
            throw ApiException.conflict("Ya existe un tratamiento con el nombre '" + name + "'.");
        });
        treatment.update(name, req.basePrice(), req.defaultDurationMin());
        return Mappers.toDto(treatment);
    }

    @Transactional
    public void deleteTreatment(Long id) {
        Treatment treatment = treatments.findById(id)
                .orElseThrow(() -> ApiException.notFound("Tratamiento", id));
        treatments.delete(treatment);
    }
}
