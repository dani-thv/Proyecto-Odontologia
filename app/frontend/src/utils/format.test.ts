import { describe, expect, it } from "vitest";
import { formatCOP, formatCedula, formatPhone, initialsOf, telHref, whatsappHref } from "./format";

describe("format", () => {
  it("formatea pesos colombianos", () => {
    expect(formatCOP(1234567)).toBe("$ 1.234.567");
    expect(formatCOP(0)).toBe("$ 0");
  });
  it("formatea cédula y teléfono", () => {
    expect(formatCedula("1032458771")).toBe("1.032.458.771");
    expect(formatCedula("79654321")).toBe("79.654.321");
    expect(formatPhone("3104528814")).toBe("310 452 8814");
    expect(formatPhone("604-1234")).toBe("6041234");
  });
  it("arma enlaces de teléfono y WhatsApp con prefijo +57", () => {
    expect(telHref("310 452 8814")).toBe("tel:3104528814");
    expect(whatsappHref("310 452 8814")).toBe("https://wa.me/573104528814");
  });
  it("iniciales", () => {
    expect(initialsOf("Andrea Morales Gómez")).toBe("AM");
    expect(initialsOf("  luis  ")).toBe("L");
  });
});
