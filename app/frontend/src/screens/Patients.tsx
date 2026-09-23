import { useState, useEffect } from "react";

type BalanceStatus = "all" | "pendiente" | "al-dia";
type Patient = {
  id: string;
  initials: string;
  name: string;
  cedula: string;
  doctor: string;
  phone: string;
  lastVisit: string;
  nextAppt: string | null;
  balance: number; // 0 = al día
};

const PATIENTS: Patient[] = [
  { id: "1",  initials: "AM", name: "Andrea Morales Gómez",    cedula: "1.032.458.771", doctor: "Dr. Carlos",   phone: "310 452 8814", lastVisit: "14/09/2026", nextAppt: "21/09/2026", balance: 0 },
  { id: "2",  initials: "LF", name: "Luis Felipe Roa Vargas",  cedula: "1.019.874.332", doctor: "Ortodoncista",  phone: "315 887 3301", lastVisit: "10/09/2026", nextAppt: "17/09/2026", balance: 120000 },
  { id: "3",  initials: "VC", name: "Valentina Cruz Salcedo",  cedula: "1.075.312.445", doctor: "Dr. Carlos",   phone: "300 112 5590", lastVisit: "14/09/2026", nextAppt: null,          balance: 350000 },
  { id: "4",  initials: "MH", name: "Mateo Herrera Ríos",      cedula: "1.000.987.213", doctor: "Ortodoncista",  phone: "317 654 9922", lastVisit: "07/09/2026", nextAppt: "14/09/2026", balance: 0 },
  { id: "5",  initials: "CP", name: "Carolina Pinto Londoño",  cedula: "1.094.562.881", doctor: "Dra. Liliana", phone: "321 998 7730", lastVisit: "01/09/2026", nextAppt: "14/09/2026", balance: 75000 },
  { id: "6",  initials: "JS", name: "Jorge Sánchez Duque",     cedula: "79.654.321",    doctor: "Dr. Carlos",   phone: "312 333 7788", lastVisit: "05/09/2026", nextAppt: "14/09/2026", balance: 200000 },
  { id: "7",  initials: "IR", name: "Isabela Romero Castillo", cedula: "1.030.987.654", doctor: "Control",      phone: "316 221 8877", lastVisit: "28/08/2026", nextAppt: "14/09/2026", balance: 0 },
  { id: "8",  initials: "DV", name: "Daniel Vargas Peñaranda", cedula: "1.022.334.556", doctor: "Dr. Carlos",   phone: "313 445 6609", lastVisit: "14/09/2026", nextAppt: "28/09/2026", balance: 450000 },
  { id: "9",  initials: "SM", name: "Sofía Mendoza Arango",    cedula: "1.001.234.876", doctor: "Dra. Liliana", phone: "318 776 2200", lastVisit: "15/08/2026", nextAppt: "15/09/2026", balance: 0 },
];

export default function Patients() {
  const [search, setSearch] = useState("");
  const [filterBalance, setFilterBalance] = useState<BalanceStatus>("all");
  const [isMobile, setIsMobile] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const pendingCount = PATIENTS.filter(p => p.balance > 0).length;
  const upToDateCount = PATIENTS.filter(p => p.balance === 0).length;

  const filtered = PATIENTS.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.cedula.includes(search);
    const matchBalance =
      filterBalance === "all" ||
      (filterBalance === "pendiente" && p.balance > 0) ||
      (filterBalance === "al-dia" && p.balance === 0);
    return matchSearch && matchBalance;
  });

  const fmt = (n: number) => `$ ${n.toLocaleString("es-CO")}`;

  return (
    <div className="fade-in" style={{ width: "100%", paddingBottom: isMobile ? 24 : 0 }}>
      {/* ── Top search & create button ── */}
      <div style={{
        display: "flex",
        gap: 12,
        alignItems: "center",
        marginBottom: isMobile ? 12 : 18,
        width: "100%",
        flexWrap: "wrap",
        justifyContent: "space-between",
      }}>
        <div style={{ position: "relative", flex: 1, minWidth: isMobile ? "100%" : 280, maxWidth: isMobile ? "100%" : 380 }}>
          <svg
            style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.3-4.3" />
          </svg>
          <input
            className="input"
            style={{ paddingLeft: 36, background: "#ffffff", border: "1px solid #cbd5e1", width: "100%" }}
            placeholder="Buscar por nombre o cédula..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {!isMobile && (
          <div>
            <button className="btn-orange">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Nuevo paciente
            </button>
          </div>
        )}
      </div>

      {/* ── Filter indicators row ── */}
      <div style={{
        display: "flex",
        gap: 8,
        marginBottom: 16,
        alignItems: "center",
        overflowX: "auto",
        paddingBottom: 4,
        width: "100%",
        scrollbarWidth: "none",
      }}>
        <button
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "6px 12px", borderRadius: 8, background: "#ffffff",
            border: filterBalance === "all" ? "1.5px solid #1d72b8" : "1px solid #e2e8f0",
            cursor: "pointer", fontFamily: "inherit", flexShrink: 0,
          }}
          onClick={() => setFilterBalance("all")}
        >
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#1d72b8" }} />
          <span style={{ fontSize: 12, color: "#334155" }}>
            Total: <strong style={{ color: "#1e293b" }}>{PATIENTS.length}</strong>
          </span>
        </button>

        <button
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "6px 12px", borderRadius: 8, background: "#ffffff",
            border: filterBalance === "pendiente" ? "1.5px solid #dc2626" : "1px solid #e2e8f0",
            cursor: "pointer", fontFamily: "inherit", flexShrink: 0,
          }}
          onClick={() => setFilterBalance("pendiente")}
        >
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#dc2626" }} />
          <span style={{ fontSize: 12, color: "#334155" }}>
            Con saldo pendiente: <strong style={{ color: "#dc2626" }}>{pendingCount}</strong>
          </span>
        </button>

        <button
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "6px 12px", borderRadius: 8, background: "#ffffff",
            border: filterBalance === "al-dia" ? "1.5px solid #16a34a" : "1px solid #e2e8f0",
            cursor: "pointer", fontFamily: "inherit", flexShrink: 0,
          }}
          onClick={() => setFilterBalance("al-dia")}
        >
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#16a34a" }} />
          <span style={{ fontSize: 12, color: "#334155" }}>
            Al día: <strong style={{ color: "#16a34a" }}>{upToDateCount}</strong>
          </span>
        </button>
      </div>

      {/* ── MOBILE VIEW: Transform rows into Cards (List View) ── */}
      {isMobile ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.length === 0 ? (
            <div className="card card-shadow" style={{ padding: "30px 20px", textAlign: "center", color: "#94a3b8" }}>
              No se encontraron pacientes
            </div>
          ) : (
            filtered.map((p) => (
              <div
                key={p.id}
                className="card card-shadow"
                style={{
                  padding: "14px 16px",
                  borderRadius: 12,
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  transition: "box-shadow 0.15s ease",
                }}
                onClick={() => setSelectedPatient(p)}
              >
                {/* Header: Avatar, Name & Saldo Badge */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
                      background: "#dbeafe", color: "#1d72b8",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12.5, fontWeight: 700,
                    }}>
                      {p.initials}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <h4 style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: "#1e293b",
                        lineHeight: 1.25,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}>
                        {p.name}
                      </h4>
                      <p style={{ fontSize: 11.5, color: "#64748b", marginTop: 2 }}>
                        {p.cedula} · <span style={{ color: "#1d72b8", fontWeight: 600 }}>{p.doctor}</span>
                      </p>
                    </div>
                  </div>

                  {/* Balance Badge */}
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      padding: "3px 8px",
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 700,
                      flexShrink: 0,
                      background: p.balance === 0 ? "#f0fdf4" : "#fef2f2",
                      color: p.balance === 0 ? "#16a34a" : "#dc2626",
                      border: `1px solid ${p.balance === 0 ? "#bbf7d0" : "#fecaca"}`,
                    }}
                  >
                    {p.balance === 0 ? "✓ Al día" : `${fmt(p.balance)}`}
                  </span>
                </div>

                {/* 2-column info snippet */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 8,
                  padding: "8px 10px",
                  background: "#f8fafc",
                  borderRadius: 8,
                  fontSize: 11.5,
                  margin: "8px 0 10px",
                }}>
                  <div>
                    <span style={{ color: "#94a3b8", display: "block", fontSize: 10, textTransform: "uppercase", fontWeight: 600 }}>
                      Última visita
                    </span>
                    <span style={{ color: "#334155", fontWeight: 600 }}>{p.lastVisit}</span>
                  </div>
                  <div>
                    <span style={{ color: "#94a3b8", display: "block", fontSize: 10, textTransform: "uppercase", fontWeight: 600 }}>
                      Próxima cita
                    </span>
                    <span style={{ color: p.nextAppt ? "#1d72b8" : "#94a3b8", fontWeight: p.nextAppt ? 700 : 500 }}>
                      {p.nextAppt || "Sin cita agendada"}
                    </span>
                  </div>
                </div>

                {/* Actions & Phone footer */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }} onClick={(e) => e.stopPropagation()}>
                  <a
                    href={`tel:${p.phone.replace(/\s+/g, "")}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      fontSize: 12,
                      color: "#1d72b8",
                      textDecoration: "none",
                      fontWeight: 600,
                    }}
                  >
                    📞 {p.phone}
                  </a>

                  <div style={{ display: "flex", gap: 6 }}>
                    <a
                      href={`https://wa.me/57${p.phone.replace(/\s+/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-ghost"
                      style={{ padding: "4px 8px", fontSize: 11, borderRadius: 6, textDecoration: "none", color: "#16a34a" }}
                    >
                      💬 WhatsApp
                    </a>
                    <button
                      className="btn-ghost"
                      style={{ padding: "4px 8px", fontSize: 11, borderRadius: 6 }}
                      onClick={() => setSelectedPatient(p)}
                    >
                      Ver ficha ›
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* ── DESKTOP VIEW: Classical Table ── */
        <div className="card card-shadow" style={{ overflow: "hidden" }}>
          {/* Table header */}
          <div className="tbl-head" style={{ gridTemplateColumns: "2.2fr 1.2fr 1.1fr 1.1fr 1.1fr 90px" }}>
            <span>Paciente</span>
            <span>Teléfono</span>
            <span>Última visita</span>
            <span>Próxima cita</span>
            <span>Saldo</span>
            <span />
          </div>

          {/* Table body */}
          {filtered.length === 0 ? (
            <div style={{ padding: "40px 20px", textAlign: "center", color: "#94a3b8", fontSize: 14 }}>
              No se encontraron pacientes
            </div>
          ) : (
            filtered.map((p) => (
              <div
                key={p.id}
                className="tbl-row"
                style={{ gridTemplateColumns: "2.2fr 1.2fr 1.1fr 1.1fr 1.1fr 90px" }}
              >
                {/* Patient with circle avatar */}
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
                    background: "#dbeafe", color: "#1d72b8",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11.5, fontWeight: 700,
                  }}>
                    {p.initials}
                  </div>
                  <div>
                    <p style={{ fontSize: 13.5, fontWeight: 700, color: "#1e293b" }}>{p.name}</p>
                    <p style={{ fontSize: 11.5, color: "#94a3b8" }}>{p.cedula} · {p.doctor}</p>
                  </div>
                </div>

                <p style={{ fontSize: 13, color: "#334155" }}>{p.phone}</p>
                <p style={{ fontSize: 13, color: "#334155" }}>{p.lastVisit}</p>

                {/* Next appointment */}
                {p.nextAppt ? (
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{p.nextAppt}</p>
                ) : (
                  <p style={{ fontSize: 12.5, fontStyle: "italic", color: "#94a3b8" }}>Sin cita</p>
                )}

                {/* Balance */}
                {p.balance === 0 ? (
                  <div>
                    <span style={{
                      display: "inline-flex", padding: "3px 10px", borderRadius: 6,
                      background: "#f0fdf4", color: "#16a34a",
                      fontSize: 12, fontWeight: 600,
                    }}>
                      Al día
                    </span>
                  </div>
                ) : (
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#dc2626" }}>
                    {fmt(p.balance)}
                  </span>
                )}

                {/* Actions */}
                <button
                  className="btn-ghost"
                  style={{ padding: "4px 10px", fontSize: 12 }}
                  onClick={() => setSelectedPatient(p)}
                >
                  Ver ficha
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Patient Details Modal ── */}
      {selectedPatient && (
        <div className="modal-overlay" onClick={() => setSelectedPatient(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <div className="modal-header">
              <span className="modal-title">Ficha del Paciente</span>
              <button className="btn-ghost" style={{ padding: "4px 8px", border: "none" }} onClick={() => setSelectedPatient(null)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="modal-body">
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 6 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: "50%",
                  background: "#1d72b8", color: "#ffffff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 16, fontWeight: 800,
                }}>
                  {selectedPatient.initials}
                </div>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: "#1e293b" }}>{selectedPatient.name}</h3>
                  <p style={{ fontSize: 12.5, color: "#64748b" }}>C.C. {selectedPatient.cedula}</p>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, padding: "12px", background: "#f8fafc", borderRadius: 8 }}>
                <div>
                  <span style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase", fontWeight: 700 }}>Doctor asignado</span>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", marginTop: 2 }}>{selectedPatient.doctor}</p>
                </div>
                <div>
                  <span style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase", fontWeight: 700 }}>Teléfono</span>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#1d72b8", marginTop: 2 }}>{selectedPatient.phone}</p>
                </div>
                <div>
                  <span style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase", fontWeight: 700 }}>Última visita</span>
                  <p style={{ fontSize: 13, color: "#334155", marginTop: 2 }}>{selectedPatient.lastVisit}</p>
                </div>
                <div>
                  <span style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase", fontWeight: 700 }}>Próxima cita</span>
                  <p style={{ fontSize: 13, fontWeight: 700, color: selectedPatient.nextAppt ? "#1d72b8" : "#94a3b8", marginTop: 2 }}>
                    {selectedPatient.nextAppt || "Sin cita agendada"}
                  </p>
                </div>
              </div>

              <div style={{ padding: "12px 14px", borderRadius: 8, background: selectedPatient.balance === 0 ? "#f0fdf4" : "#fef2f2", border: `1px solid ${selectedPatient.balance === 0 ? "#bbf7d0" : "#fecaca"}` }}>
                <span style={{ fontSize: 11, color: selectedPatient.balance === 0 ? "#16a34a" : "#dc2626", textTransform: "uppercase", fontWeight: 700 }}>Estado de cuenta</span>
                <p style={{ fontSize: 16, fontWeight: 800, color: selectedPatient.balance === 0 ? "#16a34a" : "#dc2626", marginTop: 2 }}>
                  {selectedPatient.balance === 0 ? "Al día (Sin saldo pendiente)" : `Saldo pendiente: ${fmt(selectedPatient.balance)}`}
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <a
                href={`tel:${selectedPatient.phone.replace(/\s+/g, "")}`}
                className="btn-ghost"
                style={{ textDecoration: "none", color: "#1e293b" }}
              >
                📞 Llamar
              </a>
              <a
                href={`https://wa.me/57${selectedPatient.phone.replace(/\s+/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="btn-teal"
                style={{ textDecoration: "none" }}
              >
                💬 WhatsApp
              </a>
              <button className="btn-blue" onClick={() => setSelectedPatient(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Mobile FAB for New Patient ── */}
      {isMobile && (
        <button
          className="fab-btn"
          onClick={() => alert("Formulario para crear nuevo paciente")}
          aria-label="Nuevo paciente"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8">
            <path d="M12 5v14M5 12h14" />
          </svg>
          <span>Nuevo paciente</span>
        </button>
      )}
    </div>
  );
}