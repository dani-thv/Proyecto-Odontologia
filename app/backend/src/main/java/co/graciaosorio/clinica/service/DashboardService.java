package co.graciaosorio.clinica.service;

import java.time.Clock;
import java.time.LocalDate;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import co.graciaosorio.clinica.domain.Appointment;
import co.graciaosorio.clinica.domain.AppointmentStatus;
import co.graciaosorio.clinica.domain.Doctor;
import co.graciaosorio.clinica.dto.Dtos.DashboardSummaryDto;
import co.graciaosorio.clinica.dto.Dtos.DoctorCount;
import co.graciaosorio.clinica.repository.AppointmentRepository;
import co.graciaosorio.clinica.repository.DoctorRepository;
import co.graciaosorio.clinica.repository.PatientRepository;

@Service
@Transactional(readOnly = true)
public class DashboardService {

    private final AppointmentRepository appointments;
    private final DoctorRepository doctors;
    private final PatientRepository patients;
    private final Clock clock;

    public DashboardService(AppointmentRepository appointments, DoctorRepository doctors, PatientRepository patients,
                            Clock clock) {
        this.appointments = appointments;
        this.doctors = doctors;
        this.patients = patients;
        this.clock = clock;
    }

    /** @param today día de referencia; si es null se usa la fecha actual del servidor. */
    public DashboardSummaryDto summary(LocalDate today) {
        LocalDate day = today != null ? today : LocalDate.now(clock);

        List<Appointment> todayActive = active(day);
        List<Appointment> tomorrowActive = active(day.plusDays(1));

        List<DoctorCount> byDoctor = doctors.findByActiveTrueOrderBySortOrder().stream()
                .map(d -> new DoctorCount(d.getId(), (int) todayActive.stream()
                        .filter(a -> a.getDoctor().getId().equals(d.getId())).count()))
                .filter(c -> c.count() > 0)
                .toList();

        return new DashboardSummaryDto(day, todayActive.size(),
                (int) todayActive.stream().filter(a -> a.getStatus() == AppointmentStatus.URGENT).count(), byDoctor,
                tomorrowActive.size(),
                (int) tomorrowActive.stream().filter(a -> a.getStatus() == AppointmentStatus.CONFIRMED).count(),
                appointments.countByStatusAndDateGreaterThanEqual(AppointmentStatus.PENDING, day),
                patients.count());
    }

    private List<Appointment> active(LocalDate date) {
        return appointments.findByDateOrderByStartTime(date).stream()
                .filter(a -> a.getStatus() != AppointmentStatus.CANCELLED)
                .toList();
    }
}
