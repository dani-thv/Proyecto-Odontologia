import type {
  Appointment, AppointmentInput, Patient, PendingPatient, Payment, Reminder, TreatmentPlan,
} from "@/types";
import { request } from "./http";
import type { ClinicData, ClinicRepository } from "./repository";

// El backend devuelve algunos campos extra (saldo, totales); se descartan para no depender de ellos.
type PatientDto = Patient & { balance?: number };
type PlanDto = TreatmentPlan & { totalPaid?: number; pending?: number };

const TIME_STORAGE_KEY = "clinica_payment_times";

const loadPaymentTimes = (): Record<string, string> => {
  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(TIME_STORAGE_KEY) : null;
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
};

const savePaymentTime = (paymentId: string, time: string) => {
  try {
    if (typeof localStorage === "undefined") return;
    const map = loadPaymentTimes();
    map[paymentId] = time;
    localStorage.setItem(TIME_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore storage errors
  }
};

const toPatient = ({ id, name, cedula, doctorId, phone, lastVisit }: PatientDto): Patient => ({
  id, name, cedula, doctorId, phone, lastVisit,
});
const toPlan = ({ id, patientId, concept, totalCost, payments }: PlanDto): TreatmentPlan => {
  const times = loadPaymentTimes();
  return {
    id,
    patientId,
    concept,
    totalCost,
    payments: payments.map((p) => {
      const time = p.time ?? times[p.id];
      return time ? { ...p, time } : p;
    }),
  };
};

export function createApiRepository(): ClinicRepository {
  const loadAppointments = () => request<Appointment[]>("/api/appointments");
  const loadPending = () => request<PendingPatient[]>("/api/appointments/pending-reschedule");
  const loadReminders = () => request<Reminder[]>("/api/reminders");

  return {
    loadAppointments,
    loadPending,
    loadReminders,

    async load(): Promise<ClinicData> {
      const [patients, appointments, pending, plans, reminders] = await Promise.all([
        request<PatientDto[]>("/api/patients"),
        loadAppointments(),
        loadPending(),
        request<PlanDto[]>("/api/treatment-plans"),
        loadReminders(),
      ]);
      return { patients: patients.map(toPatient), appointments, pending, plans: plans.map(toPlan), reminders };
    },

    addAppointment: (input: AppointmentInput, fromPendingId?: string) =>
      request<Appointment>(
        fromPendingId ? `/api/appointments?fromPendingId=${encodeURIComponent(fromPendingId)}` : "/api/appointments",
        { method: "POST", body: input },
      ),
    updateAppointment: (id, input) => request<Appointment>(`/api/appointments/${id}`, { method: "PUT", body: input }),
    removeAppointment: (id) => request<void>(`/api/appointments/${id}`, { method: "DELETE" }),
    confirmReminder: async (id) => {
      await request<Reminder>(`/api/reminders/${id}/confirm`, { method: "POST" });
    },
    dismissReminder: (id) => request<void>(`/api/reminders/${id}`, { method: "DELETE" }),

    addPatient: async (input) => toPatient(await request<PatientDto>("/api/patients", { method: "POST", body: input })),
    addPlan: async (input) => toPlan(await request<PlanDto>("/api/treatment-plans", { method: "POST", body: input })),
    addPayment: async (planId, input: Omit<Payment, "id">) => {
      const { time, ...body } = input;
      const dto = await request<PlanDto>(`/api/treatment-plans/${planId}/payments`, { method: "POST", body });
      if (time && dto.payments.length > 0) {
        const newest = dto.payments[dto.payments.length - 1]!;
        savePaymentTime(newest.id, time);
      }
      return toPlan(dto);
    },
  };
}

/** Comprobación rápida de que el backend responde (timeout corto para no dejar la pantalla esperando). */
export const pingApi = () => request<{ status: string }>("/api/health", { timeoutMs: 4_000 });
