package co.graciaosorio.clinica.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import co.graciaosorio.clinica.domain.Doctor;

public interface DoctorRepository extends JpaRepository<Doctor, String> {
    List<Doctor> findByActiveTrueOrderBySortOrder();
    List<Doctor> findAllByOrderBySortOrderAsc();
}
