import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { MemoryRouter } from "react-router-dom";
import { createLocalRepository } from "@/api/localRepository";
import type { ClinicRepository } from "@/api/repository";
import { ClinicProvider } from "@/state/ClinicContext";
import type { ClinicState } from "@/state/ClinicContext";
import { ToastProvider } from "@/components/Toast";

interface Options {
  route?: string;
  /** Datos de partida (por defecto, los de ejemplo). */
  initial?: Partial<ClinicState>;
  /** Repositorio propio; si se pasa, la app arranca en "cargando" como en producción. */
  repository?: ClinicRepository;
}

/** Renderiza con repositorio en memoria y datos ya cargados, salvo que se pase `repository`. */
export function renderApp(ui: ReactElement, opts: Options = {}) {
  const local = opts.repository ? undefined : createLocalRepository(opts.initial);
  return render(
    <MemoryRouter initialEntries={[opts.route ?? "/"]}>
      <ClinicProvider repository={opts.repository ?? local} initialData={local?.snapshot()}>
        <ToastProvider>{ui}</ToastProvider>
      </ClinicProvider>
    </MemoryRouter>,
  );
}
