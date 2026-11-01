import type { TreatmentPlan } from "@/types";

export const SEED_PLANS: TreatmentPlan[] = [
  {
    id: "plan-01", patientId: "pat-03", concept: "Extracción molar", totalCost: 850000,
    payments: [
      { id: "pay-01", date: "2026-08-10", time: "09:00", concept: "Cuota inicial – Extracción molar", amount: 200000, method: "Efectivo", signature: "V. Cruz" },
      { id: "pay-02", date: "2026-08-25", time: "10:30", concept: "2.ª cuota", amount: 150000, method: "Transferencia", signature: "V. Cruz" },
      { id: "pay-03", date: "2026-09-05", time: "11:00", concept: "3.ª cuota", amount: 150000, method: "Datáfono", signature: "V. Cruz" },
    ],
  },
  {
    id: "plan-02", patientId: "pat-02", concept: "Endodoncia premolar", totalCost: 500000,
    payments: [
      { id: "pay-04", date: "2026-08-01", time: "08:30", concept: "Cuota inicial – Endodoncia", amount: 200000, method: "Efectivo", signature: "L. Roa" },
      { id: "pay-05", date: "2026-08-15", time: "09:45", concept: "2.ª cuota", amount: 180000, method: "Transferencia", signature: "L. Roa" },
    ],
  },
  {
    id: "plan-03", patientId: "pat-01", concept: "Limpieza", totalCost: 250000,
    payments: [
      { id: "pay-06", date: "2026-09-14", time: "08:00", concept: "Pago total – Limpieza", amount: 250000, method: "Datáfono", signature: "A. Morales" },
    ],
  },
  { id: "plan-04", patientId: "pat-05", concept: "Odontopediatría", totalCost: 75000, payments: [] },
  { id: "plan-05", patientId: "pat-06", concept: "Endodoncia", totalCost: 200000, payments: [] },
  { id: "plan-06", patientId: "pat-08", concept: "Resina", totalCost: 450000, payments: [] },
  {
    id: "plan-07", patientId: "pat-04", concept: "Resina estética", totalCost: 1200000,
    payments: [
      { id: "pay-07", date: "2026-09-01", time: "10:00", concept: "Cuota inicial – Resina estética", amount: 700000, method: "Transferencia", signature: "M. Herrera" },
      { id: "pay-08", date: "2026-09-18", time: "10:45", concept: "Pago final – Resina estética", amount: 500000, method: "Efectivo", signature: "M. Herrera" },
    ],
  },
  {
    id: "plan-08", patientId: "pat-10", concept: "Blanqueamiento", totalCost: 600000,
    payments: [
      { id: "pay-09", date: "2026-09-18", time: "11:20", concept: "Anticipo – Blanqueamiento", amount: 300000, method: "Transferencia", signature: "R. Ávila" },
    ],
  },
  {
    id: "plan-09", patientId: "pat-11", concept: "Fluorización y profilaxis", totalCost: 320000,
    payments: [
      { id: "pay-10", date: "2026-09-18", time: "11:50", concept: "Pago total – Fluorización", amount: 320000, method: "Datáfono", signature: "C. Torres" },
    ],
  },
  {
    id: "plan-10", patientId: "pat-09", concept: "Odontopediatría preventiva", totalCost: 180000,
    payments: [
      { id: "pay-11", date: "2026-09-18", time: "12:30", concept: "Pago total – Odontopediatría", amount: 180000, method: "Efectivo", signature: "S. Mendoza" },
    ],
  },
  {
    id: "plan-11", patientId: "pat-07", concept: "Revisión general", totalCost: 80000,
    payments: [
      { id: "pay-12", date: "2026-09-18", time: "13:15", concept: "Pago total – Revisión general", amount: 80000, method: "Efectivo", signature: "I. Romero" },
    ],
  },
];
