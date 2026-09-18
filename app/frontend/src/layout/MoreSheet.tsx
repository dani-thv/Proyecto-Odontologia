import type { UserAccount } from "@/types";
import Modal from "@/components/Modal";
import { ClockIcon, LogOutIcon } from "@/components/icons";

interface Props {
  account: UserAccount;
  onLogout: () => void;
  onClose: () => void;
}

export default function MoreSheet({ account, onLogout, onClose }: Props) {
  const handleLogout = () => {
    onClose();
    onLogout();
  };

  return (
    <Modal variant="sheet" title="García Osorio" subtitle="Clínica Odontológica" onClose={onClose}>
      <p className="text-xs font-bold uppercase tracking-wide text-slate-600">Sesión activa</p>

      <div className="flex items-center gap-3 rounded-[10px] border border-brand/20 bg-brand-soft p-3">
        <span
          aria-hidden="true"
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold text-white shadow-sm"
        >
          {account.initials}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-bold text-slate-800">{account.name}</p>
          <p className="truncate text-xs font-semibold text-brand">{account.roleLabel}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={handleLogout}
        className="mt-3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 py-2.5 text-xs font-bold text-red-700 transition-colors hover:bg-red-100"
      >
        <LogOutIcon size={15} />
        <span>Cerrar sesión</span>
      </button>

      <div className="mt-4 rounded-[10px] border border-slate-200 bg-slate-50 p-3.5">
        <p className="mb-1.5 flex items-center gap-2 text-[12.5px] font-semibold text-slate-800">
          <ClockIcon size={15} className="text-brand" /> Horario de Atención
        </p>
        <p className="text-xs text-slate-500">Lunes a Viernes: 8:00 AM – 6:00 PM</p>
        <p className="text-xs text-slate-500">Sábados: 8:00 AM – 2:00 PM</p>
      </div>
    </Modal>
  );
}
