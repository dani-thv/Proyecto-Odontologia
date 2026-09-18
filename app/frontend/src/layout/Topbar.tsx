import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { UserAccount } from "@/types";
import { BellIcon, LogOutIcon } from "@/components/icons";

interface Props {
  title: string;
  date: string;
  account: UserAccount;
  onLogout: () => void;
  pendingReminders: number;
  /** Sin servidor: los datos son de ejemplo y no se guardan. */
  demoMode?: boolean;
}

export default function Topbar({
  title,
  date,
  account,
  onLogout,
  pendingReminders,
  demoMode,
}: Props) {
  const navigate = useNavigate();
  const [confirmLogout, setConfirmLogout] = useState(false);

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="topbar-page-block">
          <h1 className="topbar-page">{title}</h1>
          <span className="topbar-date">{date}</span>
        </div>
      </div>

      <div className="topbar-right">
        {demoMode && (
          <span
            className="hidden rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700 min-[560px]:inline"
            title="No hay conexión con el servidor: los cambios no se guardan"
          >
            Modo demostración
          </span>
        )}

        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 py-1 pl-1.5 pr-3"
            title={`Usuario: ${account.name} (${account.roleLabel})`}
          >
            <div className="account-avatar size-7 text-xs font-bold">{account.initials}</div>
            <div className="account-info text-left">
              <span className="account-name font-bold text-slate-800">{account.name}</span>
              <span className="account-role text-[10.5px] font-semibold text-brand">
                {account.roleLabel}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-700"
            onClick={onLogout}
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
          >
            <LogOutIcon size={14} />
            <span className="hidden sm:inline">Cerrar sesión</span>
          </button>
        </div>

        <button
          type="button"
          className="topbar-bell border-0 bg-transparent"
          aria-label={
            pendingReminders > 0
              ? `Notificaciones: ${pendingReminders} recordatorios por confirmar`
              : "Notificaciones: sin pendientes"
          }
          onClick={() => navigate("/inicio")}
        >
          <BellIcon size={20} strokeWidth={1.8} />
          {/* Notificaciones */}
        </button>
      </div>
    </header>
  );
}
