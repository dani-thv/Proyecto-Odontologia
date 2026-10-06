package co.graciaosorio.clinica.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import co.graciaosorio.clinica.domain.Treatment;

public interface TreatmentRepository extends JpaRepository<Treatment, Long> {
    List<Treatment> findAllByOrderByNameAsc();
    boolean existsByNameIgnoreCase(String name);
    Optional<Treatment> findByNameIgnoreCase(String name);
}
