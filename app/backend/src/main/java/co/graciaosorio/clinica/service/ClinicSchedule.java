package co.graciaosorio.clinica.service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.Collection;
import java.util.Optional;

import co.graciaosorio.clinica.domain.Appointment;
import co.graciaosorio.clinica.domain.AppointmentStatus;
import co.graciaosorio.clinica.exception.ApiException;

/**
 * Reglas de horario de la clínica (mismas del frontend, `src/utils/schedule.ts`):
 * lunes a viernes 8:00–18:00, sábado 8:00–14:00, domingo cerrado.
 */
public final class ClinicSchedule {

    public static final int OPEN_HOUR = 8;
    public static final int WEEKDAY_CLOSE_HOUR = 18;
    public static final int SATURDAY_CLOSE_HOUR = 14;

    private ClinicSchedule() {
    }

    /** Hora de cierre del día, o null si la clínica no abre. */
    public static Integer closingHour(LocalDate date) {
        DayOfWeek day = date.getDayOfWeek();
        if (day == DayOfWeek.SUNDAY) {
            return null;
        }
        return day == DayOfWeek.SATURDAY ? SATURDAY_CLOSE_HOUR : WEEKDAY_CLOSE_HOUR;
    }

    /** 422 si la cita queda fuera del horario de atención. */
    public static void requireWithinHours(LocalDate date, int startMinutes, int durationMin) {
        Integer close = closingHour(date);
        if (close == null) {
            throw ApiException.unprocessable("La clínica no atiende los domingos.");
        }
        if (startMinutes < OPEN_HOUR * 60) {
            throw ApiException.unprocessable("La clínica abre a las %s.".formatted(Formats.time(OPEN_HOUR, 0)));
        }
        if (startMinutes + durationMin > close * 60) {
            throw ApiException.unprocessable(
                    "La cita termina después del cierre (%s).".formatted(Formats.time(close, 0)));
        }
    }

    /**
     * 409 si se cruza con otra cita activa del mismo doctor y día. Las canceladas liberan el horario.
     *
     * @param sameDoctorDay citas del mismo doctor y fecha
     * @param ignoreId      id de la propia cita al editarla (puede ser null)
     */
    public static void requireNoConflict(Collection<Appointment> sameDoctorDay, int startMinutes, int durationMin,
                                         Long ignoreId) {
        findConflict(sameDoctorDay, startMinutes, durationMin, ignoreId).ifPresent(other -> {
            throw ApiException.conflict("Se cruza con la cita de %s (%s – %s)."
                    .formatted(other.getPatientName(), Formats.time(other.startMinutes() / 60, other.startMinutes() % 60),
                            Formats.time(other.endMinutes() / 60, other.endMinutes() % 60)));
        });
    }

    public static Optional<Appointment> findConflict(Collection<Appointment> sameDoctorDay, int startMinutes,
                                                     int durationMin, Long ignoreId) {
        int end = startMinutes + durationMin;
        return sameDoctorDay.stream()
                .filter(a -> !a.getId().equals(ignoreId))
                .filter(a -> a.getStatus() != AppointmentStatus.CANCELLED)
                .filter(a -> startMinutes < a.endMinutes() && a.startMinutes() < end)
                .findFirst();
    }
}
