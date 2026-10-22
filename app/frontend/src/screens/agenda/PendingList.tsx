import type { DragEvent } from "react";
import type { PendingPatient } from "@/types";
import { DEMO_TODAY } from "@/data/demo";
import { formatRelative } from "@/utils/dates";
import { telHref, whatsappHref } from "@/utils/format";
import { PhoneIcon } from "@/components/icons";

interface Props {
  pending: PendingPatient[];
  variant: "aside" | "sheet";
  onReschedule: (p: PendingPatient) => void;
  /** Texto del botón en la hoja móvil, por ejemplo "Agendar para Vie 18". */
  rescheduleLabel?: string;
  onDragStart?: (e: DragEvent, p: PendingPatient) => void;
  onDragEnd?: () => void;
}

export default function PendingList({ pending, variant, onReschedule, rescheduleLabel, onDragStart, onDragEnd }: Props) {
  if (pending.length === 0) {
    return <p className="px-2.5 py-8 text-center text-[13px] text-slate-400">No hay pacientes pendientes por reagendar</p>;
  }

  if (variant === "aside") {
    return (
      <ul className="flex flex-col gap-2.5">
        {pending.map((p) => (
          <li
            key={p.id}
            draggable
            onDragStart={(e) => onDragStart?.(e, p)}
            onDragEnd={onDragEnd}
            title="Arrastra este paciente a un horario del calendario para agendar"
            className="cursor-grab rounded-[10px] border border-l-4 border-slate-200 border-l-green-600 bg-white px-4 py-3.5"
          >
            <p className="mb-0.5 text-[13.5px] font-bold text-slate-800">{p.name}</p>
            <p className="mb-2 text-xs text-slate-500">{p.treatment}</p>
            <p className="mb-2 flex items-center gap-1.5 text-[11.5px] text-slate-500">
              <PhoneIcon size={13} /> {p.phone}
            </p>
            <p className="mb-2.5 text-[11px] text-slate-400">{formatRelative(p.requestedOn, DEMO_TODAY)}</p>
            <button
              type="button"
              className="btn-blue w-full justify-center rounded-[7px] py-2 text-[12.5px]"
              onClick={() => onReschedule(p)}
              aria-label={`Reagendar a ${p.name}`}
            >
              Reagendar
            </button>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className="flex flex-col gap-2.5">
      {pending.map((p) => (
        <li key={p.id} className="rounded-[10px] border border-l-4 border-slate-200 border-l-green-600 bg-white px-4 py-3.5 shadow-sm">
          <div className="mb-1 flex items-start justify-between">
            <h3 className="text-sm font-bold text-slate-800">{p.name}</h3>
            <span className="text-[11px] text-slate-400">{formatRelative(p.requestedOn, DEMO_TODAY)}</span>
          </div>
          <p className="mb-2 text-[12.5px] text-slate-500">{p.treatment}</p>
          <p className="mb-3 flex items-center gap-1.5 text-xs text-slate-600"><PhoneIcon size={13} /> {p.phone}</p>
          <div className="flex gap-2">
            <button type="button" className="btn-blue flex-1 justify-center rounded-lg px-3 py-2 text-[12.5px]" onClick={() => onReschedule(p)}>
              📅 {rescheduleLabel ?? "Agendar"}
            </button>
            <a href={telHref(p.phone)} className="btn-ghost rounded-lg px-3 py-2 text-slate-800 no-underline" aria-label={`Llamar a ${p.name}`}>📞</a>
            <a href={whatsappHref(p.phone)} target="_blank" rel="noreferrer" className="btn-ghost rounded-lg px-3 py-2 text-green-600 no-underline" aria-label={`WhatsApp a ${p.name}`}>💬</a>
          </div>
        </li>
      ))}
    </ul>
  );
}
