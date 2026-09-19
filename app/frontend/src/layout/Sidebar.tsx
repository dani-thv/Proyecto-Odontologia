import { NavLink } from "react-router-dom";
import type { UserAccount } from "@/types";
import { LogOutIcon, ToothIcon } from "@/components/icons";
import { NAV } from "./nav";

interface Props {
  account: UserAccount;
  onLogout: () => void;
}

export default function Sidebar({ account, onLogout }: Props) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <ToothIcon size={18} stroke="white" />
        </div>
        <div className="sidebar-clinic">
          <div className="sidebar-clinic-name">García Osorio</div>
          <div className="sidebar-clinic-sub">Clínica Odontológica</div>
        </div>
      </div>

      <nav className="sidebar-nav" aria-label="Navegación principal">
        {NAV.map(({ path, label, Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/10 p-3">
        <div className="mb-2 flex items-center gap-2.5 px-2 py-1.5 text-white">
          <div className="sidebar-avatar shrink-0 font-bold">{account.initials}</div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-bold text-white">{account.name}</div>
            <div className="truncate text-[10.5px] text-slate-300">{account.roleLabel}</div>
          </div>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 transition-colors hover:border-red-400 hover:bg-red-500/20 hover:text-white"
          aria-label="Cerrar sesión"
        >
          <LogOutIcon size={14} />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
}
