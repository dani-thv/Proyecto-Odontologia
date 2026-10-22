import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useClinic } from "@/state/ClinicContext";
import { useAccount } from "@/state/AccountContext";
import { useToast } from "@/components/Toast";
import { messageOf } from "@/api/http";
import { useIsMobile } from "@/hooks/useIsMobile";
import { DEMO_TODAY } from "@/data/demo";
import { DOCTORS, doctorById } from "@/constants/doctors";
import { addDays, formatLongDate } from "@/utils/dates";
import { formatTime, whatsappHref } from "@/utils/format";
import { toMinutes } from "@/utils/schedule";
import StatusBadge from "@/components/StatusBadge";
import { CheckIcon, PlusIcon } from "@/components/icons";

interface StatCardProps {
  value: number;
  valueColor: string;
  dotColor: string;
  aside?: string;
  asideColor?: string;
  title: string;
  caption: string;
}

function StatCard({ value, valueColor, dotColor, aside, asideColor = "text-slate-500", title, caption }: StatCardProps) {
  return (
    <div className="card card-shadow relative px-5 py-[18px] mobile:px-3.5 mobile:py-3">
      <span aria-hidden="true" className={`absolute right-3 top-3 size-2 rounded-full ${dotColor}`} />
      <div className="flex items-baseline gap-1.5">
        <span className={`text-3xl font-extrabold leading-none mobile:text-2xl ${valueColor}`}>{value}</span>
        {aside && <span className={`text-xs mobile:text-[11px] ${asideColor}`}>{aside}</span>}
      </div>
      <p className="mt-1 text-[13px] font-bold text-slate-800 mobile:text-xs">{title}</p>
      <p className="mt-0.5 truncate text-[10.5px] text-slate-400">{caption}</p>
    </div>
  );
}

export default function Dashboard() {
  const { appointments, patients, reminders, confirmReminder, dismissReminder } = useClinic();
  const account = useAccount();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const toast = useToast();
  const run = (action: Promise<unknown>) => action.catch((e) => toast(messageOf(e), "error"));

  const stats = useMemo(() => {
    const tomorrow = addDays(DEMO_TODAY, 1);
    const active = appointments.filter((a) => a.status !== "cancelled");
    const today = active
      .filter((a) => a.date === DEMO_TODAY)
      .sort((a, b) => toMinutes(a.startHour, a.startMin) - toMinutes(b.startHour, b.startMin));
    const tomorrowAppts = active.filter((a) => a.date === tomorrow);
    const byDoctor = DOCTORS.map((d) => ({ name: d.name, count: today.filter((a) => a.doctorId === d.id).length }))
      .filter((d) => d.count > 0)
      .map((d) => `${d.name} (${d.count})`)
      .join(" · ");
    return {
      today,
      urgent: today.filter((a) => a.status === "urgent").length,
      byDoctor,
      tomorrowTotal: tomorrowAppts.length,
      tomorrowConfirmed: tomorrowAppts.filter((a) => a.status === "confirmed").length,
      toConfirm: active.filter((a) => a.status === "pending" && a.date >= DEMO_TODAY).length,
    };
  }, [appointments]);

  const reminderRows = reminders.flatMap((r) => {
    const appointment = appointments.find((a) => a.id === r.appointmentId);
    return appointment ? [{ reminder: r, appointment }] : [];
  });
  const remindersLeft = reminderRows.filter((r) => r.reminder.status === "pending").length;

  const newAppointment = () => navigate("/agenda?nueva=1");

  return (
    <div className="fade-in w-full mobile:pb-5">
      <div className="mb-5 flex w-full flex-wrap items-center justify-between gap-2 mobile:mb-3.5">
        <div>
          <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-slate-800 mobile:text-xl">
            ¡Buenos días, {account.name}!
          </h1>
          <p className="mt-0.5 text-sm text-slate-500 mobile:text-[13px]">
            Hoy hay <strong className="font-bold text-slate-800">{stats.today.length} {stats.today.length === 1 ? "cita" : "citas"}</strong> programadas
          </p>
        </div>
        {!isMobile && (
          <button type="button" className="btn-orange shrink-0" onClick={newAppointment}>
            <PlusIcon size={14} strokeWidth={2.5} />
            Nueva cita
          </button>
        )}
      </div>

      <div className="mb-6 grid w-full grid-cols-4 gap-4 max-[1024px]:grid-cols-2 mobile:mb-4 mobile:gap-2.5">
        <StatCard
          value={stats.today.length} valueColor="text-brand" dotColor="bg-brand"
          aside={stats.urgent > 0 ? `${stats.urgent} urgente${stats.urgent > 1 ? "s" : ""}` : undefined} asideColor="text-red-600 font-semibold"
          title="Citas hoy" caption={stats.byDoctor || "Sin citas"}
        />
        <StatCard
          value={stats.tomorrowConfirmed} valueColor="text-green-600" dotColor="bg-green-600"
          aside={`de ${stats.tomorrowTotal}`} title="Confirmadas" caption="Para mañana"
        />
        <StatCard
          value={stats.toConfirm} valueColor="text-amber-600" dotColor="bg-amber-500"
          aside="por llamar" asideColor="text-amber-600" title="Pendientes" caption="Por confirmar"
        />
        <StatCard
          value={patients.length} valueColor="text-accent" dotColor="bg-accent"
          title="Pacientes" caption="Registrados en la clínica"
        />
      </div>

      <div className="grid w-full grid-cols-[1fr_360px] gap-5 max-[1024px]:grid-cols-1 mobile:gap-3.5">
        <section className="card card-shadow overflow-hidden" aria-labelledby="dash-today">
          <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4 mobile:px-3.5 mobile:py-3">
            <div>
              <h2 id="dash-today" className="text-[15.5px] font-bold text-slate-800 mobile:text-[14.5px]">Citas del día</h2>
              <p className="mt-px text-[11px] text-slate-500">{formatLongDate(DEMO_TODAY)}</p>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11.5px] font-semibold text-slate-500">
              {stats.today.length} citas
            </span>
          </header>
          {stats.today.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-slate-400">No hay citas programadas para hoy.</p>
          ) : (
            <ul>
              {stats.today.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-2.5 border-b border-slate-100 px-5 py-3 last:border-b-0 mobile:px-3.5 mobile:py-2.5">
                  <time className="w-12 shrink-0 text-[13px] font-bold text-brand">{formatTime(a.startHour, a.startMin)}</time>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-bold leading-tight text-slate-800">{a.patient}</p>
                    <p className="mt-0.5 truncate text-[11.5px] text-slate-500">{a.treatment} · {doctorById(a.doctorId).name}</p>
                  </div>
                  <StatusBadge status={a.status} className="shrink-0 px-[7px] py-0.5 text-[10.5px]" />
                </li>
              ))}
            </ul>
          )}
          <footer className="border-t border-slate-100 px-5 py-2.5 text-right">
            <Link to="/agenda" className="text-xs font-semibold text-brand hover:underline">Ver agenda completa ›</Link>
          </footer>
        </section>

        <section className="card card-shadow overflow-hidden self-start" aria-labelledby="dash-reminders">
          <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4 mobile:px-3.5 mobile:py-3">
            <h2 id="dash-reminders" className="text-[15.5px] font-bold text-slate-800 mobile:text-[14.5px]">Recordatorios de mañana</h2>
            <span className="text-[11.5px] font-bold text-brand">{remindersLeft} pendientes</span>
          </header>
          {reminderRows.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-slate-400">No hay recordatorios por gestionar.</p>
          ) : (
            <ul className="flex flex-col gap-2 p-4 mobile:px-3 mobile:py-2">
              {reminderRows.map(({ reminder, appointment: a }) => {
                const patient = a.patientId ? patients.find((p) => p.id === a.patientId) : undefined;
                return (
                <li
                  key={reminder.id}
                  className={`flex items-center justify-between gap-2.5 rounded-lg border border-slate-200 px-3 py-2.5 transition-colors ${
                    reminder.status === "confirmed" ? "bg-green-50" : "bg-white"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-bold leading-tight text-slate-800">{a.patient}</p>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      {formatTime(a.startHour, a.startMin)} · {doctorById(a.doctorId).name} · {a.treatment}
                    </p>
                  </div>
                  {reminder.status === "confirmed" ? (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-green-600">
                      <CheckIcon size={12} strokeWidth={3} /> Confirmado
                    </span>
                  ) : (
                    <div className="flex shrink-0 items-center gap-1.5">
                      {patient?.phone && (
                        <a
                          href={whatsappHref(patient.phone)}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={`Abrir WhatsApp para ${a.patient}`}
                          className="inline-flex cursor-pointer items-center justify-center rounded-md border border-green-200 bg-green-50 px-2 py-1.5 text-[11.5px] font-bold text-green-700 hover:bg-green-100 no-underline"
                          title="Contactar al paciente por WhatsApp"
                        >
                          💬 WA
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => run(confirmReminder(reminder.id))}
                        aria-label={`Confirmar cita de ${a.patient}`}
                        className="cursor-pointer rounded-md border-0 bg-green-600 px-2.5 py-1.5 text-[11.5px] font-bold text-white hover:bg-green-700"
                      >
                        ✓ Confirmar
                      </button>
                      <button
                        type="button"
                        onClick={() => run(dismissReminder(reminder.id))}
                        aria-label={`Descartar recordatorio de ${a.patient}`}
                        className="cursor-pointer rounded-md border border-slate-200 bg-transparent px-2 py-1.5 text-[11.5px] text-slate-400 hover:bg-slate-50"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </li>
              );
              })}
            </ul>
          )}
        </section>
      </div>

      {isMobile && (
        <button type="button" className="fab-btn" onClick={newAppointment} aria-label="Nueva cita">
          <PlusIcon size={15} strokeWidth={2.8} />
          <span>Nueva cita</span>
        </button>
      )}
    </div>
  );
}
