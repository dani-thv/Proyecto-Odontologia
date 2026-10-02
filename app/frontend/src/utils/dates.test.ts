import { describe, expect, it } from "vitest";
import { addDays, diffDays, formatLongDate, formatRelative, formatShortDate, formatWeekRange, startOfWeek, weekdayIndex } from "./dates";

describe("dates", () => {
  it("startOfWeek devuelve el lunes", () => {
    expect(startOfWeek("2026-09-18")).toBe("2026-09-14");
    expect(startOfWeek("2026-09-14")).toBe("2026-09-14");
    expect(startOfWeek("2026-09-20")).toBe("2026-09-14"); // domingo pertenece a la semana anterior
  });
  it("addDays cruza meses y años", () => {
    expect(addDays("2026-09-28", 5)).toBe("2026-10-03");
    expect(addDays("2026-12-30", 3)).toBe("2027-01-02");
    expect(addDays("2026-09-14", -7)).toBe("2026-09-07");
  });
  it("weekdayIndex: lunes=0 … domingo=6", () => {
    expect(weekdayIndex("2026-09-14")).toBe(0);
    expect(weekdayIndex("2026-09-19")).toBe(5);
    expect(weekdayIndex("2026-09-20")).toBe(6);
  });
  it("formatea rango, fecha corta y fecha larga", () => {
    expect(formatWeekRange("2026-09-14")).toBe("14 de sept – 19 de sept de 2026");
    expect(formatShortDate("2026-09-05")).toBe("05/09/2026");
    expect(formatLongDate("2026-09-18")).toMatch(/^Viernes, 18 de septiembre de 2026$/);
  });
  it("diffDays y formatRelative describen cuánto hace", () => {
    expect(diffDays("2026-09-16", "2026-09-18")).toBe(2);
    expect(formatRelative("2026-09-18", "2026-09-18")).toBe("Hoy");
    expect(formatRelative("2026-09-17", "2026-09-18")).toBe("Ayer");
    expect(formatRelative("2026-09-15", "2026-09-18")).toBe("Hace 3 días");
    expect(formatRelative("2026-09-30", "2026-09-18")).toBe("Hoy"); // fechas futuras no dicen "Hace"
  });
});
