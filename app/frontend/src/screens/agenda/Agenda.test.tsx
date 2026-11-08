import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { setMobileViewport } from "@/test/setup";
import { renderApp } from "@/test/render";
import Agenda from "./index";

describe("Agenda (escritorio)", () => {
  it("muestra la semana de la demo y las citas del doctor activo", () => {
    renderApp(<Agenda />);
    expect(screen.getByText("14 de sept – 19 de sept de 2026")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /Andrea Morales Gómez/ }).length).toBeGreaterThan(0);
    // Citas de Dra. Liliana no aparecen en la pestaña inicial del Dr. Carlos
    expect(screen.queryByRole("button", { name: /Carolina Pinto/ })).not.toBeInTheDocument();
  });

  it("cambia de doctor con las pestañas", async () => {
    const user = userEvent.setup();
    renderApp(<Agenda />);
    await user.click(screen.getByRole("tab", { name: /Dra. Liliana/ }));
    expect(screen.getAllByRole("button", { name: /Carolina Pinto/ }).length).toBeGreaterThan(0);
  });

  it("navega entre semanas y vuelve con Hoy", async () => {
    const user = userEvent.setup();
    renderApp(<Agenda />);
    await user.click(screen.getByRole("button", { name: "Semana siguiente" }));
    expect(screen.getByText("21 de sept – 26 de sept de 2026")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Semana anterior" }));
    await user.click(screen.getByRole("button", { name: "Semana anterior" }));
    expect(screen.getByText("7 de sept – 12 de sept de 2026")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Hoy" }));
    expect(screen.getByText("14 de sept – 19 de sept de 2026")).toBeInTheDocument();
  });

  it("abre la edición con el teclado (Enter sobre una cita)", async () => {
    const user = userEvent.setup();
    renderApp(<Agenda />);
    const appt = screen.getAllByRole("button", { name: /Valentina Cruz Salcedo/ })[0]!;
    appt.focus();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("dialog", { name: "Editar cita" })).toBeInTheDocument();
  });

  it("crea una cita válida", async () => {
    const user = userEvent.setup();
    renderApp(<Agenda />);
    await user.click(screen.getByRole("button", { name: /Nueva cita/ }));
    const dialog = screen.getByRole("dialog", { name: "Nueva cita" });
    await user.type(within(dialog).getByLabelText("Paciente *"), "Paciente Nuevo");
    await user.clear(within(dialog).getByLabelText("Hora inicio"));
    await user.type(within(dialog).getByLabelText("Hora inicio"), "15:00");
    await user.click(within(dialog).getByRole("button", { name: "Guardar cita" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Cita programada para Paciente Nuevo");
    expect(screen.getAllByRole("button", { name: /Paciente Nuevo/ }).length).toBeGreaterThan(0);
  });

  it("rechaza una cita que se cruza con otra del mismo doctor", async () => {
    const user = userEvent.setup();
    renderApp(<Agenda />);
    await user.click(screen.getByRole("button", { name: /Nueva cita/ }));
    const dialog = screen.getByRole("dialog", { name: "Nueva cita" });
    await user.type(within(dialog).getByLabelText("Paciente *"), "Otro Paciente");
    // Viernes 18, 08:30: choca con Andrea Morales (08:00–09:00) del Dr. Carlos
    await user.clear(within(dialog).getByLabelText("Hora inicio"));
    await user.type(within(dialog).getByLabelText("Hora inicio"), "08:30");
    await user.click(within(dialog).getByRole("button", { name: "Guardar cita" }));
    expect(within(dialog).getByRole("alert")).toHaveTextContent(/Se cruza con la cita de Andrea Morales/);
    expect(screen.getByRole("dialog", { name: "Nueva cita" })).toBeInTheDocument();
  });

  it("elimina una cita tras confirmar", async () => {
    const user = userEvent.setup();
    renderApp(<Agenda />);
    await user.click(screen.getAllByRole("button", { name: /Daniel Vargas Peñaranda/ })[0]!);
    await user.click(screen.getByRole("button", { name: "Eliminar cita" }));
    const confirm = screen.getByRole("dialog", { name: "Eliminar cita" });
    await user.click(within(confirm).getByRole("button", { name: "Eliminar" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Cita eliminada");
  });

  it("reagenda un paciente pendiente y lo saca de la lista", async () => {
    const user = userEvent.setup();
    renderApp(<Agenda />);
    expect(screen.getByText("4 pacientes")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Reagendar a Esteban Gutiérrez Mora" }));
    const dialog = screen.getByRole("dialog", { name: "Nueva cita" });
    expect(within(dialog).getByLabelText("Paciente *")).toHaveValue("Esteban Gutiérrez Mora");
    await user.clear(within(dialog).getByLabelText("Hora inicio"));
    await user.type(within(dialog).getByLabelText("Hora inicio"), "16:00");
    await user.click(within(dialog).getByRole("button", { name: "Guardar cita" }));
    expect(screen.getByText("3 pacientes")).toBeInTheDocument();
  });
});

describe("Agenda (móvil)", () => {
  it("muestra la tira de días y la vista Día con las citas del día", () => {
    setMobileViewport(true);
    renderApp(<Agenda />);
    expect(screen.getByRole("button", { name: "Vie 18" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /Andrea Morales Gómez/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Pendientes/ })).toBeInTheDocument();
  });
});
