package co.graciaosorio.clinica.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import co.graciaosorio.clinica.domain.Payment;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    @Query("""
            select p from Payment p
              join fetch p.plan pl
              join fetch pl.patient pt
              join fetch pt.doctor
            where p.paidOn = :date
            """)
    List<Payment> findByPaidOnWithDoctor(@Param("date") LocalDate date);

    @Query("""
            select p from Payment p
              join fetch p.plan pl
              join fetch pl.patient pt
              join fetch pt.doctor
            where p.id = :id
            """)
    Optional<Payment> findByIdWithDetails(@Param("id") Long id);
}
