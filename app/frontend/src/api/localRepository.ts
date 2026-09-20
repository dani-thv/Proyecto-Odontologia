import type { Appointment, Patient, PendingPatient, Reminder, TreatmentPlan } from "@/types";
import { SEED_PATIENTS } from "@/data/patients";
import { SEED_APPOINTMENTS, SEED_PENDING, SEED_REMINDERS } from "@/data/appointments";
import { SEED_PLANS } from "@/data/plans";
import { toHHMM } from "@/utils/dates";
import { makeId } from "@/utils/id";
import type { ClinicData, ClinicRepository } from "./repository";

export interface LocalRepository extends ClinicRepository {
  /** Copia síncrona del estado, para arrancar la app ya cargada (pruebas). */
  snapshot(): ClinicData;
}

const copyData = (d: ClinicData): ClinicData => ({
  patients: [...d.patients],
  appointments: [...d.appointments],
  pending: [...d.pending],
  plans: d.plans.map((p) => ({ ...p, payments: [...p.payments] })),
  reminders: [...d.reminders],
});

const byRequestedOn = (a: PendingPatient, b: PendingPatient) => a.requestedOn.localeCompare(b.requestedOn);

/** Repositorio en memoria con los datos de ejemplo. Se pierde al recargar la página. */
export function createLocalRepository(seed?: Partial<ClinicData>): LocalRepository {
  let state: ClinicData = copyData({
    patients: seed?.patients ?? SEED_PATIENTS,
    appointments: seed?.appointments ?? SEED_APPOINTMENTS,
    pending: seed?.pending ?? SEED_PENDING,
    plans: seed?.plans ?? SEED_PLANS,
    reminders: seed?.reminders ?? SEED_REMINDERS,
  });

  const snapshot = () => copyData({ ...state, pending: [...state.pending].sort(byRequestedOn) });

  return {
    snapshot,
    load: async () => snapshot(),
    loadAppointments: async () => [...state.appointments],
    loadPending: async () => snapshot().pending,
    loadReminders: async () => [...state.reminders],

    async addAppointment(input, fromPendingId) {
      const appointment: Appointment = { ...input, id: makeId("apt") };
      state.appointments = [...state.appointments, appointment];
      // Si venía de "pendientes de reagendar", sale de esa lista (por id, no por nombre).
      state.pending = state.pending.filter(
        (p) => p.id !== fromPendingId && !(input.patientId && p.patientId === input.patientId),
      );
      return appointment;
    },
    async updateAppointment(id, input) {
      const updated: Appointment = { ...input, id };
      state.appointments = state.appointments.map((a) => (a.id === id ? updated : a));
      return updated;
    },
    async removeAppointment(id) {
      state.appointments = state.appointments.filter((a) => a.id !== id);
      state.reminders = state.reminders.filter((r) => r.appointmentId !== id);
    },
    async confirmReminder(id) {
      const reminder = state.reminders.find((r) => r.id === id);
      if (!reminder) return;
      state.reminders = state.reminders.map((r): Reminder => (r.id === id ? { ...r, status: "confirmed" } : r));
      state.appointments = state.appointments.map((a) =>
        a.id === reminder.appointmentId ? { ...a, status: "confirmed" } : a,
      );
    },
    async dismissReminder(id) {
      state.reminders = state.reminders.filter((r) => r.id !== id);
    },

    async addPatient(input) {
      const patient: Patient = { ...input, id: makeId("pat") };
      state.patients = [...state.patients, patient];
      return patient;
    },
    async addPlan(input) {
      const plan: TreatmentPlan = { ...input, id: makeId("plan"), payments: [] };
      state.plans = [...state.plans, plan];
      return plan;
    },
    async addPayment(planId, input) {
      let updated: TreatmentPlan | undefined;
      const time = input.time ?? toHHMM(new Date());
      state.plans = state.plans.map((plan) => {
        if (plan.id !== planId) return plan;
        updated = { ...plan, payments: [...plan.payments, { ...input, time, id: makeId("pay") }] };
        return updated;
      });
      if (!updated) throw new Error("Tratamiento no encontrado");
      return updated;
    },
  };
}
