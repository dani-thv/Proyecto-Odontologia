import type { Appointment, AppointmentInput } from "@/types";
import { weekdayIndex } from "./dates";
import { formatTime } from "./format";

/** Horario de la clínica: L–V 8:00–18:00, sábado 8:00–14:00, domingo cerrado. */
export const OPEN_HOUR = 8;
export const WEEKDAY_CLOSE_HOUR = 18;
export const SATURDAY_CLOSE_HOUR = 14;

export const toMinutes = (hour: number, min: number) => hour * 60 + min;

export const closingHour = (iso: string) => {
  const wd = weekdayIndex(iso);
  if (wd === 6) return null;
  return wd === 5 ? SATURDAY_CLOSE_HOUR : WEEKDAY_CLOSE_HOUR;
};

export const endMinutes = (a: Pick<AppointmentInput, "startHour" | "startMin" | "durationMin">) =>
  toMinutes(a.startHour, a.startMin) + a.durationMin;

export const formatTimeRange = (a: Pick<AppointmentInput, "startHour" | "startMin" | "durationMin">) => {
  const end = endMinutes(a);
  return `${formatTime(a.startHour, a.startMin)} – ${formatTime(Math.floor(end / 60), end % 60)}`;
};

const overlaps = (a: AppointmentInput, b: AppointmentInput) =>
  toMinutes(a.startHour, a.startMin) < endMinutes(b) && toMinutes(b.startHour, b.startMin) < endMinutes(a);

/** Cita activa del mismo doctor y día que se cruza con `candidate`. Las canceladas liberan el horario. */
export const findConflict = (
  existing: Appointment[],
  candidate: AppointmentInput,
  ignoreId?: string,
): Appointment | undefined =>
  existing.find(
    (a) =>
      a.id !== ignoreId &&
      a.status !== "cancelled" &&
      a.doctorId === candidate.doctorId &&
      a.date === candidate.date &&
      overlaps(a, candidate),
  );

/** Devuelve un mensaje de error en español o null si la cita es válida. */
export function validateAppointment(
  candidate: AppointmentInput,
  existing: Appointment[],
  ignoreId?: string,
): string | null {
  if (!candidate.patient.trim()) return "Escribe el nombre del paciente.";

  const close = closingHour(candidate.date);
  if (close === null) return "La clínica no atiende los domingos.";

  const start = toMinutes(candidate.startHour, candidate.startMin);
  if (start < OPEN_HOUR * 60) return "La clínica abre a las 08:00.";
  if (endMinutes(candidate) > close * 60) {
    return `La cita termina después del cierre (${formatTime(close, 0)}).`;
  }

  if (candidate.status !== "cancelled") {
    const conflict = findConflict(existing, candidate, ignoreId);
    if (conflict) {
      return `Se cruza con la cita de ${conflict.patient} (${formatTimeRange(conflict)}).`;
    }
  }
  return null;
}
