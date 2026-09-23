import { useState, useEffect } from "react";

type Payment = {
  date: string;
  concept: string;
  amount: number;
  remaining: number;
  method: "Efectivo" | "Transferencia" | "Datáfono";
  signature: string;
};

type PatientAccount = {
  id: string;
  label: string;
  totalCost: number;
  totalPaid: number;
  payments: Payment[];
};

const ACCOUNTS: PatientAccount[] = [
  {
    id: "vc",
    label: "Valentina Cruz Salcedo – 1.075.312.445",
    totalCost: 850000,
    totalPaid: 500000,
    payments: [
      { date: "10/08/2026", concept: "Cuota inicial – Extracción molar", amount: 200000, remaining: 650000, method: "Efectivo",      signature: "V. Cruz" },
      { date: "25/08/2026", concept: "2.ª cuota",                        amount: 150000, remaining: 500000, method: "Transferencia",  signature: "V. Cruz" },
      { date: "05/09/2026", concept: "3.ª cuota",                        amount: 150000, remaining: 350000, method: "Datáfono",       signature: "V. Cruz" },
    ],
  },
  {
    id: "lf",
    label: "Luis Felipe Roa Vargas – 1.019.874.332",
    totalCost: 500000,
    totalPaid: 380000,
    payments: [
      { date: "01/08/2026", concept: "Cuota inicial – Ortodoncia", amount: 200000, remaining: 300000, method: "Efectivo",      signature: "L. Roa" },
      { date: "15/08/2026", concept: "2.ª cuota",                  amount: 180000, remaining: 120000, method: "Transferencia",  signature: "L. Roa" },
    ],
  },
  {
    id: "am",
    label: "Andrea Morales Gómez – 1.032.458.771",
    totalCost: 250000,
    totalPaid: 250000,
    payments: [
      { date: "14/09/2026", concept: "Pago total – Limpieza", amount: 250000, remaining: 0, method: "Datáfono", signature: "A. Morales" },
    ],
  },
];

const METHOD_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  Efectivo:      { bg: "#f1f5f9", color: "#475569", border: "#cbd5e1" },
  Transferencia: { bg: "#e0f2fe", color: "#0284c7", border: "#bae6fd" },
  Datáfono:      { bg: "#dcfce7", color: "#15803d", border: "#bbf7d0" },
};

const fmt = (n: number) => `$ ${n.toLocaleString("es-CO")}`;

const DAILY_DOCTORS = [
  { name: "Dr. Carlos",               amount: 1150000 },
  { name: "Dra. Liliana – Odontoped.", amount: 420000 },
  { name: "Ortodoncista",              amount: 780000 },
  { name: "Controles",                 amount: 150000 },
];

const DAILY_METHODS = [
  { method: "Transferencia", amount: 980000 },
  { method: "Datáfono",      amount: 870000 },
  { method: "Efectivo",      amount: 650000 },
];

const DAILY_TOTAL = 2500000;
const CASH_SHOULD = 680000;
const CASH_IS     = 650000;

export default function Payments() {
  const [selectedId, setSelectedId] = useState("vc");
  const [isMobile, setIsMobile] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0); // First card expanded by default

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const account = ACCOUNTS.find((a) => a.id === selectedId) ?? ACCOUNTS[0];
  const pending = account.totalCost - account.totalPaid;
  const progress = Math.round((account.totalPaid / account.totalCost) * 100);

  const toggleAccordion = (idx: number) => {
    setExpandedIndex(expandedIndex === idx ? null : idx);
  };

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: isMobile ? 12 : 16, width: "100%", paddingBottom: isMobile ? 24 : 0 }}>
      {/* ── Card 1: Patient Select + Financial Summary ── */}
      <div className="card card-shadow" style={{ padding: isMobile ? "14px 16px" : "18px 22px" }}>
        {/* Patient dropdown */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 11.5, color: "#64748b", fontWeight: 700, display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.03em" }}>
            Seleccionar paciente
          </label>
          <select
            className="input"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            style={{ background: "#ffffff", borderColor: "#cbd5e1", fontWeight: 600, width: "100%", fontSize: isMobile ? 13 : 14 }}
          >
            {ACCOUNTS.map((a) => (
              <option key={a.id} value={a.id}>{a.label}</option>
            ))}
          </select>
        </div>

        {/* Financial Metrics: 3 compact boxes */}
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "repeat(3, 1fr)" : "repeat(3, 1fr)",
          gap: isMobile ? 8 : 16,
          marginBottom: 14,
        }}>
          {/* Metric 1: Costo total */}
          <div style={{
            background: "#f8fafc",
            borderRadius: 8,
            padding: isMobile ? "8px 10px" : "12px 16px",
            border: "1px solid #e2e8f0",
          }}>
            <p style={{ fontSize: isMobile ? 10.5 : 12, color: "#64748b", fontWeight: 600 }}>Costo total</p>
            <p style={{ fontSize: isMobile ? 15 : 22, fontWeight: 800, color: "#1d72b8", marginTop: 2 }}>
              {fmt(account.totalCost)}
            </p>
          </div>

          {/* Metric 2: Total abonado */}
          <div style={{
            background: "#f0fdf4",
            borderRadius: 8,
            padding: isMobile ? "8px 10px" : "12px 16px",
            border: "1px solid #bbf7d0",
          }}>
            <p style={{ fontSize: isMobile ? 10.5 : 12, color: "#15803d", fontWeight: 600 }}>Abonado</p>
            <p style={{ fontSize: isMobile ? 15 : 22, fontWeight: 800, color: "#16a34a", marginTop: 2 }}>
              {fmt(account.totalPaid)}
            </p>
          </div>

          {/* Metric 3: Saldo pendiente */}
          <div style={{
            background: pending > 0 ? "#fef2f2" : "#f8fafc",
            borderRadius: 8,
            padding: isMobile ? "8px 10px" : "12px 16px",
            border: `1px solid ${pending > 0 ? "#fecaca" : "#e2e8f0"}`,
          }}>
            <p style={{ fontSize: isMobile ? 10.5 : 12, color: pending > 0 ? "#b91c1c" : "#64748b", fontWeight: 600 }}>Pendiente</p>
            <p style={{ fontSize: isMobile ? 15 : 22, fontWeight: 800, color: pending > 0 ? "#dc2626" : "#16a34a", marginTop: 2 }}>
              {fmt(pending)}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
            <span style={{ fontSize: 11.5, color: "#64748b" }}>Progreso de pago del tratamiento</span>
            <span style={{ fontSize: 11.5, color: "#1e293b", fontWeight: 700 }}>{progress}%</span>
          </div>
          <div className="progress-track" style={{ height: 6 }}>
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      {/* ── Card 2: Historial de abonos (Mobile Cards / Accordion vs Desktop Table) ── */}
      <div className="card card-shadow" style={{ overflow: "hidden" }}>
        {/* Header */}
        <div style={{
          padding: isMobile ? "12px 16px" : "16px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid #f1f5f9",
          flexWrap: "wrap",
          gap: 8,
        }}>
          <div>
            <p style={{ fontSize: isMobile ? 14 : 15, fontWeight: 700, color: "#1e293b" }}>
              Historial de abonos — <span style={{ color: "#1d72b8" }}>{account.label.split(" – ")[0]}</span>
            </p>
            <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>
              {account.payments.length} transacciones registradas
            </p>
          </div>
          <button
            style={{
              background: "none", border: "1px solid #cbd5e1", cursor: "pointer",
              color: "#1d72b8", fontSize: 12, fontWeight: 600, fontFamily: "inherit",
              display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 6,
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
            Recibo
          </button>
        </div>

        {/* MOBILE VIEW: Cards / Expandable Accordion */}
        {isMobile ? (
          <div style={{ display: "flex", flexDirection: "column", padding: "10px 12px", gap: 8 }}>
            {account.payments.map((p, i) => {
              const isExpanded = expandedIndex === i;
              const mStyle = METHOD_STYLES[p.method] || METHOD_STYLES["Efectivo"];
              return (
                <div
                  key={i}
                  style={{
                    borderRadius: 10,
                    border: "1px solid #e2e8f0",
                    background: "#ffffff",
                    overflow: "hidden",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                    transition: "border-color 0.15s ease",
                  }}
                >
                  {/* Collapsed / Header Row: Concept, Date, Amount & Chevron */}
                  <div
                    onClick={() => toggleAccordion(i)}
                    style={{
                      padding: "12px 14px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 8,
                      background: isExpanded ? "#f8fafc" : "#ffffff",
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p style={{ fontSize: 13.5, fontWeight: 700, color: "#1e293b", lineHeight: 1.25 }}>
                        {p.concept}
                      </p>
                      <p style={{ fontSize: 11.5, color: "#64748b", marginTop: 3 }}>
                        🗓️ {p.date}
                      </p>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                      <span style={{ fontSize: 14.5, fontWeight: 800, color: "#16a34a" }}>
                        {fmt(p.amount)}
                      </span>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#94a3b8"
                        strokeWidth="2.5"
                        style={{
                          transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                          transition: "transform 0.2s ease",
                        }}
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </div>
                  </div>

                  {/* Expanded Content: Stacked details without horizontal scrolling! */}
                  {isExpanded && (
                    <div style={{
                      padding: "10px 14px 14px",
                      borderTop: "1px solid #f1f5f9",
                      background: "#ffffff",
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 12, color: "#64748b" }}>Método de pago:</span>
                        <span style={{
                          padding: "2px 8px",
                          borderRadius: 6,
                          fontSize: 11.5,
                          fontWeight: 700,
                          background: mStyle.bg,
                          color: mStyle.color,
                          border: `1px solid ${mStyle.border}`,
                        }}>
                          {p.method}
                        </span>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 12, color: "#64748b" }}>Saldo restante:</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: p.remaining > 0 ? "#dc2626" : "#16a34a" }}>
                          {fmt(p.remaining)}
                        </span>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 4, borderTop: "1px dashed #f1f5f9" }}>
                        <span style={{ fontSize: 12, color: "#64748b" }}>Firma de conformidad:</span>
                        <span style={{ fontSize: 13, color: "#334155", fontStyle: "italic", fontFamily: "serif", fontWeight: 600 }}>
                          {p.signature}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* DESKTOP VIEW: Table */
          <div style={{ overflowX: "auto" }}>
            <div className="tbl-head" style={{ gridTemplateColumns: "120px 2fr 1.1fr 1.1fr 1.1fr 90px", borderRadius: 0, minWidth: 620 }}>
              {["Fecha", "Concepto", "Monto", "Saldo restante", "Método", "Firma"].map((h) => (
                <span key={h}>{h}</span>
              ))}
            </div>

            <div style={{ minWidth: 620 }}>
              {account.payments.map((p, i) => (
                <div
                  key={i}
                  className="tbl-row"
                  style={{ gridTemplateColumns: "120px 2fr 1.1fr 1.1fr 1.1fr 90px" }}
                >
                  <p style={{ fontSize: 13, color: "#64748b" }}>{p.date}</p>
                  <p style={{ fontSize: 13, color: "#1d72b8", fontWeight: 600 }}>{p.concept}</p>
                  <p style={{ fontSize: 13.5, fontWeight: 700, color: "#16a34a" }}>{fmt(p.amount)}</p>
                  <p style={{ fontSize: 13, color: "#1e293b", fontWeight: 600 }}>{fmt(p.remaining)}</p>

                  <div>
                    <span style={{
                      display: "inline-flex", padding: "3px 10px", borderRadius: 6, fontSize: 11.5, fontWeight: 600,
                      background: METHOD_STYLES[p.method]?.bg ?? "#f1f5f9",
                      color: METHOD_STYLES[p.method]?.color ?? "#64748b",
                    }}>
                      {p.method}
                    </span>
                  </div>

                  <p style={{ fontSize: 13, color: "#475569", fontStyle: "italic", fontFamily: "serif" }}>
                    {p.signature}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Card 3: Cierre de caja diario ── */}
      <div className="card card-shadow" style={{ padding: isMobile ? "14px 16px" : "18px 22px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
          <div>
            <p style={{ fontSize: isMobile ? 14 : 15, fontWeight: 700, color: "#1e293b" }}>Cierre de caja diario</p>
            <p style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 2 }}>Viernes, 18 de septiembre de 2026</p>
          </div>
          <button className="btn-blue" style={{ fontSize: 12, padding: "6px 12px" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            Generar PDF
          </button>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
          gap: isMobile ? 16 : 24,
        }}>
          {/* Column 1: Recaudo por doctor */}
          <div style={{ background: isMobile ? "#f8fafc" : "transparent", padding: isMobile ? "12px" : 0, borderRadius: 8 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
              Recaudo por doctor
            </p>
            {DAILY_DOCTORS.map((d) => (
              <div key={d.name} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#1d72b8", flexShrink: 0 }} />
                  <span style={{ fontSize: 12.5, color: "#334155" }}>{d.name}</span>
                </div>
                <span style={{ fontSize: 12.5, color: "#1e293b", fontWeight: 600 }}>{fmt(d.amount)}</span>
              </div>
            ))}
            <div style={{ borderTop: "1px solid #e2e8f0", marginTop: 8, paddingTop: 8, display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: "#1e293b" }}>Total</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: "#1d72b8" }}>{fmt(DAILY_TOTAL)}</span>
            </div>
          </div>

          {/* Column 2: Recaudo por método */}
          <div style={{ background: isMobile ? "#f8fafc" : "transparent", padding: isMobile ? "12px" : 0, borderRadius: 8 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
              Recaudo por método
            </p>
            {DAILY_METHODS.map((m) => (
              <div key={m.method} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, alignItems: "center" }}>
                <span style={{
                  padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                  background: METHOD_STYLES[m.method]?.bg ?? "#f1f5f9",
                  color: METHOD_STYLES[m.method]?.color ?? "#64748b",
                }}>
                  {m.method}
                </span>
                <span style={{ fontSize: 12.5, color: "#1e293b", fontWeight: 600 }}>{fmt(m.amount)}</span>
              </div>
            ))}
            <div style={{ borderTop: "1px solid #e2e8f0", marginTop: 8, paddingTop: 8, display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: "#1e293b" }}>Total recaudado</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: "#1d72b8" }}>{fmt(DAILY_TOTAL)}</span>
            </div>
          </div>

          {/* Column 3: Conciliación de efectivo */}
          <div style={{ background: isMobile ? "#f8fafc" : "transparent", padding: isMobile ? "12px" : 0, borderRadius: 8 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
              Conciliación de efectivo
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "8px 12px", borderRadius: 8, background: "#ffffff", border: "1px solid #e2e8f0",
              }}>
                <span style={{ fontSize: 12, color: "#64748b" }}>Debería haber</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{fmt(CASH_SHOULD)}</span>
              </div>

              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "8px 12px", borderRadius: 8, background: "#ffffff", border: "1px solid #e2e8f0",
              }}>
                <span style={{ fontSize: 12, color: "#64748b" }}>Hay en caja</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{fmt(CASH_IS)}</span>
              </div>

              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "8px 12px", borderRadius: 8, background: "#fee2e2", border: "1px solid #fca5a5",
              }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#dc2626" }}>Diferencia</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: "#dc2626" }}>$ -30.000</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}