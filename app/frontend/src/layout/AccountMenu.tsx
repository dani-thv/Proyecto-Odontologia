import type { UserAccount } from "@/types";
import { LogOutIcon } from "@/components/icons";

interface Props {
  account: UserAccount;
  onLogout: () => void;
  onClose: () => void;
}

export default function AccountMenu({ account, onLogout, onClose }: Props) {
  return (
    <>
      <div className="fixed inset-0 z-[99]" onClick={onClose} aria-hidden="true" />
      <div className="account-dropdown-menu" role="menu" aria-label="Menú de usuario">
        <div className="account-dropdown-header">Usuario conectado</div>
        <div className="px-3 py-2">
          <div className="text-xs font-bold text-slate-800">{account.name}</div>
          <div className="text-[11px] text-slate-500">{account.roleLabel}</div>
        </div>
        <div className="border-t border-slate-100 p-1">
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
            onClick={() => {
              onClose();
              onLogout();
            }}
          >
            <LogOutIcon size={14} />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </div>
    </>
  );
}
