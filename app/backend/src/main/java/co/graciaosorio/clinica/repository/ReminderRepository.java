package co.graciaosorio.clinica.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import co.graciaosorio.clinica.domain.Reminder;

public interface ReminderRepository extends JpaRepository<Reminder, Long> {

    @Query("""
            select r from Reminder r
              join fetch r.appointment a
              left join fetch a.patient pt
              left join fetch a.doctor d
            order by a.date asc, a.startTime asc
            """)
    List<Reminder> findAllWithDetails();

    List<Reminder> findAllByOrderByAppointmentDateAscAppointmentStartTimeAsc();
}
