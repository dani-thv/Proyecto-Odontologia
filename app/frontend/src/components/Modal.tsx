import { useId, useRef } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { CloseIcon } from "./icons";

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  /** `sheet` = hoja inferior para móvil. */
  variant?: "modal" | "sheet";
  subtitle?: string;
  maxWidth?: number;
  titleClassName?: string;
}

/** Diálogo accesible: role="dialog", foco atrapado, Escape y clic fuera para cerrar. */
export default function Modal({
  title, onClose, children, footer, variant = "modal", subtitle, maxWidth, titleClassName,
}: ModalProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, onClose);

  const isSheet = variant === "sheet";

  return createPortal(
    <div
      className={isSheet ? "bottom-sheet-overlay" : "modal-overlay"}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={isSheet ? "bottom-sheet" : "modal"}
        style={maxWidth ? { maxWidth } : undefined}
      >
        {isSheet && <div className="bottom-sheet-handle" />}
        <div className={isSheet ? "bottom-sheet-header" : "modal-header"}>
          <div>
            <h2
              id={titleId}
              className={isSheet ? "text-[15px] font-bold text-slate-800" : `modal-title ${titleClassName ?? ""}`}
            >
              {title}
            </h2>
            {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
          </div>
          <button type="button" className="btn-ghost border-0 px-2 py-1" onClick={onClose} aria-label="Cerrar">
            <CloseIcon size={isSheet ? 18 : 16} />
          </button>
        </div>
        <div className={isSheet ? "bottom-sheet-content" : "modal-body"}>{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
