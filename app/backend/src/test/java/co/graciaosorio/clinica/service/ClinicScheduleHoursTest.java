package co.graciaosorio.clinica.service;

import static org.junit.jupiter.api.Assertions.*;

import java.time.LocalDate;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import co.graciaosorio.clinica.exception.ApiException;

class ClinicScheduleHoursTest {

    @Test
    @DisplayName("Rechaza citas los domingos con ApiException 422")
    void rejectsSundayAppointments() {
        LocalDate sunday = LocalDate.of(2026, 9, 20);
        ApiException ex = assertThrows(ApiException.class, () ->
                ClinicSchedule.requireWithinHours(sunday, 10 * 60, 60));
        assertEquals(422, ex.getStatusCode());
        assertEquals("La clínica no atiende los domingos.", ex.getMessage());
    }

    @Test
    @DisplayName("Rechaza citas antes de la hora de apertura a las 8:00")
    void rejectsAppointmentsBeforeOpeningHour() {
        LocalDate monday = LocalDate.of(2026, 9, 14);
        ApiException ex = assertThrows(ApiException.class, () ->
                ClinicSchedule.requireWithinHours(monday, 7 * 60 + 30, 60));
        assertEquals(422, ex.getStatusCode());
        assertEquals("La clínica abre a las 08:00.", ex.getMessage());
    }

    @Test
    @DisplayName("Rechaza citas que terminan despues del cierre entre semana (18:00)")
    void rejectsAppointmentsEndingAfterClosingHourWeekday() {
        LocalDate tuesday = LocalDate.of(2026, 9, 15);
        ApiException ex = assertThrows(ApiException.class, () ->
                ClinicSchedule.requireWithinHours(tuesday, 17 * 60 + 30, 60));
        assertEquals(422, ex.getStatusCode());
        assertEquals("La cita termina después del cierre (18:00).", ex.getMessage());
    }
}
