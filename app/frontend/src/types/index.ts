export type AppointmentStatus = "confirmed" | "pending" | "urgent" | "cancelled";

export type DoctorId = "carlos" | "liliana";

export interface Doctor {
  id: DoctorId;
  name: string;
  /** Texto largo para pestañas y selects. */
  label: string;
  specialty: string;
}

export interface Patient {
  id: string;
  name: string;
  /** Cédula con puntos, tal como se muestra en pantalla. */
  cedula: string;
  doctorId: DoctorId;
  phone: string;
  /** Fecha ISO (YYYY-MM-DD) o null si nunca ha venido. */
  lastVisit: string | null;
}

export interface Appointment {
  id: string;
  /** null cuando se agenda a alguien que aún no es paciente registrado. */
  patientId: string | null;
  patient: string;
  treatment: string;
  doctorId: DoctorId;
  /** Fecha ISO (YYYY-MM-DD). */
  date: string;
  startHour: number;
  startMin: number;
  durationMin: number;
  status: AppointmentStatus;
}

export type AppointmentInput = Omit<Appointment, "id">;

export interface PendingPatient {
  id: string;
  patientId: string | null;
  name: string;
  treatment: string;
  phone: string;
  /** Fecha ISO en que quedó pendiente; la pantalla la muestra como "Hoy", "Ayer", "Hace N días". */
  requestedOn: string;
}

export type PaymentMethod = "Efectivo" | "Transferencia" | "Datáfono";

export interface Payment {
  id: string;
  /** Fecha ISO (YYYY-MM-DD). */
  date: string;
  /** Hora de registro (HH:mm). */
  time?: string;
  concept: string;
  amount: number;
  method: PaymentMethod;
  signature: string;
}

export interface TreatmentPlan {
  id: string;
  patientId: string;
  concept: string;
  totalCost: number;
  payments: Payment[];
}

export interface Reminder {
  id: string;
  appointmentId: string;
  status: "pending" | "confirmed";
}

export type UserRole = "admin" | "secretaria";

export interface UserAccount {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  roleLabel: string;
  initials: string;
}
