import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderApp } from "@/test/render";
import Dashboard from "./Dashboard";

describe("Dashboard", () => {
  it("calcula las cifras desde las citas (sin números fijos)", () => {
    renderApp(<Dashboard />);
    expect(screen.getByText(/Hoy hay/)).toHaveTextContent("Hoy hay 8 citas programadas");
    const today = screen.getByRole("region", { name: "Citas del día" });
    expect(within(today).getAllByRole("listitem")).toHaveLength(8);
    expect(screen.getByText("1 urgente")).toBeInTheDocument();
    expect(screen.getByText("Dr. Carlos (7) · Dra. Liliana (1)")).toBeInTheDocument();
  });

  it("confirmar un recordatorio actualiza la cita y los contadores", async () => {
    const user = userEvent.setup();
    renderApp(<Dashboard />);
    const reminders = screen.getByRole("region", { name: "Recordatorios de mañana" });
    expect(within(reminders).getByText("4 pendientes")).toBeInTheDocument();

    await user.click(within(reminders).getByRole("button", { name: "Confirmar cita de Sofía Mendoza Arango" }));
    expect(within(reminders).getByText("3 pendientes")).toBeInTheDocument();
    expect(within(reminders).getByText(/Confirmado/)).toBeInTheDocument();
  });

  it("descartar un recordatorio lo quita de la lista", async () => {
    const user = userEvent.setup();
    renderApp(<Dashboard />);
    await user.click(screen.getByRole("button", { name: "Descartar recordatorio de Camila Torres Ibarra" }));
    expect(screen.queryByText("Camila Torres Ibarra")).not.toBeInTheDocument();
  });
});
