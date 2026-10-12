import { describe, expect, it } from "vitest";
import { createLocalRepository } from "./localRepository";

describe("localRepository", () => {
  it("carga los datos de ejemplo y ordena los pendientes por antigüedad", async () => {
    const data = await createLocalRepository().load();
    expect(data.patients).toHaveLength(16);
    expect(data.appointments).toHaveLength(20);
    expect(data.pending.map((p) => p.requestedOn)).toEqual(["2026-09-15", "2026-09-16", "2026-09-17", "2026-09-18"]);
  });

  it("agendar desde pendientes saca al paciente de la lista", async () => {
    const repo = createLocalRepository();
    const [first] = await repo.loadPending();
    await repo.addAppointment({
      patientId: first!.patientId, patient: first!.name, treatment: first!.treatment, doctorId: "carlos",
      date: "2026-09-18", startHour: 16, startMin: 0, durationMin: 60, status: "confirmed",
    }, first!.id);
    expect(await repo.loadPending()).toHaveLength(3);
  });

  it("confirmar un recordatorio confirma la cita; borrar la cita borra el recordatorio", async () => {
    const repo = createLocalRepository();
    const [reminder] = await repo.loadReminders();
    await repo.confirmReminder(reminder!.id);
    expect((await repo.loadAppointments()).find((a) => a.id === reminder!.appointmentId)?.status).toBe("confirmed");
    await repo.removeAppointment(reminder!.appointmentId);
    expect((await repo.loadReminders()).some((r) => r.id === reminder!.id)).toBe(false);
  });

  it("un abono devuelve el tratamiento con el pago nuevo y no altera copias anteriores", async () => {
    const repo = createLocalRepository();
    const before = (await repo.load()).plans.find((p) => p.id === "plan-01")!;
    const after = await repo.addPayment("plan-01", { date: "2026-09-18", concept: "x", amount: 1000, method: "Efectivo", signature: "V" });
    expect(after.payments).toHaveLength(before.payments.length + 1);
    expect(before.payments).toHaveLength(3);
  });
});
