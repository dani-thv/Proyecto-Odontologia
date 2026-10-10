package co.graciaosorio.clinica.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import org.junit.jupiter.api.Test;

import co.graciaosorio.clinica.domain.Appointment;
import co.graciaosorio.clinica.domain.AppointmentStatus;
import co.graciaosorio.clinica.exception.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;

class ClinicScheduleTest {

    private static final LocalDate FRIDAY = LocalDate.of(2026, 9, 18);
    private static final LocalDate SATURDAY = LocalDate.of(2026, 9, 19);
    private static final LocalDate SUNDAY = LocalDate.of(2026, 9, 20);

    private static Appointment appt(long id, String patient, int hour, int min, int duration,
                                    AppointmentStatus status) {
        Appointment a = new Appointment();
        a.set(null, patient, "Limpieza", null, FRIDAY, LocalTime.of(hour, min), duration, status);
        ReflectionTestUtils.setField(a, "id", id);
        return a;
    }

    @Test
    void closingHourDependsOnDayOfWeek() {
        assertThat(ClinicSchedule.closingHour(FRIDAY)).isEqualTo(18);
        assertThat(ClinicSchedule.closingHour(SATURDAY)).isEqualTo(14);
        assertThat(ClinicSchedule.closingHour(SUNDAY)).isNull();
    }

    @Test
    void rejectsAppointmentsOutsideOpeningHours() {
        assertThatThrownBy(() -> ClinicSchedule.requireWithinHours(SUNDAY, 9 * 60, 60))
                .isInstanceOf(ApiException.class).hasMessage("La clínica no atiende los domingos.")
                .extracting(e -> ((ApiException) e).getStatus()).isEqualTo(HttpStatus.UNPROCESSABLE_ENTITY);
        assertThatThrownBy(() -> ClinicSchedule.requireWithinHours(FRIDAY, 7 * 60 + 30, 60))
                .hasMessage("La clínica abre a las 08:00.");
        assertThatThrownBy(() -> ClinicSchedule.requireWithinHours(FRIDAY, 17 * 60 + 30, 60))
                .hasMessage("La cita termina después del cierre (18:00).");
        assertThatThrownBy(() -> ClinicSchedule.requireWithinHours(SATURDAY, 13 * 60 + 30, 60))
                .hasMessage("La cita termina después del cierre (14:00).");
    }

    @Test
    void acceptsAppointmentsThatEndExactlyAtClosing() {
        assertThatCode(() -> ClinicSchedule.requireWithinHours(FRIDAY, 17 * 60, 60)).doesNotThrowAnyException();
        assertThatCode(() -> ClinicSchedule.requireWithinHours(SATURDAY, 13 * 60, 60)).doesNotThrowAnyException();
    }

    @Test
    void detectsOverlapWithTheSameDoctor() {
        List<Appointment> day = List.of(appt(1, "Ana", 9, 0, 60, AppointmentStatus.CONFIRMED));
        assertThatThrownBy(() -> ClinicSchedule.requireNoConflict(day, 9 * 60 + 30, 60, null))
                .isInstanceOf(ApiException.class)
                .hasMessage("Se cruza con la cita de Ana (09:00 – 10:00).")
                .extracting(e -> ((ApiException) e).getStatus()).isEqualTo(HttpStatus.CONFLICT);
    }

    @Test
    void allowsBackToBackAppointments() {
        List<Appointment> day = List.of(appt(1, "Ana", 9, 0, 60, AppointmentStatus.CONFIRMED));
        assertThatCode(() -> ClinicSchedule.requireNoConflict(day, 10 * 60, 60, null)).doesNotThrowAnyException();
        assertThatCode(() -> ClinicSchedule.requireNoConflict(day, 8 * 60, 60, null)).doesNotThrowAnyException();
    }

    @Test
    void cancelledAppointmentsFreeTheSlot() {
        List<Appointment> day = List.of(appt(1, "Ana", 9, 0, 60, AppointmentStatus.CANCELLED));
        assertThat(ClinicSchedule.findConflict(day, 9 * 60, 60, null)).isEmpty();
    }

    @Test
    void ignoresTheAppointmentBeingEdited() {
        List<Appointment> day = List.of(appt(1, "Ana", 9, 0, 60, AppointmentStatus.CONFIRMED));
        assertThat(ClinicSchedule.findConflict(day, 9 * 60, 60, 1L)).isEmpty();
        assertThat(ClinicSchedule.findConflict(day, 9 * 60, 60, 2L)).isPresent();
    }
}
