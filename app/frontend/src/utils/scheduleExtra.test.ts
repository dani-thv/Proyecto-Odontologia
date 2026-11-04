import { describe, expect, it } from "vitest";
import { validateAppointment } from "./schedule";
import type { Appointment, AppointmentInput } from "@/types";

describe("scheduleExtra - validateAppointment", () => {
  const existing: Appointment[] = [
    {
      id: "1",
      patient: "Carlos Gomez",
      treatment: "Limpieza",
      doctor: "carlos",
      date: "2026-09-18",
      startHour: 8,
      startMin: 0,
      durationMin: 60,
      status: "confirmed",
    },
  ];

  it("permite citas consecutivas sin solapamiento (termina a las 09:00 e inicia a las 09:00)", () => {
    const candidate: AppointmentInput = {
      patient: "Maria Perez",
      treatment: "Revision",
      doctor: "carlos",
      date: "2026-09-18",
      startHour: 9,
      startMin: 0,
      durationMin: 60,
    };
    const res = validateAppointment(candidate, existing);
    expect(res.ok).toBe(true);
  });

  it("rechaza citas que terminan despues de la hora de cierre de la clinica (18:00)", () => {
    const candidate: AppointmentInput = {
      patient: "Pedro Lopez",
      treatment: "Revision",
      doctor: "carlos",
      date: "2026-09-18",
      startHour: 17,
      startMin: 30,
      durationMin: 60,
    };
    const res = validateAppointment(candidate, existing);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error).toContain("cierre");
    }
  });
});
