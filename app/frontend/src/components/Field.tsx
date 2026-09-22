import { useId } from "react";
import type { ReactElement, ReactNode } from "react";
import { cloneElement } from "react";

interface FieldProps {
  label: string;
  error?: string | null;
  hint?: ReactNode;
  /** Un solo control (input/select) al que se le inyecta el `id` para asociar la etiqueta. */
  children: ReactElement<{ id?: string; "aria-invalid"?: boolean; "aria-describedby"?: string }>;
}

/** Etiqueta asociada por `htmlFor` al control, con mensaje de error accesible. */
export default function Field({ label, error, hint, children }: FieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  return (
    <div>
      <label className="form-label" htmlFor={id}>{label}</label>
      {cloneElement(children, {
        id,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": error ? errorId : undefined,
      })}
      {hint && !error && <p className="mt-1 text-[11px] text-slate-400">{hint}</p>}
      {error && (
        <p id={errorId} role="alert" className="mt-1 text-xs font-semibold text-red-600">{error}</p>
      )}
    </div>
  );
}
