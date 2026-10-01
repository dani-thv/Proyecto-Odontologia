import type { ReactNode } from "react";
import Modal from "./Modal";

interface Props {
  title: string;
  children: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Confirmación destructiva (eliminar). El foco inicial queda en "Cancelar" por seguridad. */
export default function ConfirmDialog({ title, children, confirmLabel, onConfirm, onCancel }: Props) {
  return (
    <Modal
      title={title}
      titleClassName="text-red-600"
      maxWidth={380}
      onClose={onCancel}
      footer={
        <>
          <button type="button" className="btn-ghost" onClick={onCancel}>Cancelar</button>
          <button
            type="button"
            className="cursor-pointer rounded-[7px] border-0 bg-red-600 px-[18px] py-2 text-[13px] font-semibold text-white hover:bg-red-700"
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-sm text-slate-700">{children}</p>
    </Modal>
  );
}
