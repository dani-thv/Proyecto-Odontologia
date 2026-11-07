import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderApp } from "@/test/render";
import Patients from "./Patients";

describe("Patients", () => {
  it("lista los pacientes y los cuenta por saldo (derivado de los pagos)", () => {
    renderApp(<Patients />);
    expect(screen.getByRole("button", { name: /Total: 16/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Con saldo pendiente: 6/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Al día: 10/ })).toBeInTheDocument();
  });

  it("filtra por búsqueda de nombre o cédula", async () => {
    const user = userEvent.setup();
    renderApp(<Patients />);
    await user.type(screen.getByRole("searchbox"), "valentina");
    expect(screen.getByText("Valentina Cruz Salcedo")).toBeInTheDocument();
    expect(screen.queryByText("Andrea Morales Gómez")).not.toBeInTheDocument();
    await user.clear(screen.getByRole("searchbox"));
    await user.type(screen.getByRole("searchbox"), "79.654");
    expect(screen.getByText("Jorge Sánchez Duque")).toBeInTheDocument();
    await user.clear(screen.getByRole("searchbox"));
    await user.type(screen.getByRole("searchbox"), "zzz");
    expect(screen.getByText("No se encontraron pacientes")).toBeInTheDocument();
  });

  it("filtra por saldo pendiente", async () => {
    const user = userEvent.setup();
    renderApp(<Patients />);
    await user.click(screen.getByRole("button", { name: /Con saldo pendiente/ }));
    expect(screen.getByText("Valentina Cruz Salcedo")).toBeInTheDocument();
    expect(screen.queryByText("Andrea Morales Gómez")).not.toBeInTheDocument();
  });

  it("abre la ficha con el estado de cuenta y la próxima cita", async () => {
    const user = userEvent.setup();
    renderApp(<Patients />);
    await user.click(screen.getByRole("button", { name: "Ver ficha de Valentina Cruz Salcedo" }));
    const dialog = screen.getByRole("dialog", { name: "Ficha del Paciente" });
    expect(within(dialog).getByText(/Saldo pendiente: \$ 350\.000/)).toBeInTheDocument();
    expect(within(dialog).getByText("18/09/2026")).toBeInTheDocument();
  });

  it("registra un paciente nuevo y valida cédula duplicada", async () => {
    const user = userEvent.setup();
    renderApp(<Patients />);
    await user.click(screen.getByRole("button", { name: /Nuevo paciente/ }));
    let dialog = screen.getByRole("dialog", { name: "Nuevo paciente" });

    await user.click(within(dialog).getByRole("button", { name: "Guardar paciente" }));
    expect(within(dialog).getAllByRole("alert")).toHaveLength(3);

    await user.type(within(dialog).getByLabelText("Nombre completo *"), "Ana Pérez");
    await user.type(within(dialog).getByLabelText("Cédula *"), "1032458771"); // ya existe (Andrea)
    await user.type(within(dialog).getByLabelText("Teléfono *"), "3001234567");
    await user.click(within(dialog).getByRole("button", { name: "Guardar paciente" }));
    expect(within(dialog).getByText("Ya existe un paciente con esta cédula.")).toBeInTheDocument();

    await user.clear(within(dialog).getByLabelText("Cédula *"));
    await user.type(within(dialog).getByLabelText("Cédula *"), "52123456");
    await user.click(within(dialog).getByRole("button", { name: "Guardar paciente" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText("Ana Pérez")).toBeInTheDocument();
    expect(screen.getByText(/52\.123\.456/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Total: 17/ })).toBeInTheDocument();
    dialog = null as never;
  });
});
