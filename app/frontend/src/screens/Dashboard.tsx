import { useState, useEffect } from "react";
import type { Screen } from "@/App";

type Props = { onNavigate: (screen: Screen) => void };

const INITIAL_APPOINTMENTS = [
  { id: "1", time: "08:00", patient: "Andrea Morales",  detail: "Limpieza · Dr. Carlos",        status: "confirmed" as const },
  { id: "2", time: "08:45", patient: "Luis Felipe Roa", detail: "Ortodoncia · Dra. Liliana",   status: "confirmed" as const },
  { id: "3", time: "09:30", patient: "Valentina Cruz",  detail: "Extracción · Dr. Carlos",       status: "urgent"    as const },
  { id: "4", time: "10:15", patient: "Mateo Herrera",   detail: "Brackets · Ortodoncista",      status: "confirmed" as const },
  { id: "5", time: "11:00", patient: "Carolina Pinto",  detail: "Odontopediatría · Dra. Liliana", status: "pending"   as const },
  { id: "6", time: "11:30", patient: "Jorge Sánchez",   detail: "Endodoncia · Dr. Carlos",       status: "pending"   as const },
];

const INITIAL_REMINDERS = [
  { id: "r1", patient: "Sofía Mendoza",  detail: "09:00 · Dra. Liliana",  treatment: "Control bimestral", status: "pending" as const },
  { id: "r2", patient: "Ricardo Ávila",  detail: "10:30 · Dr. Carlos",    treatment: "Blanqueamiento",   status: "pending" as const },
  { id: "r3", patient: "Camila Torres",  detail: "11:00 · Ortodoncista",  treatment: "Cambio arco",       status: "pending" as const },
  { id: "r4", patient: "Andrés Ospina",  detail: "14:30 · Control",       treatment: "Revisión implante", status: "pending" as const },
];

const STATUS_MAP = {
  confirmed: { label: "Confirmada", cls: "badge-confirmed" },
  pending:   { label: "Pendiente",  cls: "badge-pending" },
  urgent:    { label: "Urgente",    cls: "badge-urgent" },
  cancelled: { label: "Cancelada",  cls: "badge-cancelled" },
};

export default function Dashboard({ onNavigate }: Props) {
  const [reminders, setReminders] = useState(INITIAL_REMINDERS);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const handleConfirmReminder = (id: string) => {
    setReminders((prev) => prev.map((r) => r.id === id ? { ...r, status: "confirmed" as const } : r));
  };

  const handleCancelReminder = (id: string) => {
    setReminders((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div className="fade-in" style={{ width: "100%", paddingBottom: isMobile ? 20 : 0 }}>
      {/* ── Greeting row ── */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: isMobile ? 14 : 20,
        width: "100%",
        flexWrap: "wrap",
        gap: 8,
      }}>
        <div>
          <h1 style={{
            fontSize: isMobile ? 20 : 24,
            fontWeight: 800,
            color: "#1e293b",
            letterSpacing: "-0.02em",
            lineHeight: 1.2,
          }}>
            ¡Buenos días, Dra. García!
          </h1>
          <p style={{ fontSize: isMobile ? 13 : 14, color: "#64748b", marginTop: 3 }}>
            Hoy tienes <strong style={{ color: "#1e293b", fontWeight: 700 }}>8 citas</strong> programadas
          </p>
        </div>

        {/* Top button only visible on desktop; on mobile we use FAB */}
        {!isMobile && (
          <button className="btn-orange" onClick={() => onNavigate("agenda")} style={{ flexShrink: 0 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Nueva cita
          </button>
        )}
      </div>

      {/* ── 4 Stat Cards: 2x2 Grid on Mobile, 4-col on Desktop ── */}
      <div
        className="stat-cards-grid"
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
          gap: isMobile ? 10 : 16,
          marginBottom: isMobile ? 18 : 26,
          width: "100%",
        }}
      >
        {/* Card 1: Citas hoy */}
        <div className="card card-shadow" style={{ padding: isMobile ? "12px 14px" : "18px 20px", position: "relative" }}>
          <div style={{ position: "absolute", top: 12, right: 12, width: 8, height: 8, borderRadius: "50%", background: "#1d72b8" }} />
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span style={{ fontSize: isMobile ? 24 : 30, fontWeight: 800, color: "#1d72b8", lineHeight: 1 }}>8</span>
            <span style={{ fontSize: isMobile ? 11 : 12, fontWeight: 600, color: "#dc2626" }}>1 urgente</span>
          </div>
          <p style={{ fontSize: isMobile ? 12 : 13, fontWeight: 700, color: "#1e293b", marginTop: 4 }}>Citas hoy</p>
          <p style={{ fontSize: 10.5, color: "#94a3b8", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            Dr. Carlos (4) · Liliana (2)
          </p>
        </div>

        {/* Card 2: Confirmadas mañana */}
        <div className="card card-shadow" style={{ padding: isMobile ? "12px 14px" : "18px 20px", position: "relative" }}>
          <div style={{ position: "absolute", top: 12, right: 12, width: 8, height: 8, borderRadius: "50%", background: "#16a34a" }} />
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span style={{ fontSize: isMobile ? 24 : 30, fontWeight: 800, color: "#16a34a", lineHeight: 1 }}>3</span>
            <span style={{ fontSize: isMobile ? 11 : 12, color: "#64748b" }}>de 7</span>
          </div>
          <p style={{ fontSize: isMobile ? 12 : 13, fontWeight: 700, color: "#1e293b", marginTop: 4 }}>Confirmadas</p>
          <p style={{ fontSize: 10.5, color: "#94a3b8", marginTop: 2 }}>Para mañana</p>
        </div>

        {/* Card 3: Pendientes confirmar */}
        <div className="card card-shadow" style={{ padding: isMobile ? "12px 14px" : "18px 20px", position: "relative" }}>
          <div style={{ position: "absolute", top: 12, right: 12, width: 8, height: 8, borderRadius: "50%", background: "#f59e0b" }} />
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span style={{ fontSize: isMobile ? 24 : 30, fontWeight: 800, color: "#d97706", lineHeight: 1 }}>7</span>
            <span style={{ fontSize: isMobile ? 11 : 12, color: "#d97706" }}>por llamar</span>
          </div>
          <p style={{ fontSize: isMobile ? 12 : 13, fontWeight: 700, color: "#1e293b", marginTop: 4 }}>Pendientes</p>
          <p style={{ fontSize: 10.5, color: "#94a3b8", marginTop: 2 }}>Por confirmar</p>
        </div>

        {/* Card 4: Pacientes activos */}
        <div className="card card-shadow" style={{ padding: isMobile ? "12px 14px" : "18px 20px", position: "relative" }}>
          <div style={{ position: "absolute", top: 12, right: 12, width: 8, height: 8, borderRadius: "50%", background: "#e87a28" }} />
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span style={{ fontSize: isMobile ? 24 : 30, fontWeight: 800, color: "#e87a28", lineHeight: 1 }}>142</span>
            <span style={{ fontSize: isMobile ? 11 : 12, color: "#16a34a" }}>+4 mes</span>
          </div>
          <p style={{ fontSize: isMobile ? 12 : 13, fontWeight: 700, color: "#1e293b", marginTop: 4 }}>Pacientes</p>
          <p style={{ fontSize: 10.5, color: "#94a3b8", marginTop: 2 }}>Activos en clínica</p>
        </div>
      </div>

      {/* ── Bottom Section: Citas del día + Recordatorios ── */}
      <div
        className="dashboard-bottom-grid"
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 360px",
          gap: isMobile ? 14 : 20,
          width: "100%",
        }}
      >
        {/* Left: Citas del día (Compact High-Density List) */}
        <div className="card card-shadow" style={{ overflow: "hidden" }}>
          <div style={{
            padding: isMobile ? "12px 14px" : "16px 20px",
            display: "flex", justifyContent: "space-between", alignItems: "center",
            borderBottom: "1px solid #f1f5f9",
          }}>
            <div>
              <h2 style={{ fontSize: isMobile ? 14.5 : 15.5, fontWeight: 700, color: "#1e293b" }}>
                Citas del día
              </h2>
              <p style={{ fontSize: 11, color: "#64748b", marginTop: 1 }}>Viernes, 18 de septiembre</p>
            </div>
            <span style={{ fontSize: 11.5, background: "#f1f5f9", color: "#64748b", padding: "2px 10px", borderRadius: 99, fontWeight: 600 }}>
              {INITIAL_APPOINTMENTS.length} citas
            </span>
          </div>

          <div>
            {INITIAL_APPOINTMENTS.map((a, i) => (
              <div
                key={a.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                  padding: isMobile ? "9px 14px" : "12px 20px",
                  borderBottom: i < INITIAL_APPOINTMENTS.length - 1 ? "1px solid #f1f5f9" : "none",
                  transition: "background 0.12s",
                }}
              >
                {/* Time badge */}
                <div style={{
                  width: 48,
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#1d72b8",
                  flexShrink: 0,
                }}>
                  {a.time}
                </div>

                {/* Patient & Treatment details */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontSize: 13.5,
                    fontWeight: 700,
                    color: "#1e293b",
                    lineHeight: 1.2,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}>
                    {a.patient}
                  </p>
                  <p style={{
                    fontSize: 11.5,
                    color: "#64748b",
                    marginTop: 2,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}>
                    {a.detail}
                  </p>
                </div>

                {/* Status pill */}
                <div style={{ flexShrink: 0 }}>
                  <span className={`badge ${STATUS_MAP[a.status].cls}`} style={{ fontSize: 10.5, padding: "2px 7px" }}>
                    {STATUS_MAP[a.status].label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Recordatorios de mañana (Compact with Inline Actions) */}
        <div className="card card-shadow" style={{ overflow: "hidden" }}>
          <div style={{
            padding: isMobile ? "12px 14px" : "16px 20px",
            display: "flex", justifyContent: "space-between", alignItems: "center",
            borderBottom: "1px solid #f1f5f9",
          }}>
            <h2 style={{ fontSize: isMobile ? 14.5 : 15.5, fontWeight: 700, color: "#1e293b" }}>
              Recordatorios de mañana
            </h2>
            <span style={{ fontSize: 11.5, color: "#1d72b8", fontWeight: 700 }}>
              {reminders.filter(r => r.status === "pending").length} pendientes
            </span>
          </div>

          <div style={{ padding: isMobile ? "8px 12px" : "12px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
            {reminders.map((r) => (
              <div
                key={r.id}
                style={{
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "1px solid #e2e8f0",
                  background: r.status === "confirmed" ? "#f0fdf4" : "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                  transition: "all 0.15s ease",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", lineHeight: 1.2 }}>{r.patient}</p>
                  <p style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{r.detail} · {r.treatment}</p>
                </div>

                {/* Inline Actions (compact, no extra row!) */}
                {r.status === "confirmed" ? (
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#16a34a", display: "flex", alignItems: "center", gap: 4 }}>
                    ✓ Confirmado
                  </span>
                ) : (
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    <button
                      onClick={() => handleConfirmReminder(r.id)}
                      title="Confirmar cita"
                      style={{
                        padding: "5px 10px",
                        fontSize: 11.5,
                        fontWeight: 700,
                        background: "#16a34a",
                        color: "#fff",
                        border: "none",
                        borderRadius: 6,
                        cursor: "pointer",
                      }}
                    >
                      ✓ Confirmar
                    </button>
                    <button
                      onClick={() => handleCancelReminder(r.id)}
                      title="Cancelar recordatorio"
                      style={{
                        padding: "5px 8px",
                        fontSize: 11.5,
                        background: "transparent",
                        color: "#94a3b8",
                        border: "1px solid #e2e8f0",
                        borderRadius: 6,
                        cursor: "pointer",
                      }}
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Mobile FAB (Floating Action Button) ── */}
      {isMobile && (
        <button
          className="fab-btn"
          onClick={() => onNavigate("agenda")}
          aria-label="Nueva cita"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8">
            <path d="M12 5v14M5 12h14" />
          </svg>
          <span>Nueva cita</span>
        </button>
      )}
    </div>
  );
}