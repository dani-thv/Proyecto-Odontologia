import { describe, expect, it } from "vitest";
import type { Appointment, AppointmentInput } from "@/types";
import { closingHour, findConflict, formatTimeRange, validateAppointment } from "./schedule";

const base: Appointment = {
  id: "a1", patientId: null, patient: "Ana", treatment: "Limpieza", doctorId: "carlos",
  date: "2026-09-18", startHour: 9, startMin: 0, durationMin: 60, status: "confirmed",
};
const candidate = (over: Partial<AppointmentInput> = {}): AppointmentInput => {
  const { id: _id, ...rest } = base;
  return { ...rest, patient: "Beto", startHour: 9, startMin: 30, ...over };
};

describe("closingHour", () => {
  it("cierra a las 18 entre semana, 14 el sábado y no abre el domingo", () => {
    expect(closingHour("2026-09-18")).toBe(18); // viernes
    expect(closingHour("2026-09-19")).toBe(14); // sábado
    expect(closingHour("2026-09-20")).toBeNull(); // domingo
  });
});

describe("findConflict", () => {
  it("detecta cruce con el mismo doctor y día", () => {
    expect(findConflict([base], candidate())?.id).toBe("a1");
  });
  it("permite citas contiguas (termina justo cuando empieza la otra)", () => {
    expect(findConflict([base], candidate({ startHour: 10, startMin: 0 }))).toBeUndefined();
  });
  it("no cruza con otro doctor ni con otro día", () => {
    expect(findConflict([base], candidate({ doctorId: "liliana" }))).toBeUndefined();
    expect(findConflict([base], candidate({ date: "2026-09-17" }))).toBeUndefined();
  });
  it("las citas canceladas liberan el horario", () => {
    expect(findConflict([{ ...base, status: "cancelled" }], candidate())).toBeUndefined();
  });
  it("ignora la propia cita al editar", () => {
    expect(findConflict([base], candidate(), "a1")).toBeUndefined();
  });
});

describe("validateAppointment", () => {
  it("exige nombre de paciente", () => {
    expect(validateAppointment(candidate({ patient: "  ", startHour: 12 }), [])).toMatch(/paciente/i);
  });
  it("rechaza antes de la apertura y después del cierre", () => {
    expect(validateAppointment(candidate({ startHour: 7, startMin: 30 }), [])).toMatch(/abre/);
    expect(validateAppointment(candidate({ startHour: 17, startMin: 30, durationMin: 60 }), [])).toMatch(/cierre/);
  });
  it("el sábado cierra a las 14:00 y el domingo no se atiende", () => {
    expect(validateAppointment(candidate({ date: "2026-09-19", startHour: 13, startMin: 30, durationMin: 60 }), [])).toMatch(/14:00/);
    expect(validateAppointment(candidate({ date: "2026-09-20" }), [])).toMatch(/domingos/);
  });
  it("informa con quién se cruza", () => {
    expect(validateAppointment(candidate(), [base])).toMatch(/Ana/);
  });
  it("acepta una cita válida y una cancelada que se cruza", () => {
    expect(validateAppointment(candidate({ startHour: 11 }), [base])).toBeNull();
    expect(validateAppointment(candidate({ status: "cancelled" }), [base])).toBeNull();
  });
});

describe("formatTimeRange", () => {
  it("formatea inicio y fin", () => {
    expect(formatTimeRange({ startHour: 9, startMin: 45, durationMin: 105 })).toBe("09:45 – 11:30");
  });
});
