package co.graciaosorio.clinica.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import co.graciaosorio.clinica.domain.PendingReschedule;

public interface PendingRescheduleRepository extends JpaRepository<PendingReschedule, Long> {

    List<PendingReschedule> findAllByOrderByRequestedOnAscIdAsc();

    void deleteByPatientId(Long patientId);
}
