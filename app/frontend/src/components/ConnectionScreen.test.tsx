import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ApiError } from "@/api/http";
import { createLocalRepository } from "@/api/localRepository";
import type { ClinicRepository } from "@/api/repository";
import { renderApp } from "@/test/render";
import App from "@/App";

const offline = () => new ApiError(0, "No se pudo conectar con el servidor.");

function flakyRepo(failures: number): { repo: ClinicRepository; load: ReturnType<typeof vi.fn> } {
  const local = createLocalRepository();
  const load = vi.fn();
  for (let i = 0; i < failures; i++) load.mockRejectedValueOnce(offline());
  load.mockImplementation(() => local.load());
  return { repo: { ...local, load }, load };
}

describe("ConnectionScreen", () => {
  it("muestra 'cargando' y luego la app cuando el servidor responde", async () => {
    const { repo } = flakyRepo(0);
    renderApp(<App />, { route: "/inicio", repository: repo });
    expect(screen.getByText("Cargando datos de la clínica…")).toBeInTheDocument();
    expect(await screen.findByRole("heading", { level: 1, name: "Inicio" })).toBeInTheDocument();
  });

  it("si el servidor no responde, ofrece reintentar y recupera la app", async () => {
    const user = userEvent.setup();
    const { repo, load } = flakyRepo(1);
    renderApp(<App />, { route: "/inicio", repository: repo });

    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudo conectar con el servidor");
    await user.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(await screen.findByRole("heading", { level: 1, name: "Inicio" })).toBeInTheDocument();
    expect(load).toHaveBeenCalledTimes(2);
    expect(screen.queryByText("Modo demostración")).not.toBeInTheDocument();
  });

  it("permite continuar en modo demostración con datos de ejemplo en memoria", async () => {
    const user = userEvent.setup();
    const { repo } = flakyRepo(99);
    renderApp(<App />, { route: "/pacientes", repository: repo });

    await user.click(await screen.findByRole("button", { name: "Continuar en modo demostración" }));
    expect(await screen.findByRole("heading", { level: 1, name: "Pacientes" })).toBeInTheDocument();
    expect(screen.getByText("Modo demostración")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Total: 16/ })).toBeInTheDocument();
  });
});
