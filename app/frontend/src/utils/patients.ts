import type { Appointment } from "@/types";
import { toMinutes } from "./schedule";

/** Próxima cita activa (no cancelada) desde `today` inclusive. */
export function nextAppointment(appointments: Appointment[], patientId: string, today: string): Appointment | undefined {
  return appointments
    .filter((a) => a.patientId === patientId && a.status !== "cancelled" && a.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date) || toMinutes(a.startHour, a.startMin) - toMinutes(b.startHour, b.startMin))[0];
}
