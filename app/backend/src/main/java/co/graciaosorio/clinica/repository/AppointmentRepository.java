package co.graciaosorio.clinica.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import co.graciaosorio.clinica.domain.Appointment;
import co.graciaosorio.clinica.domain.AppointmentStatus;

public interface AppointmentRepository extends JpaRepository<Appointment, Long>, JpaSpecificationExecutor<Appointment> {

    List<Appointment> findByDoctorIdAndDate(String doctorId, LocalDate date);

    List<Appointment> findByDateOrderByStartTime(LocalDate date);

    long countByStatusAndDateGreaterThanEqual(AppointmentStatus status, LocalDate date);
}
