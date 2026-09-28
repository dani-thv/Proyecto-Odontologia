import type { Appointment, PendingPatient, Reminder } from "@/types";

// Semana de la demo: lunes 14 → sábado 19 de septiembre de 2026 (hoy = viernes 18).
type Seed = Omit<Appointment, "patientId"> & { patientId: string };

const seed: Seed[] = [
  // Lunes 14
  { id: "apt-01", patientId: "pat-01", patient: "Andrea Morales Gómez", treatment: "Limpieza", doctorId: "carlos", date: "2026-09-14", startHour: 8, startMin: 0, durationMin: 60, status: "confirmed" },
  { id: "apt-02", patientId: "pat-02", patient: "Luis Felipe Roa Vargas", treatment: "Control odontológico", doctorId: "carlos", date: "2026-09-14", startHour: 9, startMin: 30, durationMin: 60, status: "confirmed" },
  { id: "apt-03", patientId: "pat-03", patient: "Valentina Cruz Salcedo", treatment: "Extracción", doctorId: "carlos", date: "2026-09-14", startHour: 10, startMin: 30, durationMin: 90, status: "confirmed" },
  // Martes 15
  { id: "apt-04", patientId: "pat-05", patient: "Carolina Pinto Londoño", treatment: "Odontopediatría", doctorId: "liliana", date: "2026-09-15", startHour: 9, startMin: 0, durationMin: 45, status: "confirmed" },
  { id: "apt-05", patientId: "pat-04", patient: "Mateo Herrera Ríos", treatment: "Resina", doctorId: "carlos", date: "2026-09-15", startHour: 9, startMin: 45, durationMin: 105, status: "confirmed" },
  // Miércoles 16
  { id: "apt-06", patientId: "pat-06", patient: "Jorge Sánchez Duque", treatment: "Endodoncia", doctorId: "carlos", date: "2026-09-16", startHour: 8, startMin: 30, durationMin: 120, status: "confirmed" },
  { id: "apt-07", patientId: "pat-07", patient: "Isabela Romero Castillo", treatment: "Revisión general", doctorId: "carlos", date: "2026-09-16", startHour: 12, startMin: 0, durationMin: 60, status: "cancelled" },
  // Jueves 17
  { id: "apt-08", patientId: "pat-08", patient: "Daniel Vargas Peñaranda", treatment: "Resina", doctorId: "carlos", date: "2026-09-17", startHour: 10, startMin: 30, durationMin: 60, status: "pending" },
  // Viernes 18 (hoy)
  { id: "apt-09", patientId: "pat-01", patient: "Andrea Morales Gómez", treatment: "Limpieza", doctorId: "carlos", date: "2026-09-18", startHour: 8, startMin: 0, durationMin: 60, status: "confirmed" },
  { id: "apt-10", patientId: "pat-02", patient: "Luis Felipe Roa Vargas", treatment: "Control odontológico", doctorId: "carlos", date: "2026-09-18", startHour: 8, startMin: 30, durationMin: 60, status: "confirmed" },
  { id: "apt-11", patientId: "pat-03", patient: "Valentina Cruz Salcedo", treatment: "Extracción", doctorId: "carlos", date: "2026-09-18", startHour: 9, startMin: 30, durationMin: 90, status: "urgent" },
  { id: "apt-12", patientId: "pat-04", patient: "Mateo Herrera Ríos", treatment: "Resina estética", doctorId: "carlos", date: "2026-09-18", startHour: 10, startMin: 0, durationMin: 60, status: "confirmed" },
  { id: "apt-13", patientId: "pat-05", patient: "Carolina Pinto Londoño", treatment: "Odontopediatría", doctorId: "liliana", date: "2026-09-18", startHour: 11, startMin: 0, durationMin: 45, status: "pending" },
  { id: "apt-14", patientId: "pat-06", patient: "Jorge Sánchez Duque", treatment: "Endodoncia", doctorId: "carlos", date: "2026-09-18", startHour: 11, startMin: 30, durationMin: 90, status: "pending" },
  { id: "apt-15", patientId: "pat-07", patient: "Isabela Romero Castillo", treatment: "Revisión general", doctorId: "carlos", date: "2026-09-18", startHour: 12, startMin: 0, durationMin: 60, status: "confirmed" },
  { id: "apt-16", patientId: "pat-08", patient: "Daniel Vargas Peñaranda", treatment: "Resina", doctorId: "carlos", date: "2026-09-18", startHour: 13, startMin: 0, durationMin: 60, status: "confirmed" },
  // Sábado 19 (mañana: se confirman desde el dashboard)
  { id: "apt-17", patientId: "pat-09", patient: "Sofía Mendoza Arango", treatment: "Control odontopediátrico", doctorId: "liliana", date: "2026-09-19", startHour: 9, startMin: 0, durationMin: 60, status: "pending" },
  { id: "apt-18", patientId: "pat-10", patient: "Ricardo Ávila Mejía", treatment: "Blanqueamiento", doctorId: "carlos", date: "2026-09-19", startHour: 10, startMin: 30, durationMin: 90, status: "pending" },
  { id: "apt-19", patientId: "pat-11", patient: "Camila Torres Ibarra", treatment: "Fluorización infantil", doctorId: "liliana", date: "2026-09-19", startHour: 11, startMin: 0, durationMin: 60, status: "pending" },
  { id: "apt-20", patientId: "pat-12", patient: "Andrés Ospina Rueda", treatment: "Control odontológico", doctorId: "carlos", date: "2026-09-19", startHour: 13, startMin: 0, durationMin: 60, status: "pending" },
];

export const SEED_APPOINTMENTS: Appointment[] = seed;

export const SEED_PENDING: PendingPatient[] = [
  { id: "pnd-1", patientId: "pat-13", name: "María Fernanda López", treatment: "Endodoncia", phone: "302 771 4410", requestedOn: "2026-09-16" },
  { id: "pnd-2", patientId: "pat-14", name: "Roberto Castaño Pérez", treatment: "Control odontológico", phone: "305 218 6623", requestedOn: "2026-09-17" },
  { id: "pnd-3", patientId: "pat-15", name: "Juliana Restrepo Ocampo", treatment: "Fluorización infantil", phone: "304 553 8012", requestedOn: "2026-09-15" },
  { id: "pnd-4", patientId: "pat-16", name: "Esteban Gutiérrez Mora", treatment: "Limpieza", phone: "306 914 2750", requestedOn: "2026-09-18" },
];

/** Recordatorios de las citas de mañana (sábado 19) que aún hay que confirmar por llamada. */
export const SEED_REMINDERS: Reminder[] = ["apt-17", "apt-18", "apt-19", "apt-20"].map((appointmentId) => ({
  id: `rem-${appointmentId}`,
  appointmentId,
  status: "pending",
}));
