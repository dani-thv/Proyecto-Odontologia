import { useMemo, useState } from "react";
import type { Patient } from "@/types";
import { useClinic } from "@/state/ClinicContext";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useToast } from "@/components/Toast";
import { DEMO_TODAY } from "@/data/demo";
import { doctorById } from "@/constants/doctors";
import { formatCOP, initialsOf, telHref, whatsappHref } from "@/utils/format";
import { formatShortDate } from "@/utils/dates";
import { patientBalance } from "@/utils/finance";
import { nextAppointment } from "@/utils/patients";
import Modal from "@/components/Modal";
import PatientFormModal from "@/components/PatientFormModal";
import PersonAvatar from "@/components/PersonAvatar";
import { PhoneIcon, PlusIcon, SearchIcon } from "@/components/icons";

type BalanceFilter = "all" | "pendiente" | "al-dia";

interface Row extends Patient {
  balance: number;
  nextAppt: string | null;
}

const FILTERS: { id: BalanceFilter; label: string; dot: string; ring: string; count: string }[] = [
  { id: "all", label: "Total", dot: "bg-brand", ring: "border-brand", count: "text-slate-800" },
  { id: "pendiente", label: "Con saldo pendiente", dot: "bg-red-600", ring: "border-red-600", count: "text-red-600" },
  { id: "al-dia", label: "Al día", dot: "bg-green-600", ring: "border-green-600", count: "text-green-600" },
];

const TABLE_COLS = "grid-cols-[2.2fr_1.2fr_1.1fr_1.1fr_1.1fr_90px]";

export default function Patients() {
  const { patients, plans, appointments, addPatient } = useClinic();
  const isMobile = useIsMobile();
  const toast = useToast();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<BalanceFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const rows: Row[] = useMemo(
    () =>
      patients.map((p) => {
        const next = nextAppointment(appointments, p.id, DEMO_TODAY);
        return { ...p, balance: patientBalance(plans, p.id), nextAppt: next ? next.date : null };
      }),
    [patients, plans, appointments],
  );

  const counts = {
    all: rows.length,
    pendiente: rows.filter((p) => p.balance > 0).length,
    "al-dia": rows.filter((p) => p.balance === 0).length,
  };

  const filtered = rows.filter((p) => {
    const q = search.trim().toLowerCase();
    const matchSearch = !q || p.name.toLowerCase().includes(q) || p.cedula.includes(q);
    const matchBalance =
      filter === "all" || (filter === "pendiente" && p.balance > 0) || (filter === "al-dia" && p.balance === 0);
    return matchSearch && matchBalance;
  });

  const selected = rows.find((p) => p.id === selectedId) ?? null;

  const handleCreate = async (input: Omit<Patient, "id">) => {
    const patient = await addPatient(input);
    setCreating(false);
    toast(`Paciente ${patient.name} registrado`);
  };

  const balanceBadge = (p: Row) =>
    p.balance === 0 ? (
      <span className="inline-flex rounded-md bg-green-50 px-2.5 py-[3px] text-xs font-semibold text-green-600">Al día</span>
    ) : (
      <span className="text-[13px] font-bold text-red-600">{formatCOP(p.balance)}</span>
    );

  return (
    <div className="fade-in w-full mobile:pb-6">
      <div className="mb-[18px] flex w-full flex-wrap items-center justify-between gap-3 mobile:mb-3">
        <div className="relative min-w-[280px] max-w-[380px] flex-1 mobile:min-w-full mobile:max-w-full">
          <SearchIcon size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            className="input w-full border-slate-300 bg-white pl-9"
            placeholder="Buscar por nombre o cédula..."
            aria-label="Buscar paciente por nombre o cédula"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {!isMobile && (
          <button type="button" className="btn-orange" onClick={() => setCreating(true)}>
            <PlusIcon size={13} strokeWidth={2.5} /> Nuevo paciente
          </button>
        )}
      </div>

      <div className="mb-4 flex w-full items-center gap-2 overflow-x-auto pb-1" role="group" aria-label="Filtrar por saldo">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            aria-pressed={filter === f.id}
            onClick={() => setFilter(f.id)}
            className={`inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 font-[inherit] ${
              filter === f.id ? `border-[1.5px] ${f.ring}` : "border border-slate-200"
            }`}
          >
            <span aria-hidden="true" className={`size-2 rounded-full ${f.dot}`} />
            <span className="text-xs text-slate-700">
              {f.label}: <strong className={f.count}>{counts[f.id]}</strong>
            </span>
          </button>
        ))}
      </div>

      {isMobile ? (
        <ul className="flex flex-col gap-2.5">
          {filtered.length === 0 && (
            <li className="card card-shadow px-5 py-8 text-center text-slate-400">No se encontraron pacientes</li>
          )}
          {filtered.map((p) => (
            <li key={p.id} className="card card-shadow rounded-xl px-4 py-3.5" onClick={() => setSelectedId(p.id)}>
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2.5">
                  <PersonAvatar initials={initialsOf(p.name)} size={38} />
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-bold leading-tight text-slate-800">{p.name}</h3>
                    <p className="mt-0.5 text-[11.5px] text-slate-500">
                      {p.cedula} · <span className="font-semibold text-brand">{doctorById(p.doctorId).name}</span>
                    </p>
                  </div>
                </div>
                <span
                  className={`inline-flex shrink-0 items-center rounded-md border px-2 py-[3px] text-[11px] font-bold ${
                    p.balance === 0 ? "border-green-200 bg-green-50 text-green-600" : "border-red-200 bg-red-50 text-red-600"
                  }`}
                >
                  {p.balance === 0 ? "✓ Al día" : formatCOP(p.balance)}
                </span>
              </div>

              <dl className="my-2 mb-2.5 grid grid-cols-2 gap-2 rounded-lg bg-slate-50 px-2.5 py-2 text-[11.5px]">
                <div>
                  <dt className="block text-[10px] font-semibold uppercase text-slate-400">Última visita</dt>
                  <dd className="font-semibold text-slate-700">{p.lastVisit ? formatShortDate(p.lastVisit) : "—"}</dd>
                </div>
                <div>
                  <dt className="block text-[10px] font-semibold uppercase text-slate-400">Próxima cita</dt>
                  <dd className={p.nextAppt ? "font-bold text-brand" : "font-medium text-slate-400"}>
                    {p.nextAppt ? formatShortDate(p.nextAppt) : "Sin cita agendada"}
                  </dd>
                </div>
              </dl>

              <div className="flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                <a href={telHref(p.phone)} className="flex items-center gap-1.5 text-xs font-semibold text-brand no-underline">
                  <PhoneIcon size={13} /> {p.phone}
                </a>
                <div className="flex gap-1.5">
                  <a href={whatsappHref(p.phone)} target="_blank" rel="noreferrer" className="btn-ghost rounded-md px-2 py-1 text-[11px] text-green-600 no-underline">
                    💬 WhatsApp
                  </a>
                  <button type="button" className="btn-ghost rounded-md px-2 py-1 text-[11px]" onClick={() => setSelectedId(p.id)}>
                    Ver ficha ›
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="card card-shadow overflow-hidden" role="table" aria-label="Pacientes">
          <div className={`tbl-head ${TABLE_COLS}`} role="row">
            {["Paciente", "Teléfono", "Última visita", "Próxima cita", "Saldo"].map((h) => (
              <span key={h} role="columnheader">{h}</span>
            ))}
            <span role="columnheader"><span className="sr-only">Acciones</span></span>
          </div>
          {filtered.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-slate-400">No se encontraron pacientes</div>
          ) : (
            filtered.map((p) => (
              <div key={p.id} className={`tbl-row ${TABLE_COLS}`} role="row">
                <div className="flex items-center gap-3" role="cell">
                  <PersonAvatar initials={initialsOf(p.name)} />
                  <div>
                    <p className="text-[13.5px] font-bold text-slate-800">{p.name}</p>
                    <p className="text-[11.5px] text-slate-400">{p.cedula} · {doctorById(p.doctorId).name}</p>
                  </div>
                </div>
                <p className="text-[13px] text-slate-700" role="cell">{p.phone}</p>
                <p className="text-[13px] text-slate-700" role="cell">{p.lastVisit ? formatShortDate(p.lastVisit) : "—"}</p>
                <p
                  className={p.nextAppt ? "text-[13px] font-bold text-slate-800" : "text-[12.5px] italic text-slate-400"}
                  role="cell"
                >
                  {p.nextAppt ? formatShortDate(p.nextAppt) : "Sin cita"}
                </p>
                <div role="cell">{balanceBadge(p)}</div>
                <div role="cell">
                  <button
                    type="button"
                    className="btn-ghost px-2.5 py-1 text-xs"
                    onClick={() => setSelectedId(p.id)}
                    aria-label={`Ver ficha de ${p.name}`}
                  >
                    Ver ficha
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {selected && (
        <Modal
          title="Ficha del Paciente"
          maxWidth={460}
          onClose={() => setSelectedId(null)}
          footer={
            <>
              <a href={telHref(selected.phone)} className="btn-ghost text-slate-800 no-underline">📞 Llamar</a>
              <a href={whatsappHref(selected.phone)} target="_blank" rel="noreferrer" className="btn-teal no-underline">💬 WhatsApp</a>
              <button type="button" className="btn-blue" onClick={() => setSelectedId(null)}>Cerrar</button>
            </>
          }
        >
          <div className="mb-1.5 flex items-center gap-3.5">
            <PersonAvatar initials={initialsOf(selected.name)} size={48} solid />
            <div>
              <h3 className="text-base font-extrabold text-slate-800">{selected.name}</h3>
              <p className="text-[12.5px] text-slate-500">C.C. {selected.cedula}</p>
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-3">
            <div>
              <dt className="text-[11px] font-bold uppercase text-slate-400">Doctor asignado</dt>
              <dd className="mt-0.5 text-[13px] font-semibold text-slate-800">{doctorById(selected.doctorId).name}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-bold uppercase text-slate-400">Teléfono</dt>
              <dd className="mt-0.5 text-[13px] font-semibold text-brand">{selected.phone}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-bold uppercase text-slate-400">Última visita</dt>
              <dd className="mt-0.5 text-[13px] text-slate-700">{selected.lastVisit ? formatShortDate(selected.lastVisit) : "—"}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-bold uppercase text-slate-400">Próxima cita</dt>
              <dd className={`mt-0.5 text-[13px] font-bold ${selected.nextAppt ? "text-brand" : "text-slate-400"}`}>
                {selected.nextAppt ? formatShortDate(selected.nextAppt) : "Sin cita agendada"}
              </dd>
            </div>
          </dl>

          <div
            className={`rounded-lg border px-3.5 py-3 ${
              selected.balance === 0 ? "border-green-200 bg-green-50 text-green-600" : "border-red-200 bg-red-50 text-red-600"
            }`}
          >
            <span className="text-[11px] font-bold uppercase">Estado de cuenta</span>
            <p className="mt-0.5 text-base font-extrabold">
              {selected.balance === 0 ? "Al día (Sin saldo pendiente)" : `Saldo pendiente: ${formatCOP(selected.balance)}`}
            </p>
          </div>
        </Modal>
      )}

      {creating && <PatientFormModal existing={patients} onSave={handleCreate} onClose={() => setCreating(false)} />}

      {isMobile && (
        <button type="button" className="fab-btn" onClick={() => setCreating(true)} aria-label="Nuevo paciente">
          <PlusIcon size={15} strokeWidth={2.8} />
          <span>Nuevo paciente</span>
        </button>
      )}
    </div>
  );
}
