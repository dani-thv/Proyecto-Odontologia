import type { DoctorId, Patient, Payment, PaymentMethod, TreatmentPlan } from "@/types";
import { DOCTORS, doctorById } from "@/constants/doctors";

export const METHODS: PaymentMethod[] = ["Efectivo", "Transferencia", "Datáfono"];

export const planPaid = (plan: TreatmentPlan) => plan.payments.reduce((sum, p) => sum + p.amount, 0);

export const planPending = (plan: TreatmentPlan) => plan.totalCost - planPaid(plan);

export const planProgress = (plan: TreatmentPlan) =>
  plan.totalCost === 0 ? 100 : Math.round((planPaid(plan) / plan.totalCost) * 100);

/** Pagos en orden cronológico con el saldo que quedaba después de cada uno. */
export function paymentsWithRemaining(plan: TreatmentPlan): (Payment & { remaining: number })[] {
  let remaining = plan.totalCost;
  return [...plan.payments]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((p) => {
      remaining -= p.amount;
      return { ...p, remaining };
    });
}

export const patientBalance = (plans: TreatmentPlan[], patientId: string) =>
  plans.filter((p) => p.patientId === patientId).reduce((sum, p) => sum + planPending(p), 0);

export interface DailyClosingItem {
  id: string;
  time: string;
  patientName: string;
  patientCedula: string;
  concept: string;
  doctorName: string;
  method: PaymentMethod;
  amount: number;
  signature: string;
}

export interface DailyClosing {
  date: string;
  total: number;
  transactionCount: number;
  items: DailyClosingItem[];
  byDoctor: { doctorId: DoctorId; doctorName: string; amount: number; count: number }[];
  byMethod: { method: PaymentMethod; amount: number; count: number }[];
  /** Efectivo que debería haber en caja. */
  expectedCash: number;
}

export function dailyClosing(plans: TreatmentPlan[], patients: Patient[], date: string): DailyClosing {
  const patientMap = new Map(patients.map((p) => [p.id, p]));
  const doctorTotals = new Map<DoctorId, { amount: number; count: number }>();
  const methodTotals = new Map<PaymentMethod, { amount: number; count: number }>();
  const items: DailyClosingItem[] = [];

  for (const plan of plans) {
    const patient = patientMap.get(plan.patientId);
    const doctorId = (patient?.doctorId ?? "carlos") as DoctorId;
    const doc = doctorById(doctorId);

    for (const pay of plan.payments) {
      if (pay.date !== date) continue;

      const currentMethod = methodTotals.get(pay.method) ?? { amount: 0, count: 0 };
      methodTotals.set(pay.method, {
        amount: currentMethod.amount + pay.amount,
        count: currentMethod.count + 1,
      });

      const currentDoc = doctorTotals.get(doctorId) ?? { amount: 0, count: 0 };
      doctorTotals.set(doctorId, {
        amount: currentDoc.amount + pay.amount,
        count: currentDoc.count + 1,
      });

      items.push({
        id: pay.id,
        time: pay.time || "—",
        patientName: patient?.name ?? "Paciente sin registrar",
        patientCedula: patient?.cedula ?? "—",
        concept: pay.concept,
        doctorName: doc.name,
        method: pay.method,
        amount: pay.amount,
        signature: pay.signature,
      });
    }
  }

  // Ordenar items por hora (dejando sin hora al final en orden de registro)
  items.sort((a, b) => {
    if (a.time === "—" && b.time === "—") return 0;
    if (a.time === "—") return 1;
    if (b.time === "—") return -1;
    return a.time.localeCompare(b.time);
  });

  const byMethod = METHODS.map((method) => {
    const entry = methodTotals.get(method) ?? { amount: 0, count: 0 };
    return { method, amount: entry.amount, count: entry.count };
  });

  const byDoctor = DOCTORS.map((d) => {
    const entry = doctorTotals.get(d.id) ?? { amount: 0, count: 0 };
    return { doctorId: d.id, doctorName: d.name, amount: entry.amount, count: entry.count };
  });

  return {
    date,
    total: byMethod.reduce((sum, m) => sum + m.amount, 0),
    transactionCount: items.length,
    items,
    byDoctor,
    byMethod,
    expectedCash: methodTotals.get("Efectivo")?.amount ?? 0,
  };
}
