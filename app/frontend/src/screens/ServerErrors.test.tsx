import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ApiError } from "@/api/http";
import { createLocalRepository } from "@/api/localRepository";
import type { ClinicRepository } from "@/api/repository";
import { renderApp } from "@/test/render";
import Agenda from "./agenda";
import Patients from "./Patients";
import Payments from "./Payments";

/** Repositorio que funciona como el local pero rechaza una operación, como lo haría el servidor. */
function rejecting(method: keyof ClinicRepository, error: ApiError): ClinicRepository {
  const local = createLocalRepository();
  return { ...local, [method]: vi.fn().mockRejectedValue(error) };
}

describe("errores del servidor en pantalla", () => {
  it("cédula repetida (409) se muestra en el campo y el formulario sigue abierto", async () => {
    const user = userEvent.setup();
    renderApp(<Patients />, { repository: rejecting("addPatient", new ApiError(409, "Ya existe un paciente con esta cédula.")) });
    await user.click(await screen.findByRole("button", { name: /Nuevo paciente/ }));
    const dialog = screen.getByRole("dialog", { name: "Nuevo paciente" });
    await user.type(within(dialog).getByLabelText("Nombre completo *"), "Ana Pérez");
    await user.type(within(dialog).getByLabelText("Cédula *"), "52123456");
    await user.type(within(dialog).getByLabelText("Teléfono *"), "3001234567");
    await user.click(within(dialog).getByRole("button", { name: "Guardar paciente" }));

    expect(await within(dialog).findByText("Ya existe un paciente con esta cédula.")).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Guardar paciente" })).toBeEnabled();
  });

  it("cruce de horario (409) del servidor se muestra en el formulario de la cita", async () => {
    const user = userEvent.setup();
    renderApp(<Agenda />, { repository: rejecting("addAppointment", new ApiError(409, "Se cruza con la cita de Otra Persona (15:00 – 16:00).")) });
    await user.click(await screen.findByRole("button", { name: /Nueva cita/ }));
    const dialog = screen.getByRole("dialog", { name: "Nueva cita" });
    await user.type(within(dialog).getByLabelText("Paciente *"), "Alguien");
    await user.clear(within(dialog).getByLabelText("Hora inicio"));
    await user.type(within(dialog).getByLabelText("Hora inicio"), "15:00");
    await user.click(within(dialog).getByRole("button", { name: "Guardar cita" }));

    expect(await within(dialog).findByRole("alert")).toHaveTextContent("Se cruza con la cita de Otra Persona");
    expect(screen.getByRole("dialog", { name: "Nueva cita" })).toBeInTheDocument();
  });

  it("servidor caído al guardar (status 0) deja el formulario abierto con aviso", async () => {
    const user = userEvent.setup();
    renderApp(<Agenda />, { repository: rejecting("addAppointment", new ApiError(0, "No se pudo conectar con el servidor.")) });
    await user.click(await screen.findByRole("button", { name: /Nueva cita/ }));
    const dialog = screen.getByRole("dialog", { name: "Nueva cita" });
    await user.type(within(dialog).getByLabelText("Paciente *"), "Alguien");
    await user.clear(within(dialog).getByLabelText("Hora inicio"));
    await user.type(within(dialog).getByLabelText("Hora inicio"), "15:00");
    await user.click(within(dialog).getByRole("button", { name: "Guardar cita" }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent("No se pudo conectar con el servidor.");
  });

  it("abono rechazado (422) se muestra en el campo del valor", async () => {
    const user = userEvent.setup();
    renderApp(<Payments />, { repository: rejecting("addPayment", new ApiError(422, "El abono no puede superar el saldo pendiente ($ 350.000).")) });
    await user.click(await screen.findByRole("button", { name: /Registrar abono/ }));
    const dialog = screen.getByRole("dialog", { name: "Registrar abono" });
    await user.type(within(dialog).getByLabelText("Valor del abono (COP) *"), "100000");
    await user.type(within(dialog).getByLabelText("Firma de conformidad *"), "V. Cruz");
    await user.click(within(dialog).getByRole("button", { name: "Registrar abono" }));
    expect(await within(dialog).findByText(/no puede superar el saldo pendiente/)).toBeInTheDocument();
  });
});
