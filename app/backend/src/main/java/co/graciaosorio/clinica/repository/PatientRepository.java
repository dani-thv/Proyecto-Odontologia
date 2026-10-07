package co.graciaosorio.clinica.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import co.graciaosorio.clinica.domain.Patient;

public interface PatientRepository extends JpaRepository<Patient, Long>, JpaSpecificationExecutor<Patient> {

    boolean existsByDocumentId(String documentId);

    Optional<Patient> findByDocumentId(String documentId);

    /** Saldos desde la vista patient_balance: cada fila es [patient_id, balance]. */
    @Query(value = "select patient_id, balance from patient_balance", nativeQuery = true)
    List<Object[]> findBalanceRows();
}
