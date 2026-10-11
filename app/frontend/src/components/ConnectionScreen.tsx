import { useClinic } from "@/state/ClinicContext";
import { ToothIcon } from "./icons";

/** Pantalla completa mientras se cargan los datos o si el servidor no responde. */
export default function ConnectionScreen() {
  const { status, error, retry, continueInDemoMode } = useClinic();

  return (
    <div className="flex h-dvh w-screen items-center justify-center bg-surface p-4">
      <div className="card card-shadow w-full max-w-md px-7 py-8 text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-brand text-white">
          <ToothIcon size={24} />
        </div>
        <h1 className="text-lg font-extrabold text-slate-800">García Osorio</h1>

        {status === "loading" ? (
          <div role="status" aria-live="polite" className="mt-5">
            <div className="mx-auto size-8 animate-spin rounded-full border-[3px] border-slate-200 border-t-brand" />
            <p className="mt-3 text-sm text-slate-500">Cargando datos de la clínica…</p>
          </div>
        ) : (
          <div role="alert" className="mt-5">
            <p className="text-[15px] font-bold text-slate-800">No se pudo conectar con el servidor</p>
            <p className="mt-1 text-[13px] text-slate-500">
              {error ?? "El servidor no respondió."} Revisa que el backend y la base de datos estén encendidos
              (<code className="rounded bg-slate-100 px-1">./demo.sh start</code>).
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <button type="button" className="btn-blue justify-center py-2.5" onClick={retry}>Reintentar</button>
              <button type="button" className="btn-ghost justify-center py-2.5" onClick={continueInDemoMode}>
                Continuar en modo demostración
              </button>
              <p className="text-[11.5px] text-slate-400">
                El modo demostración usa datos de ejemplo en memoria: no se guardan al recargar.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
