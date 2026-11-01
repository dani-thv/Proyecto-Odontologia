import { describe, expect, it } from "vitest";
import { SEED_PATIENTS } from "@/data/patients";
import { SEED_PLANS } from "@/data/plans";
import { DEMO_TODAY } from "@/data/demo";
import { dailyClosing, patientBalance, paymentsWithRemaining, planPaid, planPending, planProgress } from "./finance";

const plan = (id: string) => SEED_PLANS.find((p) => p.id === id)!;

describe("finance", () => {
  it("calcula abonado, pendiente y progreso", () => {
    const p = plan("plan-01"); // Valentina: 850.000, abonó 500.000
    expect(planPaid(p)).toBe(500000);
    expect(planPending(p)).toBe(350000);
    expect(planProgress(p)).toBe(59);
  });
  it("calcula el saldo restante después de cada abono", () => {
    expect(paymentsWithRemaining(plan("plan-01")).map((p) => p.remaining)).toEqual([650000, 500000, 350000]);
  });
  it("saldo por paciente se deriva de los planes", () => {
    expect(patientBalance(SEED_PLANS, "pat-03")).toBe(350000);
    expect(patientBalance(SEED_PLANS, "pat-02")).toBe(120000);
    expect(patientBalance(SEED_PLANS, "pat-01")).toBe(0);
    expect(patientBalance(SEED_PLANS, "pat-04")).toBe(0);
  });
  it("cierre de caja del día suma por doctor y método", () => {
    const c = dailyClosing(SEED_PLANS, SEED_PATIENTS, DEMO_TODAY);
    expect(c.total).toBe(1380000);
    expect(c.expectedCash).toBe(760000);
    expect(c.byDoctor.find((d) => d.doctorId === "carlos")?.amount).toBe(880000);
    expect(c.byDoctor.find((d) => d.doctorId === "liliana")?.amount).toBe(500000);
    expect(c.byDoctor.reduce((s, d) => s + d.amount, 0)).toBe(c.total);
    expect(c.byMethod.reduce((s, m) => s + m.amount, 0)).toBe(c.total);
  });
  it("un día sin pagos da cero", () => {
    expect(dailyClosing(SEED_PLANS, SEED_PATIENTS, "2026-01-01").total).toBe(0);
  });
});
