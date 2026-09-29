import { useRef, useState } from "react";
import type { DragEvent, KeyboardEvent } from "react";
import type { Appointment, DoctorId, PendingPatient } from "@/types";
import { DOCTORS } from "@/constants/doctors";
import { STATUS, STATUS_ORDER } from "@/constants/status";
import { DEMO_TODAY } from "@/data/demo";
import { DAY_NAMES, formatWeekRange, parseISODate } from "@/utils/dates";
import { formatTime } from "@/utils/format";
import { OPEN_HOUR } from "@/utils/schedule";
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from "@/components/icons";
import PendingList from "./PendingList";
import { SLOTS, SLOT_H, SLOT_MIN, gridColumns, heightPx, isClosedSlot, topPx } from "./layout";

const CLOSED_BG =
  "bg-[repeating-linear-gradient(45deg,#f8fafc,#f8fafc_6px,#f1f5f9_6px,#f1f5f9_12px)] cursor-not-allowed";

interface Props {
  weekStart: string;
  weekDates: string[];
  doctorId: DoctorId;
  onDoctorChange: (id: DoctorId) => void;
  appointments: Appointment[];
  pending: PendingPatient[];
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
  onNew: () => void;
  onCreateAt: (date: string, slotIndex: number) => void;
  onEdit: (id: string) => void;
  onReschedule: (p: PendingPatient) => void;
  onMove: (id: string, date: string, hour: number, min: number) => void | Promise<void>;
  onDropPending: (p: PendingPatient, date: string, hour: number, min: number) => void | Promise<void>;
}

export default function DesktopAgenda(props: Props) {
  const {
    weekStart, weekDates, doctorId, onDoctorChange, appointments, pending,
    onPrevWeek, onNextWeek, onToday, onNew, onCreateAt, onEdit, onReschedule, onMove, onDropPending,
  } = props;

  const draggingId = useRef<string | null>(null);
  const draggingPending = useRef<PendingPatient | null>(null);
  const dragOffsetMin = useRef(0);
  const [dragOver, setDragOver] = useState<{ date: string; slot: number } | null>(null);
  const [draggingVisual, setDraggingVisual] = useState<string | null>(null);

  const endDrag = () => {
    draggingId.current = null;
    draggingPending.current = null;
    setDraggingVisual(null);
    setDragOver(null);
  };

  const onApptDragStart = (e: DragEvent, a: Appointment) => {
    draggingId.current = a.id;
    draggingPending.current = null;
    setDraggingVisual(a.id);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    dragOffsetMin.current = Math.floor((e.clientY - rect.top) / SLOT_H) * SLOT_MIN;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", a.id);
  };

  const onPendingDragStart = (e: DragEvent, p: PendingPatient) => {
    draggingPending.current = p;
    draggingId.current = null;
    dragOffsetMin.current = 0;
    e.dataTransfer.effectAllowed = "copyMove";
    e.dataTransfer.setData("application/json", JSON.stringify(p));
  };

  const onCellDrop = (e: DragEvent, date: string, slotIndex: number) => {
    e.preventDefault();
    const rawMin = OPEN_HOUR * 60 + slotIndex * SLOT_MIN - dragOffsetMin.current;
    const snapped = Math.max(OPEN_HOUR * 60, Math.round(rawMin / SLOT_MIN) * SLOT_MIN);
    const hour = Math.floor(snapped / 60);
    const min = snapped % 60;

    const pendingPatient = draggingPending.current;
    const apptId = draggingId.current ?? e.dataTransfer.getData("text/plain");
    endDrag();

    if (pendingPatient) onDropPending(pendingPatient, date, hour, min);
    else if (apptId) onMove(apptId, date, hour, min);
  };

  const onApptKeyDown = (e: KeyboardEvent, id: string) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onEdit(id);
    }
  };

  const doctorName = DOCTORS.find((d) => d.id === doctorId)?.name ?? "";

  return (
    <div className="flex h-[calc(100dvh-104px)] w-full gap-4">
      <div className="flex min-w-0 flex-1 flex-col">
        <div role="tablist" aria-label="Filtrar agenda por doctor" className="mb-3.5 flex gap-2 overflow-x-auto pb-1.5">
          {DOCTORS.map((d) => (
            <button
              key={d.id}
              type="button"
              role="tab"
              aria-selected={doctorId === d.id}
              className={`doc-tab shrink-0${doctorId === d.id ? " active" : ""}`}
              onClick={() => onDoctorChange(d.id)}
            >
              {d.label}
            </button>
          ))}
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-2.5">
          <button type="button" className="btn-ghost border-0 bg-transparent px-2 py-1.5" aria-label="Semana anterior" onClick={onPrevWeek}>
            <ChevronLeftIcon size={15} strokeWidth={2.2} className="text-slate-500" />
          </button>
          <span className="text-sm font-bold text-slate-800" aria-live="polite">{formatWeekRange(weekStart)}</span>
          <button type="button" className="btn-ghost border-0 bg-transparent px-2 py-1.5" aria-label="Semana siguiente" onClick={onNextWeek}>
            <ChevronRightIcon size={15} strokeWidth={2.2} className="text-slate-500" />
          </button>
          <button type="button" className="ml-1 cursor-pointer border-0 bg-transparent p-0 font-[inherit] text-[13px] font-semibold text-brand" onClick={onToday}>
            Hoy
          </button>
          <button type="button" className="btn-orange ml-auto" onClick={onNew}>
            <PlusIcon size={13} strokeWidth={2.5} /> Nueva cita
          </button>
        </div>

        <div className="card card-shadow flex flex-1 flex-col overflow-hidden">
          <div className="grid shrink-0 border-b border-slate-200 bg-white" style={{ gridTemplateColumns: gridColumns }}>
            <div className="border-r border-slate-200" />
            {weekDates.map((date, i) => {
              const isToday = date === DEMO_TODAY;
              return (
                <div key={date} className={`px-2 py-3 text-center ${i < 5 ? "border-r border-slate-200" : ""} ${isToday ? "bg-brand" : ""}`}>
                  <p className={`mb-1 text-xs font-semibold ${isToday ? "text-white/85" : "text-slate-400"}`}>{DAY_NAMES[i]}</p>
                  <p className={`text-base font-bold ${isToday ? "text-white" : "text-slate-800"}`}>{parseISODate(date).getDate()}</p>
                </div>
              );
            })}
          </div>

          <div className="agenda-calendar relative flex-1 overflow-auto">
            <div className="relative grid" style={{ gridTemplateColumns: gridColumns, minHeight: SLOTS.length * SLOT_H }}>
              <div className="sticky left-0 z-[5] border-r border-slate-200 bg-white">
                {SLOTS.map((s) => (
                  <div key={s.index} className="flex items-start justify-end border-b border-slate-100 pr-3 pt-0.5" style={{ height: SLOT_H }}>
                    <span className="whitespace-nowrap text-xs font-medium text-slate-400">{s.label}</span>
                  </div>
                ))}
              </div>

              {weekDates.map((date, i) => {
                const column = appointments.filter((a) => a.date === date);
                return (
                  <div
                    key={date}
                    className={`relative ${i < 5 ? "border-r border-slate-200" : ""} ${date === DEMO_TODAY ? "bg-brand/[0.02]" : "bg-white"}`}
                    style={{ minWidth: 140 }}
                  >
                    {SLOTS.map((s) => {
                      const closed = isClosedSlot(date, s);
                      const isOver = dragOver?.date === date && dragOver.slot === s.index;
                      return (
                        // Las celdas vacías son un atajo con el mouse; el teclado usa el botón "Nueva cita".
                        <div
                          key={s.index}
                          className={`border-b border-slate-100 transition-colors ${
                            closed ? CLOSED_BG : "cursor-pointer"
                          } ${isOver ? "bg-brand/10 outline-2 -outline-offset-2 outline-dashed outline-brand" : ""}`}
                          style={{ height: SLOT_H }}
                          title={closed ? "Fuera del horario de atención" : "Haz clic para agendar una cita o arrastra un widget aquí"}
                          onDragOver={(e) => {
                            if (closed) return;
                            e.preventDefault();
                            e.dataTransfer.dropEffect = "move";
                            setDragOver({ date, slot: s.index });
                          }}
                          onDragLeave={() => setDragOver(null)}
                          onDrop={(e) => !closed && onCellDrop(e, date, s.index)}
                          onClick={() => !closed && onCreateAt(date, s.index)}
                        />
                      );
                    })}

                    {column.map((a) => {
                      const st = STATUS[a.status];
                      const h = heightPx(a.durationMin);
                      return (
                        <div
                          key={a.id}
                          role="button"
                          tabIndex={0}
                          aria-label={`${a.patient}, ${a.treatment || "sin tratamiento"}, ${formatTime(a.startHour, a.startMin)}, ${st.label}. Enter para editar`}
                          draggable
                          onDragStart={(e) => { e.stopPropagation(); onApptDragStart(e, a); }}
                          onDragEnd={endDrag}
                          onClick={(e) => { e.stopPropagation(); onEdit(a.id); }}
                          onKeyDown={(e) => onApptKeyDown(e, a.id)}
                          className="absolute inset-x-1.5 z-10 cursor-grab select-none overflow-hidden rounded-md px-2.5 py-2 shadow-sm transition-[box-shadow,opacity]"
                          style={{
                            top: topPx(a.startHour, a.startMin),
                            height: Math.max(h - 3, 36),
                            background: st.bg,
                            borderLeft: `4px solid ${st.border}`,
                            opacity: draggingVisual === a.id ? 0.35 : 1,
                          }}
                        >
                          <p className="mb-0.5 text-[13px] font-bold leading-snug" style={{ color: st.text }}>{a.patient}</p>
                          {h > 45 && <p className="text-[11.5px] leading-snug opacity-90" style={{ color: st.text }}>{a.treatment}</p>}
                          <span className="absolute bottom-1 right-2 whitespace-nowrap text-[10px] opacity-60" style={{ color: st.text }}>
                            {formatTime(a.startHour, a.startMin)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-4 border-t border-slate-200 bg-white px-4 py-3">
            {STATUS_ORDER.map((s) => (
              <div key={s} className="flex items-center gap-1.5">
                <span aria-hidden="true" className="size-3 rounded-[3px]" style={{ background: STATUS[s].bg, border: `1px solid ${STATUS[s].border}` }} />
                <span className="text-xs text-slate-500">{STATUS[s].label}</span>
              </div>
            ))}
            <span className="ml-auto text-[11.5px] text-slate-400">💡 Arrastra cualquier cita para reorganizar la agenda de {doctorName}</span>
          </div>
        </div>
      </div>

      <aside className="flex w-[260px] min-w-[240px] shrink-0 flex-col" aria-labelledby="pending-title">
        <div className="card card-shadow flex flex-1 flex-col overflow-hidden">
          <div className="border-b border-slate-200 px-4 pb-3 pt-4">
            <h2 id="pending-title" className="text-sm font-bold text-slate-800">Pendientes de reagendar</h2>
            <p className="mt-0.5 text-xs text-slate-500">{pending.length} pacientes</p>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            <PendingList pending={pending} variant="aside" onReschedule={onReschedule} onDragStart={onPendingDragStart} onDragEnd={endDrag} />
          </div>
        </div>
      </aside>
    </div>
  );
}
