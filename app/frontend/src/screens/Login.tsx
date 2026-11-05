import { useState, type FormEvent } from "react";
import { useAccount } from "@/state/AccountContext";
import { ToothIcon } from "@/components/icons";

export default function Login() {
  const { login } = useAccount();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError("Ingresa usuario y contraseña.");
      return;
    }
    const success = login(username, password);
    if (!success) {
      setError("Credenciales incorrectas. Verifica usuario y contraseña.");
    } else {
      setError(null);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-[420px] rounded-2xl border border-slate-200 bg-white p-7 shadow-xl mobile:p-5">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex size-14 items-center justify-center rounded-2xl bg-brand text-white shadow-md shadow-brand/30">
            <ToothIcon size={28} stroke="white" />
          </div>
          <h1 className="text-xl font-black tracking-tight text-navy">García & Osorio</h1>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Clínica Odontológica
          </p>
          <div className="mt-2.5 rounded-full bg-brand-soft px-3 py-1 text-[11px] font-bold text-brand">
            Control de Acceso al Sistema
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <div>
            <label
              htmlFor="login-username"
              className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-600"
            >
              Usuario
            </label>
            <input
              id="login-username"
              type="text"
              autoFocus
              className="input w-full border-slate-300 bg-slate-50/50 py-2.5 text-sm font-medium focus:bg-white"
              placeholder="Nombre de usuario"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError(null);
              }}
              autoComplete="username"
            />
          </div>

          <div>
            <label
              htmlFor="login-password"
              className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-600"
            >
              Contraseña
            </label>
            <input
              id="login-password"
              type="password"
              className="input w-full border-slate-300 bg-slate-50/50 py-2.5 text-sm font-medium focus:bg-white"
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(null);
              }}
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="btn-orange mt-2 w-full justify-center py-2.5 text-sm font-bold shadow-md shadow-accent/20"
          >
            Iniciar sesión
          </button>
        </form>
      </div>
    </div>
  );
}
