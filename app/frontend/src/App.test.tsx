import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { setMobileViewport } from "@/test/setup";
import { renderApp } from "@/test/render";
import App from "./App";

describe("App", () => {
  it("redirige / a la agenda y marca la navegación activa", () => {
    renderApp(<App />, { route: "/" });
    expect(screen.getByRole("heading", { level: 1, name: "Agenda" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Agenda" })).toHaveAttribute("aria-current", "page");
    expect(document.title).toBe("Agenda · García Osorio");
  });

  it("navega entre pantallas por URL y por el menú", async () => {
    const user = userEvent.setup();
    renderApp(<App />, { route: "/inicio" });
    expect(screen.getByRole("heading", { level: 1, name: "Inicio" })).toBeInTheDocument();
    await user.click(screen.getByRole("link", { name: "Pacientes" }));
    expect(screen.getByRole("heading", { level: 1, name: "Pacientes" })).toBeInTheDocument();
    await user.click(screen.getByRole("link", { name: "Pagos" }));
    expect(screen.getByRole("heading", { level: 1, name: "Pagos" })).toBeInTheDocument();
    expect(document.title).toBe("Pagos · García Osorio");
  });

  it("las citas creadas persisten al cambiar de pantalla", async () => {
    const user = userEvent.setup();
    renderApp(<App />, { route: "/agenda" });
    await user.click(screen.getByRole("button", { name: /Nueva cita/ }));
    await user.type(screen.getByLabelText("Paciente *"), "Persistente");
    await user.clear(screen.getByLabelText("Hora inicio"));
    await user.type(screen.getByLabelText("Hora inicio"), "16:00");
    await user.click(screen.getByRole("button", { name: "Guardar cita" }));
    await user.click(screen.getByRole("link", { name: "Inicio" }));
    await user.click(screen.getByRole("link", { name: "Agenda" }));
    expect(screen.getAllByRole("button", { name: /Persistente/ }).length).toBeGreaterThan(0);
  });

  it("el botón Nueva cita del dashboard abre el formulario en la agenda", async () => {
    const user = userEvent.setup();
    renderApp(<App />, { route: "/inicio" });
    await user.click(screen.getByRole("button", { name: /Nueva cita/ }));
    expect(screen.getByRole("dialog", { name: "Nueva cita" })).toBeInTheDocument();
  });

  it("permite cerrar sesión y volver a la pantalla de login", async () => {
    const user = userEvent.setup();
    renderApp(<App />, { route: "/agenda" });
    expect(screen.getByText("Merlin")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cerrar sesión" }));
    expect(screen.getByRole("button", { name: "Iniciar sesión" })).toBeInTheDocument();
  });

  it("en móvil usa la barra inferior", () => {
    setMobileViewport(true);
    renderApp(<App />, { route: "/inicio" });
    expect(screen.getAllByRole("navigation", { name: "Navegación principal" }).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Más opciones" })).toBeInTheDocument();
  });
});
