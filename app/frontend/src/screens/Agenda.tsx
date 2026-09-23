import { useState, useCallback, useRef, useEffect } from "react";

// ── Types ──────────────────────────────────────────────────────
type Status = "confirmed" | "pending" | "urgent" | "cancelled";
type Doctor = "Dr. Carlos" | "Dra. Liliana – Odontopediatría" | "Ortodoncista" | "Controles";

type Appointment = {
  id: string;
  patient: string;
  treatment: string;
  doctor: Doctor;
  dayIndex: number;   // 0=Lun, 1=Mar, 2=Mié, 3=Jue, 4=Vie, 5=Sáb
  startHour: number;
  startMin: number;
  durationMin: number;
  status: Status;
};

type PendingPatient = {
  id: string;
  name: string;
  treatment: string;
  phone: string;
  when: string;
};

// ── Constants ──────────────────────────────────────────────────
const FIRST_HOUR = 8;
const LAST_HOUR  = 15; // 08:00 to 14:30 / 15:00
const SLOT_MIN   = 30; // 30 min per row
const SLOT_H     = 65; // px per 30-min slot (Google Calendar ~60-70px)
const TIME_COL   = 72; // px for time column
const DAYS       = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const DAY_DATES  = [14, 15, 16, 17, 18, 19];
const DOCTORS: Doctor[] = ["Dr. Carlos", "Dra. Liliana – Odontopediatría", "Ortodoncista", "Controles"];
const MIN_DAY_WIDTH = 140; // Minimum width per day column in desktop

const STATUS_STYLES: Record<Status, { bg: string; border: string; text: string; label: string }> = {
  confirmed: { bg: "#eafaf1", border: "#22c55e", text: "#15803d", label: "Confirmada" },
  pending:   { bg: "#eaf4fc", border: "#0284c7", text: "#0369a1", label: "Pendiente" },
  urgent:    { bg: "#fef0f0", border: "#ef4444", text: "#b91c1c", label: "Urgente" },
  cancelled: { bg: "#f1f5f9", border: "#94a3b8", text: "#475569", label: "Cancelada" },
};

const INITIAL_PENDING: PendingPatient[] = [
  { id: "p1", name: "María Fernanda López", treatment: "Endodoncia",       phone: "310 452 8814", when: "Hace 2 días" },
  { id: "p2", name: "Roberto Castaño",      treatment: "Control implante", phone: "315 887 3301", when: "Ayer" },
  { id: "p3", name: "Juliana Restrepo",     treatment: "Ortodoncia",       phone: "300 112 5590", when: "Hace 3 días" },
  { id: "p4", name: "Esteban Gutiérrez",    treatment: "Limpieza",         phone: "317 654 9922", when: "Hoy" },
];

let ID_CTR = 30;
const mkId = () => `appt-${++ID_CTR}`;

const INITIAL_APPTS: Appointment[] = [
  { id: "1",  patient: "Andrea Morales",  treatment: "Limpieza",        doctor: "Dr. Carlos", dayIndex: 0, startHour: 8,  startMin: 0,  durationMin: 60,  status: "confirmed" },
  { id: "2",  patient: "Luis Felipe Roa", treatment: "Control ortod.",  doctor: "Dr. Carlos", dayIndex: 0, startHour: 9,  startMin: 30, durationMin: 60,  status: "confirmed" },
  { id: "3",  patient: "Valentina Cruz",  treatment: "Extracción",      doctor: "Dr. Carlos", dayIndex: 0, startHour: 10, startMin: 30, durationMin: 90,  status: "urgent" },
  { id: "4",  patient: "Carolina Pinto",  treatment: "Odontopediatría", doctor: "Dr. Carlos", dayIndex: 1, startHour: 9,  startMin: 0,  durationMin: 45,  status: "pending" },
  { id: "5",  patient: "Mateo Herrera",   treatment: "Brackets",        doctor: "Dr. Carlos", dayIndex: 1, startHour: 9,  startMin: 45, durationMin: 105, status: "confirmed" },
  { id: "6",  patient: "Jorge Sánchez",   treatment: "Endodoncia",      doctor: "Dr. Carlos", dayIndex: 2, startHour: 8,  startMin: 30, durationMin: 120, status: "confirmed" },
  { id: "7",  patient: "Isabela Romero",  treatment: "Revisión gral.",  doctor: "Dr. Carlos", dayIndex: 2, startHour: 12, startMin: 0,  durationMin: 60,  status: "cancelled" },
  { id: "8",  patient: "Daniel Vargas",   treatment: "Resina",          doctor: "Dr. Carlos", dayIndex: 3, startHour: 10, startMin: 30, durationMin: 60,  status: "pending" },
  { id: "9",  patient: "Sofía Mendoza",   treatment: "Control bim.",    doctor: "Dr. Carlos", dayIndex: 4, startHour: 9,  startMin: 0,  durationMin: 60,  status: "confirmed" },
  { id: "10", patient: "Ricardo Ávila",   treatment: "Blanqueamiento",  doctor: "Dr. Carlos", dayIndex: 4, startHour: 11, startMin: 0,  durationMin: 90,  status: "confirmed" },
  { id: "11", patient: "Camila Torres",   treatment: "Cambio arco",     doctor: "Dr. Carlos", dayIndex: 5, startHour: 8,  startMin: 30, durationMin: 60,  status: "pending" },
];

const topPx = (h: number, m: number) => ((h - FIRST_HOUR) * 60 + m) / SLOT_MIN * SLOT_H;
const heightPx = (min: number) => (min / SLOT_MIN) * SLOT_H;

const emptyForm = () => ({
  patient: "",
  treatment: "",
  doctor: "Dr. Carlos" as Doctor,
  dayIndex: 4,
  startHour: 9,
  startMin: 0,
  durationMin: 60,
  status: "confirmed" as Status,
});

type Props = {
  activeDoctor?: string;
};

export default function Agenda({ activeDoctor }: Props) {
  const [appts, setAppts] = useState<Appointment[]>(INITIAL_APPTS);
  const [pending, setPending] = useState<PendingPatient[]>(INITIAL_PENDING);
  const [activeDoc, setActiveDoc] = useState<Doctor>("Dr. Carlos");
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(4); // Default: Viernes 18
  const [mobileViewMode, setMobileViewMode] = useState<"day" | "week">("day");
  const [pendingSheetOpen, setPendingSheetOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Modals
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Toast
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Sync active doctor when changed in App header
  useEffect(() => {
    if (activeDoctor && DOCTORS.includes(activeDoctor as Doctor)) {
      setActiveDoc(activeDoctor as Doctor);
    }
  }, [activeDoctor]);

  // Drag states for Desktop
  const draggingId = useRef<string | null>(null);
  const draggingPending = useRef<PendingPatient | null>(null);
  const dragOffsetMin = useRef(0);
  const [dragOver, setDragOver] = useState<{ day: number; slotIndex: number } | null>(null);

  // Slots array: 08:00, 08:30, 09:00, ..., 14:30
  const totalSlots = (LAST_HOUR - FIRST_HOUR) * 2;
  const slots = Array.from({ length: totalSlots }, (_, i) => {
    const totalMin = FIRST_HOUR * 60 + i * SLOT_MIN;
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    const label = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    return { h, m, label, index: i };
  });

  // Filter appointments by active doctor
  const visible = appts.filter((a) => a.doctor === activeDoc);

  // Open create
  const openCreate = useCallback((dayIndex: number, slotIndex: number) => {
    const totalMin = FIRST_HOUR * 60 + slotIndex * SLOT_MIN;
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    setForm({ ...emptyForm(), dayIndex, startHour: h, startMin: m, doctor: activeDoc });
    setModal("create");
  }, [activeDoc]);

  // Open edit
  const openEdit = useCallback((id: string) => {
    const a = appts.find((x) => x.id === id);
    if (!a) return;
    setForm({
      patient: a.patient, treatment: a.treatment, doctor: a.doctor,
      dayIndex: a.dayIndex, startHour: a.startHour, startMin: a.startMin,
      durationMin: a.durationMin, status: a.status,
    });
    setEditId(id);
    setModal("edit");
  }, [appts]);

  const closeModal = () => {
    setModal(null);
    setEditId(null);
    setForm(emptyForm());
  };

  // CRUD actions
  const saveCreate = () => {
    if (!form.patient.trim()) return;
    setAppts((prev) => [...prev, { id: mkId(), ...form }]);
    // If this patient was pending, remove from pending list
    setPending((prev) => prev.filter((p) => p.name.toLowerCase() !== form.patient.trim().toLowerCase()));
    showToast(`Cita programada para ${form.patient}`);
    closeModal();
  };

  const saveEdit = () => {
    if (!editId || !form.patient.trim()) return;
    setAppts((prev) => prev.map((a) => a.id === editId ? { ...a, ...form } : a));
    showToast(`Cita actualizada`);
    closeModal();
  };

  const deleteAppt = (id: string) => {
    setAppts((prev) => prev.filter((a) => a.id !== id));
    setDeleteConfirm(null);
    closeModal();
    showToast(`Cita eliminada`);
  };

  // Handle scheduling from the pending list
  const handleSchedulePending = (p: PendingPatient) => {
    setForm({
      ...emptyForm(),
      patient: p.name,
      treatment: p.treatment,
      doctor: activeDoc,
      dayIndex: selectedDayIndex,
      startHour: 9,
      startMin: 0,
    });
    setPendingSheetOpen(false);
    setModal("create");
  };

  // ── Drag & Drop Logic (Desktop) ──
  const handleApptDragStart = (e: React.DragEvent, appt: Appointment) => {
    draggingId.current = appt.id;
    draggingPending.current = null;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const relY = e.clientY - rect.top;
    dragOffsetMin.current = Math.floor(relY / SLOT_H) * SLOT_MIN;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", appt.id);
  };

  const handlePendingDragStart = (e: React.DragEvent, p: PendingPatient) => {
    draggingPending.current = p;
    draggingId.current = null;
    dragOffsetMin.current = 0;
    e.dataTransfer.effectAllowed = "copyMove";
    e.dataTransfer.setData("application/json", JSON.stringify(p));
  };

  const handleDragEnd = () => {
    draggingId.current = null;
    draggingPending.current = null;
    setDragOver(null);
  };

  const handleCellDragOver = (e: React.DragEvent, day: number, slotIndex: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOver({ day, slotIndex });
  };

  const handleCellDrop = (e: React.DragEvent, day: number, slotIndex: number) => {
    e.preventDefault();
    setDragOver(null);

    const rawMin = FIRST_HOUR * 60 + slotIndex * SLOT_MIN - dragOffsetMin.current;
    const snappedMin = Math.round(rawMin / SLOT_MIN) * SLOT_MIN;
    const clampedMin = Math.max(FIRST_HOUR * 60, Math.min(snappedMin, (LAST_HOUR - 1) * 60));
    const newH = Math.floor(clampedMin / 60);
    const newM = clampedMin % 60;

    // Case A: Dropped pending patient widget into calendar
    if (draggingPending.current) {
      const p = draggingPending.current;
      const newAppt: Appointment = {
        id: mkId(),
        patient: p.name,
        treatment: p.treatment,
        doctor: activeDoc,
        dayIndex: day,
        startHour: newH,
        startMin: newM,
        durationMin: 60,
        status: "confirmed",
      };
      setAppts((prev) => [...prev, newAppt]);
      setPending((prev) => prev.filter((item) => item.id !== p.id));
      showToast(`¡${p.name} agendado para el ${DAYS[day]} ${DAY_DATES[day]} a las ${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}!`);
      draggingPending.current = null;
      return;
    }

    // Case B: Dragged existing appointment to new slot/day
    const id = draggingId.current ?? e.dataTransfer.getData("text/plain");
    if (id) {
      setAppts((prev) => prev.map((a) =>
        a.id === id ? { ...a, dayIndex: day, startHour: newH, startMin: newM } : a
      ));
      showToast(`Cita reubicada a ${DAYS[day]} ${DAY_DATES[day]} a las ${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`);
      draggingId.current = null;
    }
  };

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", height: "100%", width: "100%" }}>
      {/* ═════════════════════════════════════════════════════════════
          MOBILE VIEW: Google Calendar Style (Width 100%)
          ═════════════════════════════════════════════════════════════ */}
      {isMobile ? (
        <div style={{ display: "flex", flexDirection: "column", height: "100%", width: "100%" }}>
          {/* Day Strip (Google Calendar Horizontal Day Picker) */}
          <div className="day-strip">
            {DAYS.map((dayName, idx) => {
              const isSelected = selectedDayIndex === idx;
              const dayApptsCount = visible.filter((a) => a.dayIndex === idx).length;
              return (
                <button
                  key={dayName}
                  className={`day-pill${isSelected ? " active" : ""}`}
                  onClick={() => setSelectedDayIndex(idx)}
                  aria-label={`${dayName} ${DAY_DATES[idx]}`}
                >
                  <span className="day-pill-name">{dayName}</span>
                  <span className="day-pill-date">{DAY_DATES[idx]}</span>
                  {dayApptsCount > 0 && <span className="day-pill-dot" />}
                </button>
              );
            })}
          </div>

          {/* Sub-header Controls */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, margin: "6px 0 10px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
              {/* Doctor filter dropdown */}
              <select
                className="input"
                style={{ padding: "4px 8px", fontSize: 12, height: 32, fontWeight: 600, background: "#fff", borderColor: "#cbd5e1", maxWidth: 150 }}
                value={activeDoc}
                onChange={(e) => setActiveDoc(e.target.value as Doctor)}
              >
                {DOCTORS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>

              {/* View Switcher: Día / Semana */}
              <div style={{ display: "inline-flex", background: "#e2e8f0", padding: 2, borderRadius: 8 }}>
                <button
                  style={{
                    padding: "3px 8px", fontSize: 11, fontWeight: 700, borderRadius: 6, border: "none",
                    background: mobileViewMode === "day" ? "#ffffff" : "transparent",
                    color: mobileViewMode === "day" ? "#1d72b8" : "#64748b",
                    cursor: "pointer",
                  }}
                  onClick={() => setMobileViewMode("day")}
                >
                  Día
                </button>
                <button
                  style={{
                    padding: "3px 8px", fontSize: 11, fontWeight: 700, borderRadius: 6, border: "none",
                    background: mobileViewMode === "week" ? "#ffffff" : "transparent",
                    color: mobileViewMode === "week" ? "#1d72b8" : "#64748b",
                    cursor: "pointer",
                  }}
                  onClick={() => setMobileViewMode("week")}
                >
                  Semana
                </button>
              </div>
            </div>

            {/* Pendientes & Nueva cita action buttons */}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <button
                style={{
                  padding: "5px 10px",
                  fontSize: 12,
                  fontWeight: 700,
                  borderRadius: 99,
                  border: "1.5px solid #1d72b8",
                  background: "#eff6ff",
                  color: "#1d72b8",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                }}
                onClick={() => setPendingSheetOpen(true)}
              >
                <span>⏳ Pendientes</span>
                <span style={{
                  background: "#1d72b8",
                  color: "#fff",
                  padding: "1px 6px",
                  borderRadius: 99,
                  fontSize: 10,
                  fontWeight: 800,
                }}>
                  {pending.length}
                </span>
              </button>

              <button
                className="btn-orange"
                style={{ padding: "5px 10px", fontSize: 12, height: 30 }}
                onClick={() => {
                  setForm({ ...emptyForm(), dayIndex: selectedDayIndex, doctor: activeDoc });
                  setModal("create");
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
                <span>Cita</span>
              </button>
            </div>
          </div>

          {/* Schedule Content */}
          {mobileViewMode === "day" ? (
            /* ── Google Calendar Mobile Timeline (Day View) ── */
            <div className="card card-shadow" style={{ flex: 1, overflowY: "auto", padding: "10px 10px 40px", background: "#fff" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {slots.map((s) => {
                  const slotAppts = visible.filter(
                    (a) => a.dayIndex === selectedDayIndex && a.startHour === s.h && a.startMin === s.m
                  );
                  return (
                    <div key={s.index} style={{ display: "flex", gap: 10, minHeight: 46, alignItems: "stretch" }}>
                      {/* Time Column */}
                      <div style={{ width: 44, fontSize: 11.5, fontWeight: 600, color: "#94a3b8", paddingTop: 4, flexShrink: 0, textAlign: "right" }}>
                        {s.label}
                      </div>

                      {/* Content Column */}
                      <div style={{ flex: 1, borderTop: "1px solid #f1f5f9", paddingTop: 2, paddingBottom: 4 }}>
                        {slotAppts.length > 0 ? (
                          slotAppts.map((a) => {
                            const st = STATUS_STYLES[a.status];
                            const endMin = a.startMin + a.durationMin;
                            const endH = a.startHour + Math.floor(endMin / 60);
                            const remM = endMin % 60;
                            const timeRange = `${String(a.startHour).padStart(2, "0")}:${String(a.startMin).padStart(2, "0")} – ${String(endH).padStart(2, "0")}:${String(remM).padStart(2, "0")}`;

                            return (
                              <div
                                key={a.id}
                                onClick={() => openEdit(a.id)}
                                style={{
                                  background: st.bg,
                                  borderLeft: `4px solid ${st.border}`,
                                  border: `1px solid ${st.border}35`,
                                  borderLeftWidth: 4,
                                  borderRadius: 8,
                                  padding: "8px 10px",
                                  cursor: "pointer",
                                  marginBottom: 4,
                                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                                }}
                              >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6 }}>
                                  <h4 style={{ fontSize: 13.5, fontWeight: 700, color: st.text, lineHeight: 1.2 }}>
                                    {a.patient}
                                  </h4>
                                  <span style={{
                                    fontSize: 10, fontWeight: 700, color: st.text,
                                    background: "rgba(255,255,255,0.85)", padding: "2px 6px", borderRadius: 4,
                                  }}>
                                    {st.label}
                                  </span>
                                </div>
                                <p style={{ fontSize: 11.5, color: "#475569", marginTop: 2 }}>{a.treatment}</p>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 5, fontSize: 11, color: "#64748b" }}>
                                  <span>🕒 {timeRange} ({a.durationMin} min)</span>
                                  <span style={{ color: "#1d72b8", fontWeight: 600 }}>Detalles ›</span>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div
                            onClick={() => openCreate(selectedDayIndex, s.index)}
                            style={{
                              height: "100%", minHeight: 36, borderRadius: 6,
                              display: "flex", alignItems: "center", paddingLeft: 8,
                              color: "#cbd5e1", fontSize: 11.5, cursor: "pointer",
                              transition: "background 0.15s",
                            }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#f8fafc"; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                          >
                            <span style={{ opacity: 0.65 }}>+ Agendar horario</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* ── Horizontal Scrollable Week View on Mobile ── */
            <div className="card card-shadow" style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <div className="agenda-calendar" style={{ flex: 1, overflow: "auto", position: "relative" }}>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: `${TIME_COL}px repeat(6, minmax(${MIN_DAY_WIDTH}px, 1fr))`,
                  minHeight: totalSlots * SLOT_H,
                  position: "relative",
                  minWidth: 700,
                }}>
                  {/* Time column */}
                  <div style={{ borderRight: "1px solid #e2e8f0", background: "#ffffff", position: "sticky", left: 0, zIndex: 5 }}>
                    {slots.map((s) => (
                      <div
                        key={s.index}
                        style={{
                          height: SLOT_H,
                          display: "flex",
                          alignItems: "flex-start",
                          justifyContent: "flex-end",
                          paddingRight: 10,
                          paddingTop: 2,
                          borderBottom: "1px solid #f1f5f9",
                        }}
                      >
                        <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500 }}>{s.label}</span>
                      </div>
                    ))}
                  </div>

                  {/* 6 Day columns */}
                  {DAYS.map((_, dayIdx) => {
                    const colAppts = visible.filter((a) => a.dayIndex === dayIdx);
                    return (
                      <div
                        key={dayIdx}
                        style={{
                          borderRight: dayIdx < 5 ? "1px solid #e2e8f0" : "none",
                          position: "relative",
                          minWidth: MIN_DAY_WIDTH,
                        }}
                      >
                        {slots.map((s) => (
                          <div
                            key={s.index}
                            style={{ height: SLOT_H, borderBottom: "1px solid #f1f5f9", cursor: "pointer" }}
                            onClick={() => openCreate(dayIdx, s.index)}
                          />
                        ))}
                        {colAppts.map((a) => {
                          const t = topPx(a.startHour, a.startMin);
                          const h = heightPx(a.durationMin);
                          const st = STATUS_STYLES[a.status];
                          return (
                            <div
                              key={a.id}
                              onClick={() => openEdit(a.id)}
                              style={{
                                position: "absolute",
                                top: t, left: 4, right: 4,
                                height: Math.max(h - 3, 34),
                                borderRadius: 6,
                                background: st.bg,
                                borderLeft: `3px solid ${st.border}`,
                                padding: "6px 8px",
                                overflow: "hidden",
                                zIndex: 10,
                                cursor: "pointer",
                                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                              }}
                            >
                              <p style={{ fontSize: 12, fontWeight: 700, color: st.text, lineHeight: 1.2 }}>{a.patient}</p>
                              <p style={{ fontSize: 10.5, color: "#64748b" }}>{a.treatment}</p>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ═════════════════════════════════════════════════════════════
            DESKTOP VIEW: Full Side-by-Side with Drag-and-Drop
            ═════════════════════════════════════════════════════════════ */
        <div style={{ display: "flex", gap: 16, height: "calc(100vh - 104px)", width: "100%" }}>
          {/* Calendar Area */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
            {/* Doctor filter tabs */}
            <div className="doctor-tabs-container" style={{ display: "flex", gap: 8, marginBottom: 14, overflowX: "auto", paddingBottom: 6 }}>
              <div className="doctor-tabs" style={{ display: "flex", gap: 8, minWidth: "max-content" }}>
                {DOCTORS.map((d) => (
                  <button
                    key={d}
                    className={`doc-tab${activeDoc === d ? " active" : ""}`}
                    onClick={() => setActiveDoc(d)}
                    style={{ flexShrink: 0 }}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Date bar */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
              <button className="btn-ghost" style={{ padding: "6px 9px", background: "transparent", border: "none" }} aria-label="Semana anterior">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.2"><path d="M15 18l-6-6 6-6" /></svg>
              </button>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>
                14 de sept – 19 de sept de 2026
              </span>
              <button className="btn-ghost" style={{ padding: "6px 9px", background: "transparent", border: "none" }} aria-label="Semana siguiente">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.2"><path d="M9 18l6-6-6-6" /></svg>
              </button>
              <span style={{ fontSize: 13, color: "#1d72b8", fontWeight: 600, cursor: "pointer", marginLeft: 4 }}>Hoy</span>

              <div style={{ marginLeft: "auto" }}>
                <button className="btn-orange" onClick={() => {
                  setForm(emptyForm());
                  setModal("create");
                }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
                  Nueva cita
                </button>
              </div>
            </div>

            {/* Calendar Card */}
            <div className="card card-shadow" style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
              {/* Day Headers */}
              <div className="agenda-grid" style={{
                display: "grid",
                gridTemplateColumns: `${TIME_COL}px repeat(6, minmax(${MIN_DAY_WIDTH}px, 1fr))`,
                borderBottom: "1px solid #e2e8f0",
                background: "#ffffff",
                flexShrink: 0,
              }}>
                <div style={{ borderRight: "1px solid #e2e8f0", padding: "12px 0" }} />
                {DAYS.map((dayName, idx) => {
                  const isFriday18 = idx === 4;
                  return (
                    <div
                      key={dayName}
                      style={{
                        padding: "12px 8px",
                        textAlign: "center",
                        borderRight: idx < 5 ? "1px solid #e2e8f0" : "none",
                        background: isFriday18 ? "#1d72b8" : "transparent",
                        color: isFriday18 ? "#ffffff" : "#64748b",
                        minWidth: MIN_DAY_WIDTH,
                      }}
                    >
                      <p style={{
                        fontSize: 12,
                        fontWeight: 600,
                        textTransform: "capitalize",
                        color: isFriday18 ? "rgba(255,255,255,0.85)" : "#94a3b8",
                        marginBottom: 4,
                      }}>
                        {dayName}
                      </p>
                      <p style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: isFriday18 ? "#ffffff" : "#1e293b",
                      }}>
                        {DAY_DATES[idx]}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Time & Slots Area */}
              <div className="agenda-calendar" style={{ flex: 1, overflow: "auto", position: "relative" }}>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: `${TIME_COL}px repeat(6, minmax(${MIN_DAY_WIDTH}px, 1fr))`,
                  minHeight: totalSlots * SLOT_H,
                  position: "relative",
                }}>
                  {/* Time column */}
                  <div style={{ borderRight: "1px solid #e2e8f0", background: "#ffffff", position: "sticky", left: 0, zIndex: 5 }}>
                    {slots.map((s) => (
                      <div
                        key={s.index}
                        style={{
                          height: SLOT_H,
                          display: "flex",
                          alignItems: "flex-start",
                          justifyContent: "flex-end",
                          paddingRight: 12,
                          paddingTop: 2,
                          borderBottom: "1px solid #f1f5f9",
                        }}
                      >
                        <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 500, whiteSpace: "nowrap" }}>
                          {s.label}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* 6 Day columns */}
                  {DAYS.map((_, dayIdx) => {
                    const colAppts = visible.filter((a) => a.dayIndex === dayIdx);
                    const isFriday18 = dayIdx === 4;

                    return (
                      <div
                        key={dayIdx}
                        style={{
                          borderRight: dayIdx < 5 ? "1px solid #e2e8f0" : "none",
                          position: "relative",
                          background: isFriday18 ? "rgba(29, 114, 184, 0.02)" : "#ffffff",
                          minWidth: MIN_DAY_WIDTH,
                        }}
                      >
                        {/* Background drop cells */}
                        {slots.map((s) => {
                          const isOver = dragOver?.day === dayIdx && dragOver?.slotIndex === s.index;
                          return (
                            <div
                              key={s.index}
                              style={{
                                height: SLOT_H,
                                borderBottom: "1px solid #f1f5f9",
                                background: isOver ? "rgba(29, 114, 184, 0.12)" : "transparent",
                                outline: isOver ? "2px dashed #1d72b8" : "none",
                                outlineOffset: -2,
                                cursor: "pointer",
                                transition: "background 0.1s",
                              }}
                              onDragOver={(e) => handleCellDragOver(e, dayIdx, s.index)}
                              onDrop={(e) => handleCellDrop(e, dayIdx, s.index)}
                              onDragLeave={() => setDragOver(null)}
                              onClick={() => openCreate(dayIdx, s.index)}
                              title="Haz clic para agendar una cita o arrastra un widget aquí"
                            />
                          );
                        })}

                        {/* Appointment Widgets */}
                        {colAppts.map((a) => {
                          const t = topPx(a.startHour, a.startMin);
                          const h = heightPx(a.durationMin);
                          const st = STATUS_STYLES[a.status];
                          const isDraggingThis = draggingId.current === a.id;

                          return (
                            <div
                              key={a.id}
                              draggable
                              onDragStart={(e) => { e.stopPropagation(); handleApptDragStart(e, a); }}
                              onDragEnd={handleDragEnd}
                              onClick={(e) => { e.stopPropagation(); openEdit(a.id); }}
                              style={{
                                position: "absolute",
                                top: t,
                                left: 6,
                                right: 6,
                                height: Math.max(h - 3, 36),
                                borderRadius: 6,
                                background: st.bg,
                                borderLeft: `4px solid ${st.border}`,
                                padding: "8px 10px",
                                cursor: "grab",
                                opacity: isDraggingThis ? 0.35 : 1,
                                transition: "box-shadow 0.15s, opacity 0.15s, transform 0.1s",
                                overflow: "hidden",
                                zIndex: 10,
                                userSelect: "none",
                                boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                              }}
                            >
                              <p style={{ fontSize: 13, fontWeight: 700, color: st.text, lineHeight: 1.3, marginBottom: 2 }}>
                                {a.patient}
                              </p>
                              {h > 45 && (
                                <p style={{ fontSize: 11.5, color: st.text, opacity: 0.9, lineHeight: 1.3 }}>
                                  {a.treatment}
                                </p>
                              )}
                              <div style={{ position: "absolute", bottom: 4, right: 8, fontSize: 10, color: st.text, opacity: 0.6, whiteSpace: "nowrap" }}>
                                {String(a.startHour).padStart(2,"0")}:{String(a.startMin).padStart(2,"0")}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Status Legend */}
              <div style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 16,
                padding: "12px 16px",
                borderTop: "1px solid #e2e8f0",
                background: "#ffffff",
                flexShrink: 0,
                alignItems: "center",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 12, height: 12, borderRadius: 3, background: "#dcfce7", border: "1px solid #22c55e" }} />
                  <span style={{ fontSize: 12, color: "#64748b" }}>Confirmada</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 12, height: 12, borderRadius: 3, background: "#e0f2fe", border: "1px solid #0284c7" }} />
                  <span style={{ fontSize: 12, color: "#64748b" }}>Pendiente</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 12, height: 12, borderRadius: 3, background: "#fee2e2", border: "1px solid #ef4444" }} />
                  <span style={{ fontSize: 12, color: "#64748b" }}>Urgente</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 12, height: 12, borderRadius: 3, background: "#f1f5f9", border: "1px solid #94a3b8" }} />
                  <span style={{ fontSize: 12, color: "#64748b" }}>Cancelada</span>
                </div>

                <div style={{ marginLeft: "auto", fontSize: 11.5, color: "#94a3b8" }}>
                  💡 Arrastra cualquier widget o cita para reorganizar la agenda
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel: Pendientes de reagendar (Desktop) */}
          <aside style={{ width: 260, flexShrink: 0, display: "flex", flexDirection: "column", minWidth: 240 }}>
            <div className="card card-shadow" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <div style={{ padding: "16px 16px 12px", borderBottom: "1px solid #e2e8f0" }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Pendientes de reagendar</p>
                <p style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{pending.length} pacientes</p>
              </div>

              <div style={{ flex: 1, overflowY: "auto", padding: "12px", display: "flex", flexDirection: "column", gap: 10 }}>
                {pending.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "30px 10px", color: "#94a3b8", fontSize: 13 }}>
                    No hay pacientes pendientes por reagendar
                  </div>
                ) : (
                  pending.map((p) => (
                    <div
                      key={p.id}
                      draggable
                      onDragStart={(e) => handlePendingDragStart(e, p)}
                      onDragEnd={handleDragEnd}
                      style={{
                        padding: "14px 16px",
                        background: "#ffffff",
                        border: "1px solid #e2e8f0",
                        borderLeft: "4px solid #16a34a",
                        borderRadius: 10,
                        cursor: "grab",
                        transition: "box-shadow 0.15s, transform 0.15s",
                      }}
                      title="Arrastra este paciente a un horario del calendario para agendar"
                    >
                      <p style={{ fontSize: 13.5, fontWeight: 700, color: "#1e293b", marginBottom: 2 }}>{p.name}</p>
                      <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 8px" }}>{p.treatment}</p>

                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.18h3.04a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.08 6.08l.91-.9a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 21.9 17z" />
                        </svg>
                        <span style={{ fontSize: 11.5, color: "#64748b" }}>{p.phone}</span>
                      </div>

                      <p style={{ fontSize: 11, color: "#94a3b8", marginBottom: 10 }}>{p.when}</p>

                      <button
                        className="btn-blue"
                        style={{ width: "100%", justifyContent: "center", padding: "8px 0", fontSize: 12.5, borderRadius: 7 }}
                        onClick={() => handleSchedulePending(p)}
                      >
                        Reagendar
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* ── Bottom Sheet: Pendientes de Reagendar (Mobile) ── */}
      {isMobile && pendingSheetOpen && (
        <div className="bottom-sheet-overlay" onClick={() => setPendingSheetOpen(false)}>
          <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="bottom-sheet-handle" />
            <div className="bottom-sheet-header">
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1e293b" }}>
                  Pendientes de reagendar
                </h3>
                <p style={{ fontSize: 12, color: "#64748b" }}>
                  {pending.length} pacientes en espera
                </p>
              </div>
              <button
                className="btn-ghost"
                style={{ padding: "6px 10px", border: "none", borderRadius: "50%" }}
                onClick={() => setPendingSheetOpen(false)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="bottom-sheet-content">
              {pending.length === 0 ? (
                <div style={{ textAlign: "center", padding: "30px 10px", color: "#94a3b8" }}>
                  No hay pacientes pendientes por reagendar
                </div>
              ) : (
                pending.map((p) => (
                  <div
                    key={p.id}
                    style={{
                      padding: "14px 16px",
                      background: "#ffffff",
                      border: "1px solid #e2e8f0",
                      borderLeft: "4px solid #16a34a",
                      borderRadius: 10,
                      boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                      <h4 style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>{p.name}</h4>
                      <span style={{ fontSize: 11, color: "#94a3b8" }}>{p.when}</span>
                    </div>
                    <p style={{ fontSize: 12.5, color: "#64748b", marginBottom: 8 }}>{p.treatment}</p>

                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12, fontSize: 12, color: "#475569" }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.18h3.04a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.08 6.08l.91-.9a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 21.9 17z" />
                      </svg>
                      <span>{p.phone}</span>
                    </div>

                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        className="btn-blue"
                        style={{ flex: 1, justifyContent: "center", padding: "8px 12px", borderRadius: 8, fontSize: 12.5 }}
                        onClick={() => handleSchedulePending(p)}
                      >
                        📅 Agendar para {DAYS[selectedDayIndex]} {DAY_DATES[selectedDayIndex]}
                      </button>
                      <a
                        href={`tel:${p.phone.replace(/\s+/g, "")}`}
                        className="btn-ghost"
                        style={{ padding: "8px 12px", borderRadius: 8, textDecoration: "none", color: "#1e293b", display: "flex", alignItems: "center" }}
                        title="Llamar"
                      >
                        📞
                      </a>
                      <a
                        href={`https://wa.me/57${p.phone.replace(/\s+/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-ghost"
                        style={{ padding: "8px 12px", borderRadius: 8, textDecoration: "none", color: "#16a34a", display: "flex", alignItems: "center" }}
                        title="WhatsApp"
                      >
                        💬
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── CREATE Modal ── */}
      {modal === "create" && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Nueva cita</span>
              <button className="btn-ghost" style={{ padding: "4px 8px", border: "none" }} onClick={closeModal}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="modal-body">
              <AppointmentForm form={form} setForm={setForm} />
            </div>
            <div className="modal-footer">
              <button className="btn-ghost" onClick={closeModal}>Cancelar</button>
              <button className="btn-orange" onClick={saveCreate}>Guardar cita</button>
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT Modal ── */}
      {modal === "edit" && editId && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Editar cita</span>
              <button className="btn-ghost" style={{ padding: "4px 8px", border: "none" }} onClick={closeModal}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="modal-body">
              <AppointmentForm form={form} setForm={setForm} />
            </div>
            <div className="modal-footer">
              <button className="btn-link-red" onClick={() => setDeleteConfirm(editId)}>
                Eliminar cita
              </button>
              <div style={{ flex: 1 }} />
              <button className="btn-ghost" onClick={closeModal}>Cancelar</button>
              <button className="btn-orange" onClick={saveEdit}>Guardar cambios</button>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE Confirm Modal ── */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal" style={{ maxWidth: 380 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title" style={{ color: "#dc2626" }}>Eliminar cita</span>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 14, color: "#374151" }}>
                ¿Estás seguro de que deseas eliminar esta cita de la agenda? Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn-ghost" onClick={() => setDeleteConfirm(null)}>Cancelar</button>
              <button
                style={{
                  padding: "8px 18px",
                  background: "#dc2626",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: 7,
                  cursor: "pointer",
                  fontWeight: 600,
                  fontFamily: "inherit",
                  fontSize: 13,
                }}
                onClick={() => deleteAppt(deleteConfirm)}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast Message ── */}
      {toast && (
        <div className="toast-msg">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}

// ── Form Sub-component ──
type FormState = ReturnType<typeof emptyForm>;
type FormProps = {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
};

function AppointmentForm({ form, setForm }: FormProps) {
  const f = (field: keyof FormState, val: FormState[keyof FormState]) =>
    setForm((prev) => ({ ...prev, [field]: val }));

  return (
    <>
      <div>
        <label className="form-label">Paciente *</label>
        <input
          className="input"
          placeholder="Nombre del paciente"
          value={form.patient}
          onChange={(e) => f("patient", e.target.value)}
        />
      </div>
      <div>
        <label className="form-label">Tratamiento</label>
        <input
          className="input"
          placeholder="Ej: Limpieza dental, Extracción molar..."
          value={form.treatment}
          onChange={(e) => f("treatment", e.target.value)}
        />
      </div>
      <div>
        <label className="form-label">Doctor</label>
        <select
          className="input"
          value={form.doctor}
          onChange={(e) => f("doctor", e.target.value as Doctor)}
        >
          {DOCTORS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label className="form-label">Día</label>
          <select
            className="input"
            value={form.dayIndex}
            onChange={(e) => f("dayIndex", Number(e.target.value))}
          >
            {DAYS.map((d, i) => (
              <option key={i} value={i}>
                {d} {DAY_DATES[i]} de sept
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="form-label">Hora inicio</label>
          <input
            className="input"
            type="time"
            value={`${String(form.startHour).padStart(2, "0")}:${String(form.startMin).padStart(2, "0")}`}
            onChange={(e) => {
              const [h, m] = e.target.value.split(":").map(Number);
              setForm((prev) => ({ ...prev, startHour: h, startMin: m }));
            }}
          />
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label className="form-label">Duración</label>
          <select
            className="input"
            value={form.durationMin}
            onChange={(e) => f("durationMin", Number(e.target.value))}
          >
            {[30, 45, 60, 75, 90, 105, 120].map((v) => (
              <option key={v} value={v}>{v} min</option>
            ))}
          </select>
        </div>
        <div>
          <label className="form-label">Estado</label>
          <select
            className="input"
            value={form.status}
            onChange={(e) => f("status", e.target.value as Status)}
          >
            <option value="confirmed">Confirmada</option>
            <option value="pending">Pendiente</option>
            <option value="urgent">Urgente</option>
            <option value="cancelled">Cancelada</option>
          </select>
        </div>
      </div>
    </>
  );
}