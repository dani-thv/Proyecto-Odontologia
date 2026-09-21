import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Appointment, AppointmentInput, Patient, Payment, TreatmentPlan } from "@/types";
import { createApiRepository } from "@/api/apiRepository";
import { createLocalRepository } from "@/api/localRepository";
import type { ClinicData, ClinicRepository } from "@/api/repository";
import { messageOf } from "@/api/http";

export type ClinicState = ClinicData;

export interface ClinicActions {
  addAppointment: (input: AppointmentInput, fromPendingId?: string) => Promise<Appointment>;
  updateAppointment: (id: string, input: AppointmentInput) => Promise<void>;
  removeAppointment: (id: string) => Promise<void>;
  confirmReminder: (reminderId: string) => Promise<void>;
  dismissReminder: (reminderId: string) => Promise<void>;
  addPatient: (input: Omit<Patient, "id">) => Promise<Patient>;
  addPayment: (planId: string, input: Omit<Payment, "id">) => Promise<void>;
  addPlan: (input: Omit<TreatmentPlan, "id" | "payments">) => Promise<TreatmentPlan>;
}

export interface ClinicConnection {
  status: "loading" | "ready" | "error";
  /** Mensaje del último fallo de carga. */
  error: string | null;
  /** true cuando el usuario eligió seguir sin servidor, con datos de ejemplo en memoria. */
  demoMode: boolean;
  retry: () => void;
  continueInDemoMode: () => void;
}

type ClinicContextValue = ClinicState & ClinicActions & ClinicConnection;

const ClinicContext = createContext<ClinicContextValue | null>(null);

const EMPTY: ClinicState = { patients: [], appointments: [], pending: [], plans: [], reminders: [] };

interface ProviderProps {
  children: ReactNode;
  /** Por defecto, la API del backend. */
  repository?: ClinicRepository;
  /** Datos ya cargados: la app arranca lista sin pasar por "cargando" (pruebas). */
  initialData?: ClinicState;
}

/** Única fuente de datos de la app; toda lectura/escritura pasa por el repositorio. */
export function ClinicProvider({ children, repository, initialData }: ProviderProps) {
  const [repo, setRepo] = useState<ClinicRepository>(() => repository ?? createApiRepository());
  const [data, setData] = useState<ClinicState>(initialData ?? EMPTY);
  const [status, setStatus] = useState<ClinicConnection["status"]>(initialData ? "ready" : "loading");
  const [error, setError] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (initialData && attempt === 0) return;
    let cancelled = false;
    setStatus("loading");
    repo
      .load()
      .then((loaded) => {
        if (cancelled) return;
        setData(loaded);
        setError(null);
        setStatus("ready");
      })
      .catch((e) => {
        if (cancelled) return;
        setError(messageOf(e));
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
    // initialData solo cuenta en el primer render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repo, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  const continueInDemoMode = useCallback(() => {
    setRepo(createLocalRepository());
    setDemoMode(true);
    setAttempt((n) => n + 1);
  }, []);

  /** Recarga citas, pendientes y recordatorios: el servidor puede haber cambiado varios a la vez. */
  const refreshSchedule = useCallback(async () => {
    const [appointments, pending, reminders] = await Promise.all([
      repo.loadAppointments(), repo.loadPending(), repo.loadReminders(),
    ]);
    setData((d) => ({ ...d, appointments, pending, reminders }));
  }, [repo]);

  const actions = useMemo<ClinicActions>(
    () => ({
      async addAppointment(input, fromPendingId) {
        const created = await repo.addAppointment(input, fromPendingId);
        await refreshSchedule().catch(() => setData((d) => ({ ...d, appointments: [...d.appointments, created] })));
        return created;
      },
      async updateAppointment(id, input) {
        const updated = await repo.updateAppointment(id, input);
        await refreshSchedule().catch(() =>
          setData((d) => ({ ...d, appointments: d.appointments.map((a) => (a.id === id ? updated : a)) })));
      },
      async removeAppointment(id) {
        await repo.removeAppointment(id);
        await refreshSchedule().catch(() =>
          setData((d) => ({
            ...d,
            appointments: d.appointments.filter((a) => a.id !== id),
            reminders: d.reminders.filter((r) => r.appointmentId !== id),
          })));
      },
      async confirmReminder(reminderId) {
        await repo.confirmReminder(reminderId);
        await refreshSchedule();
      },
      async dismissReminder(reminderId) {
        await repo.dismissReminder(reminderId);
        setData((d) => ({ ...d, reminders: d.reminders.filter((r) => r.id !== reminderId) }));
      },
      async addPatient(input) {
        const patient = await repo.addPatient(input);
        setData((d) => ({ ...d, patients: [...d.patients, patient] }));
        return patient;
      },
      async addPlan(input) {
        const plan = await repo.addPlan(input);
        setData((d) => ({ ...d, plans: [...d.plans, plan] }));
        return plan;
      },
      async addPayment(planId, input) {
        const plan = await repo.addPayment(planId, input);
        setData((d) => ({ ...d, plans: d.plans.map((p) => (p.id === planId ? plan : p)) }));
      },
    }),
    [repo, refreshSchedule],
  );

  const value = useMemo<ClinicContextValue>(
    () => ({ ...data, ...actions, status, error, demoMode, retry, continueInDemoMode }),
    [data, actions, status, error, demoMode, retry, continueInDemoMode],
  );

  return <ClinicContext.Provider value={value}>{children}</ClinicContext.Provider>;
}

export function useClinic(): ClinicContextValue {
  const ctx = useContext(ClinicContext);
  if (!ctx) throw new Error("useClinic debe usarse dentro de <ClinicProvider>");
  return ctx;
}
