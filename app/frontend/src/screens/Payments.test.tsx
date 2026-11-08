import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderApp } from "@/test/render";
import Payments from "./Payments";

const metric = (label: string) => screen.getByText(label).nextElementSibling!;

describe("Payments", () => {
  it("muestra el resumen de la primera cuenta (Valentina)", () => {
    renderApp(<Payments />);
    expect(metric("Costo total")).toHaveTextContent("$ 850.000");
    expect(metric("Abonado")).toHaveTextContent("$ 500.000");
    expect(metric("Pendiente")).toHaveTextContent("$ 350.000");
    expect(screen.getByRole("progressbar", { name: "Progreso de pago" })).toHaveAttribute("aria-valuenow", "59");
  });

  it("registra un abono y actualiza saldo, historial y progreso", async () => {
    const user = userEvent.setup();
    renderApp(<Payments />);
    await user.click(screen.getByRole("button", { name: /Registrar abono/ }));
    const dialog = screen.getByRole("dialog", { name: "Registrar abono" });
    await user.type(within(dialog).getByLabelText("Valor del abono (COP) *"), "150000");
    await user.type(within(dialog).getByLabelText("Firma de conformidad *"), "V. Cruz");
    await user.click(within(dialog).getByRole("button", { name: "Registrar abono" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(metric("Abonado")).toHaveTextContent("$ 650.000");
    expect(metric("Pendiente")).toHaveTextContent("$ 200.000");
    expect(screen.getByText("4 transacciones registradas")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "76");
  });

  it("no permite abonar más que el saldo ni dejar la firma vacía", async () => {
    const user = userEvent.setup();
    renderApp(<Payments />);
    await user.click(screen.getByRole("button", { name: /Registrar abono/ }));
    const dialog = screen.getByRole("dialog", { name: "Registrar abono" });
    await user.type(within(dialog).getByLabelText("Valor del abono (COP) *"), "999999");
    await user.click(within(dialog).getByRole("button", { name: "Registrar abono" }));
    expect(within(dialog).getByText(/no puede superar el saldo pendiente/)).toBeInTheDocument();
    expect(within(dialog).getByText(/firma de conformidad/i, { selector: "p" })).toBeInTheDocument();
    expect(metric("Abonado")).toHaveTextContent("$ 500.000");
  });

  it("calcula el cierre de caja del día y la diferencia de efectivo", async () => {
    const user = userEvent.setup();
    renderApp(<Payments />);
    expect(screen.getByRole("heading", { name: "Cierre de caja diario" })).toBeInTheDocument();

    const dateInput = screen.getByLabelText("Fecha del cierre de caja");
    await user.clear(dateInput);
    await user.type(dateInput, "2026-09-18");

    expect(screen.getByText("Debería haber").nextElementSibling).toHaveTextContent("$ 760.000");
    expect(screen.queryByText("Diferencia")).not.toBeInTheDocument();

    await user.type(screen.getByLabelText("Hay en caja"), "730000");
    const diff = screen.getByText("Diferencia").parentElement!;
    expect(diff).toHaveTextContent("-$ 30.000");

    await user.clear(screen.getByLabelText("Hay en caja"));
    await user.type(screen.getByLabelText("Hay en caja"), "760000");
    expect(screen.getByText("Caja cuadrada").parentElement).toHaveTextContent("$ 0");
  });

  it("cambia de paciente con el selector", async () => {
    const user = userEvent.setup();
    renderApp(<Payments />);
    await user.selectOptions(screen.getByLabelText("Seleccionar paciente"), screen.getByRole("option", { name: /Luis Felipe Roa/ }));
    expect(metric("Pendiente")).toHaveTextContent("$ 120.000");
  });
});
