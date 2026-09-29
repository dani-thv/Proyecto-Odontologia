import { useState } from "react";
import type { Appointment, DoctorId } from "@/types";
import { DOCTORS } from "@/constants/doctors";
import { STATUS } from "@/constants/status";
import { DAY_NAMES, formatWeekRange, parseISODate } from "@/utils/dates";
import { formatTime } from "@/utils/format";
import { formatTimeRange } from "@/utils/schedule";
import { ChevronLeftIcon, ChevronRightIcon, ClockIcon, PlusIcon } from "@/components/icons";
import { SLOTS, SLOT_H, gridColumns, heightPx, isClosedSlot, topPx } from "./layout";

interface Props {
  weekStart: string;
  weekDates: string[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  doctorId: DoctorId;
  onDoctorChange: (id: DoctorId) => void;
  appointments: Appointment[];
  pendingCount: number;
  onOpenPending: () => void;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onNew: () => void;
  onCreateAt: (date: string, slotIndex: number) => void;
  onEdit: (id: string) => void;
}

export default function MobileAgenda(props: Props) {
  const {
    weekStart, weekDates, selectedDate, onSelectDate, doctorId, onDoctorChange, appointments,
    pendingCount, onOpenPending, onPrevWeek, onNextWeek, onNew, onCreateAt, onEdit,
  } = props;
  const [view, setView] = useState<"day" | "week">("day");

  const tab = (id: "day" | "week", label: string) => (
    <button
      type="button"
      aria-pressed={view === id}
      onClick={() => setView(id)}
      className={`cursor-pointer rounded-md border-0 px-2 py-[3px] text-[11px] font-bold ${view === id ? "bg-white text-brand" : "bg-transparent text-slate-500"}`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex h-full w-full flex-col">
      <div className="mb-1 flex items-center justify-center gap-1">
        <button type="button" className="btn-ghost border-0 bg-transparent px-2 py-1" aria-label="Semana anterior" onClick={onPrevWeek}>
          <ChevronLeftIcon size={15} strokeWidth={2.2} />
        </button>
        <span className="text-[13px] font-bold text-slate-800" aria-live="polite">{formatWeekRange(weekStart)}</span>
        <button type="button" className="btn-ghost border-0 bg-transparent px-2 py-1" aria-label="Semana siguiente" onClick={onNextWeek}>
          <ChevronRightIcon size={15} strokeWidth={2.2} />
        </button>
      </div>

      <div className="day-strip">
        {weekDates.map((date, i) => {
          const hasAppts = appointments.some((a) => a.date === date);
          const dayNum = parseISODate(date).getDate();
          return (
            <button
              key={date}
              type="button"
              className={`day-pill${selectedDate === date ? " active" : ""}`}
              onClick={() => onSelectDate(date)}
              aria-label={`${DAY_NAMES[i]} ${dayNum}`}
              aria-pressed={selectedDate === date}
            >
              <span className="day-pill-name">{DAY_NAMES[i]}</span>
              <span className="day-pill-date">{dayNum}</span>
              {hasAppts && <span className="day-pill-dot" />}
            </button>
          );
        })}
      </div>

      <div className="mb-2.5 mt-1.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <select
            className="input h-8 max-w-[150px] border-slate-300 bg-white px-2 py-1 text-xs font-semibold"
            aria-label="Doctor"
            value={doctorId}
            onChange={(e) => onDoctorChange(e.target.value as DoctorId)}
          >
            {DOCTORS.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
          </select>
          <div className="inline-flex rounded-lg bg-slate-200 p-0.5" role="group" aria-label="Vista">
            {tab("day", "Día")}
            {tab("week", "Semana")}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onOpenPending}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border-[1.5px] border-brand bg-blue-50 px-2.5 py-1 font-[inherit] text-xs font-bold text-brand"
          >
            <span>⏳ Pendientes</span>
            <span className="rounded-full bg-brand px-1.5 py-px text-[10px] font-extrabold text-white">{pendingCount}</span>
          </button>
          <button type="button" className="btn-orange h-[30px] px-2.5 py-1 text-xs" onClick={onNew}>
            <PlusIcon size={12} strokeWidth={2.5} /> <span>Cita</span>
          </button>
        </div>
      </div>

      {view === "day" ? (
        <div className="card card-shadow flex-1 overflow-y-auto bg-white px-2.5 pb-10 pt-2.5">
          <div className="flex flex-col gap-1">
            {SLOTS.map((s) => {
              const closed = isClosedSlot(selectedDate, s);
              const starting = appointments.filter((a) => a.date === selectedDate && a.startHour === s.hour && a.startMin === s.min);
              return (
                <div key={s.index} className="flex min-h-[46px] items-stretch gap-2.5">
                  <div className="w-11 shrink-0 pt-1 text-right text-[11.5px] font-semibold text-slate-400">{s.label}</div>
                  <div className="flex-1 border-t border-slate-100 pb-1 pt-0.5">
                    {starting.length > 0 ? (
                      starting.map((a) => {
                        const st = STATUS[a.status];
                        return (
                          <button
                            key={a.id}
                            type="button"
                            onClick={() => onEdit(a.id)}
                            className="mb-1 block w-full cursor-pointer rounded-lg px-2.5 py-2 text-left font-[inherit] shadow-sm"
                            style={{ background: st.bg, border: `1px solid ${st.border}35`, borderLeft: `4px solid ${st.border}` }}
                          >
                            <span className="flex items-start justify-between gap-1.5">
                              <span className="text-[13.5px] font-bold leading-tight" style={{ color: st.text }}>{a.patient}</span>
                              <span className="rounded bg-white/85 px-1.5 py-0.5 text-[10px] font-bold" style={{ color: st.text }}>{st.label}</span>
                            </span>
                            <span className="mt-0.5 block text-[11.5px] text-slate-600">{a.treatment}</span>
                            <span className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500">
                              <span className="inline-flex items-center gap-1"><ClockIcon size={11} /> {formatTimeRange(a)} ({a.durationMin} min)</span>
                              <span className="font-semibold text-brand">Detalles ›</span>
                            </span>
                          </button>
                        );
                      })
                    ) : closed ? (
                      <div className="flex h-full min-h-9 items-center pl-2 text-[11px] text-slate-300">Cerrado</div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onCreateAt(selectedDate, s.index)}
                        className="flex h-full min-h-9 w-full cursor-pointer items-center rounded-md border-0 bg-transparent pl-2 text-left font-[inherit] text-[11.5px] text-slate-300 hover:bg-slate-50"
                        aria-label={`Agendar a las ${formatTime(s.hour, s.min)}`}
                      >
                        <span className="opacity-70">+ Agendar horario</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="card card-shadow flex flex-1 flex-col overflow-hidden">
          <div className="agenda-calendar relative flex-1 overflow-auto">
            <div className="relative grid min-w-[700px]" style={{ gridTemplateColumns: gridColumns, minHeight: SLOTS.length * SLOT_H }}>
              <div className="sticky left-0 z-[5] border-r border-slate-200 bg-white">
                {SLOTS.map((s) => (
                  <div key={s.index} className="flex items-start justify-end border-b border-slate-100 pr-2.5 pt-0.5" style={{ height: SLOT_H }}>
                    <span className="text-[11px] font-medium text-slate-400">{s.label}</span>
                  </div>
                ))}
              </div>
              {weekDates.map((date, i) => (
                <div key={date} className={`relative min-w-[140px] ${i < 5 ? "border-r border-slate-200" : ""}`}>
                  {SLOTS.map((s) => {
                    const closed = isClosedSlot(date, s);
                    return (
                      <div
                        key={s.index}
                        className={`border-b border-slate-100 ${closed ? "bg-slate-50" : "cursor-pointer"}`}
                        style={{ height: SLOT_H }}
                        onClick={() => !closed && onCreateAt(date, s.index)}
                      />
                    );
                  })}
                  {appointments.filter((a) => a.date === date).map((a) => {
                    const st = STATUS[a.status];
                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => onEdit(a.id)}
                        className="absolute inset-x-1 z-10 cursor-pointer overflow-hidden rounded-md border-0 px-2 py-1.5 text-left font-[inherit] shadow-sm"
                        style={{
                          top: topPx(a.startHour, a.startMin),
                          height: Math.max(heightPx(a.durationMin) - 3, 34),
                          background: st.bg,
                          borderLeft: `3px solid ${st.border}`,
                        }}
                      >
                        <span className="block text-xs font-bold leading-tight" style={{ color: st.text }}>{a.patient}</span>
                        <span className="block text-[10.5px] text-slate-500">{a.treatment}</span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
