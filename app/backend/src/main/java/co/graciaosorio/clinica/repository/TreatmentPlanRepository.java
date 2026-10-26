package co.graciaosorio.clinica.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import co.graciaosorio.clinica.domain.TreatmentPlan;

public interface TreatmentPlanRepository extends JpaRepository<TreatmentPlan, Long> {

    List<TreatmentPlan> findAllByOrderByIdAsc();

    List<TreatmentPlan> findByPatientIdOrderByIdAsc(Long patientId);

    boolean existsByPatientId(Long patientId);
}
