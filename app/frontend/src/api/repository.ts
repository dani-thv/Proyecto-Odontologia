import type {
  Appointment, AppointmentInput, Patient, PendingPatient, Payment, Reminder, TreatmentPlan,
} from "@/types";

export interface ClinicData {
  patients: Patient[];
  appointments: Appointment[];
  pending: PendingPatient[];
  plans: TreatmentPlan[];
  reminders: Reminder[];
}

/**
 * Origen de datos de la app. `apiRepository` habla con el backend; `localRepository` guarda todo en
 * memoria (pruebas automáticas y "modo demostración" cuando no hay servidor).
 */
export interface ClinicRepository {
  load(): Promise<ClinicData>;
  loadAppointments(): Promise<Appointment[]>;
  loadPending(): Promise<PendingPatient[]>;
  loadReminders(): Promise<Reminder[]>;

  addAppointment(input: AppointmentInput, fromPendingId?: string): Promise<Appointment>;
  updateAppointment(id: string, input: AppointmentInput): Promise<Appointment>;
  removeAppointment(id: string): Promise<void>;
  confirmReminder(id: string): Promise<void>;
  dismissReminder(id: string): Promise<void>;

  addPatient(input: Omit<Patient, "id">): Promise<Patient>;
  addPlan(input: Omit<TreatmentPlan, "id" | "payments">): Promise<TreatmentPlan>;
  /** Devuelve el tratamiento actualizado (con el abono nuevo). */
  addPayment(planId: string, input: Omit<Payment, "id">): Promise<TreatmentPlan>;
}
