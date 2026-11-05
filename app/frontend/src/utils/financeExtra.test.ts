import { describe, expect, it } from "vitest";
import { dailyClosing } from "./finance";
import type { TreatmentPlan, Patient } from "@/types";

describe("financeExtra - dailyClosing", () => {
  const dummyPatients: Patient[] = [
    {
      id: 1,
      name: "Juan Perez",
      cedula: "1.092.000.111",
      phone: "3101234567",
      doctorId: "carlos",
      lastVisit: "2026-09-18",
    },
  ];

  const dummyPlans: TreatmentPlan[] = [
    {
      id: "plan-1",
      patientId: 1,
      concept: "Limpieza",
      totalCost: 250000,
      payments: [
        {
          id: 1,
          date: "2026-09-18",
          time: "09:30",
          concept: "Abono inicial",
          amount: 150000,
          method: "Efectivo",
          signature: "Juan Perez",
        },
        {
          id: 2,
          date: "2026-09-18",
          time: "11:00",
          concept: "Abono saldo",
          amount: 100000,
          method: "Transferencia",
          signature: "Juan Perez",
        },
      ],
    },
  ];

  it("calcula total recaudado, efectivo esperado y desglose por metodo", () => {
    const closing = dailyClosing(dummyPlans, dummyPatients, "2026-09-18");
    expect(closing.total).toBe(250000);
    expect(closing.expectedCash).toBe(150000);
    expect(closing.transactionCount).toBe(2);

    const efectivo = closing.byMethod.find((m) => m.method === "Efectivo");
    expect(efectivo?.amount).toBe(150000);
    expect(efectivo?.count).toBe(1);

    const trans = closing.byMethod.find((m) => m.method === "Transferencia");
    expect(trans?.amount).toBe(100000);
    expect(trans?.count).toBe(1);
  });

  it("retorna estructura vacia y ceros en dias sin movimientos", () => {
    const closing = dailyClosing(dummyPlans, dummyPatients, "2026-09-19");
    expect(closing.total).toBe(0);
    expect(closing.expectedCash).toBe(0);
    expect(closing.transactionCount).toBe(0);
    expect(closing.items).toHaveLength(0);
  });
});
