import "./index.css";
import { useState, useEffect, useCallback, useRef } from "react";
import type { ReactNode, ReactElement } from "react";
import Dashboard from "@/screens/Dashboard";
import Agenda from "@/screens/Agenda";
import Patients from "@/screens/Patients";
import Payments from "@/screens/Payments";

export type Screen = "inicio" | "agenda" | "pacientes" | "pagos";

export interface UserAccount {
  id: string;
  name: string;
  role: string;
  avatar: string;
  initials: string;
  doctorName?: string;
}

export const USER_ACCOUNTS: UserAccount[] = [
  { id: "carlos", name: "Dr. Carlos", role: "Odontología", avatar: "👨‍⚕️", initials: "DC", doctorName: "Dr. Carlos" },
  { id: "liliana", name: "Dra. Liliana", role: "Odontopediatría", avatar: "👩‍⚕️", initials: "DL", doctorName: "Dra. Liliana – Odontopediatría" },
  { id: "ortodoncia", name: "Ortodoncista", role: "Ortodoncia", avatar: "🦷", initials: "OR", doctorName: "Ortodoncista" },
  { id: "secretaria", name: "Secretaría", role: "Recepción & Caja", avatar: "📋", initials: "SEC" },
  { id: "garcia", name: "Dra. García", role: "Administrador", avatar: "🏥", initials: "DG" },
];

interface NavItem {
  id: Screen;
  label: string;
  icon: ReactElement;
}

const NAV: NavItem[] = [
  {
    id: "inicio",
    label: "Inicio",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    id: "agenda",
    label: "Agenda",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    ),
  },
  {
    id: "pacientes",
    label: "Pacientes",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    id: "pagos",
    label: "Pagos",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M2 10h20" />
      </svg>
    ),
  },
];

const PAGE_NAMES: Record<Screen, string> = {
  inicio: "Inicio",
  agenda: "Agenda",
  pacientes: "Pacientes",
  pagos: "Pagos",
};

export default function App() {
  const [current, setCurrent] = useState<Screen>("agenda");
  const [activeAccount, setActiveAccount] = useState<UserAccount>(USER_ACCOUNTS[0]);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [moreDrawerOpen, setMoreDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isNavVisible, setIsNavVisible] = useState(true);
  const lastScrollY = useRef(0);

  const today = new Date().toLocaleDateString("es-CO", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    setMounted(true);
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Handle scroll to dynamically hide/show bottom bar
  const handleContentScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const currentScrollY = e.currentTarget.scrollTop;
    const diff = currentScrollY - lastScrollY.current;

    if (currentScrollY <= 15) {
      setIsNavVisible(true);
    } else if (diff > 10) {
      // Scrolling down -> hide nav
      setIsNavVisible(false);
    } else if (diff < -10) {
      // Scrolling up -> show nav
      setIsNavVisible(true);
    }
    lastScrollY.current = currentScrollY;
  };

  const handleNavigate = useCallback((screen: Screen) => {
    setCurrent(screen);
    setIsNavVisible(true);
  }, []);

  const screens: Record<Screen, ReactNode> = {
    inicio: <Dashboard onNavigate={handleNavigate} />,
    agenda: <Agenda activeDoctor={activeAccount.doctorName} />,
    pacientes: <Patients />,
    pagos: <Payments />,
  };

  if (!mounted) {
    return (
      <div id="app-root" style={{ display: "flex", width: "100vw", height: "100vh", overflow: "hidden" }}>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#f4f6f9" }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", border: "3px solid #e2e8f0", borderTopColor: "#1d72b8", animation: "spin 1s linear infinite" }} />
        </div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div id="app-root" style={{ display: "flex", width: "100vw", height: "100dvh", overflow: "hidden" }}>
      {/* ── Sidebar (Desktop) ── */}
      <aside className="sidebar">
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8">
              <path d="M12 2C8.5 2 6 4.5 6 7c0 2 1 3.5 1 5 0 2-1 4-1 6s1 3 2 3 2-1.5 2-3c0-1 .5-2 2-2s2 1 2 2c0 1.5 1 3 2 3s2-1 2-3-1-4-1-6c0-1.5 1-3 1-5 0-2.5-2.5-5-6-5z" />
            </svg>
          </div>
          <div className="sidebar-clinic">
            <div className="sidebar-clinic-name">García Osorio</div>
            <div className="sidebar-clinic-sub">Clínica Odontológica</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          {NAV.map((item) => (
            <button
              key={item.id}
              className={`nav-item${current === item.id ? " active" : ""}`}
              onClick={() => handleNavigate(item.id)}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        {/* User Badge in Sidebar */}
        <div className="sidebar-user" style={{ cursor: "pointer" }} onClick={() => setAccountMenuOpen(true)}>
          <div className="sidebar-avatar">{activeAccount.initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="sidebar-user-name" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {activeAccount.name}
            </div>
            <div className="sidebar-user-role">{activeAccount.role}</div>
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8ba2b8" strokeWidth="2">
            <path d="M7 15l5 5 5-5M7 9l5-5 5-5" />
          </svg>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="main-area">
        {/* Topbar */}
        <header className="topbar">
          <div className="topbar-left">
            <div className="topbar-page-block">
              <span className="topbar-page">{PAGE_NAMES[current]}</span>
              <span className="topbar-date">{today}</span>
            </div>
          </div>

          <div className="topbar-right">
            {/* Account Switcher Pill */}
            <div style={{ position: "relative" }}>
              <button
                className="account-selector-btn"
                onClick={() => setAccountMenuOpen((prev) => !prev)}
                title="Cambiar cuenta en uso"
                aria-expanded={accountMenuOpen}
              >
                <div className="account-avatar">{activeAccount.initials}</div>
                <div className="account-info">
                  <span className="account-name">{activeAccount.name}</span>
                  <span className="account-role">{activeAccount.role}</span>
                </div>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" style={{ marginLeft: 2 }}>
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {accountMenuOpen && (
                <>
                  <div
                    style={{ position: "fixed", inset: 0, zIndex: 99 }}
                    onClick={() => setAccountMenuOpen(false)}
                  />
                  <div className="account-dropdown-menu">
                    <div className="account-dropdown-header">Cambiar cuenta activa</div>
                    {USER_ACCOUNTS.map((acc) => (
                      <button
                        key={acc.id}
                        className={`account-option${acc.id === activeAccount.id ? " active" : ""}`}
                        onClick={() => {
                          setActiveAccount(acc);
                          setAccountMenuOpen(false);
                        }}
                      >
                        <div className="account-avatar" style={{ width: 26, height: 26, fontSize: 10 }}>
                          {acc.initials}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12.5, fontWeight: 700, color: "#1e293b" }}>{acc.name}</div>
                          <div style={{ fontSize: 10.5, color: "#64748b" }}>{acc.role}</div>
                        </div>
                        {acc.id === activeAccount.id && (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1d72b8" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Bell Notifications */}
            <div className="topbar-bell" role="button" aria-label="Notificaciones">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <div className="topbar-bell-dot" />
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="page-content" onScroll={handleContentScroll}>
          {screens[current]}
        </main>
      </div>

      {/* ── Bottom Tab Bar (Mobile Only - 5 destinations UX rule) ── */}
      {isMobile && (
        <nav
          className={`bottom-tab-bar${isNavVisible ? "" : " nav-hidden"}`}
          role="navigation"
          aria-label="Navegación principal"
        >
          <div className="bottom-tab-bar-inner">
            {/* 1. Inicio */}
            <button
              className={`bottom-tab-item${current === "inicio" ? " active" : ""}`}
              onClick={() => handleNavigate("inicio")}
              aria-current={current === "inicio" ? "page" : undefined}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={current === "inicio" ? 2.5 : 1.8}>
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              <span>Inicio</span>
            </button>

            {/* 2. Agenda */}
            <button
              className={`bottom-tab-item${current === "agenda" ? " active" : ""}`}
              onClick={() => handleNavigate("agenda")}
              aria-current={current === "agenda" ? "page" : undefined}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={current === "agenda" ? 2.5 : 1.8}>
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" />
              </svg>
              <span>Agenda</span>
            </button>

            {/* 3. Pacientes */}
            <button
              className={`bottom-tab-item${current === "pacientes" ? " active" : ""}`}
              onClick={() => handleNavigate("pacientes")}
              aria-current={current === "pacientes" ? "page" : undefined}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={current === "pacientes" ? 2.5 : 1.8}>
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <span>Pacientes</span>
            </button>

            {/* 4. Pagos */}
            <button
              className={`bottom-tab-item${current === "pagos" ? " active" : ""}`}
              onClick={() => handleNavigate("pagos")}
              aria-current={current === "pagos" ? "page" : undefined}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={current === "pagos" ? 2.5 : 1.8}>
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <path d="M2 10h20" />
              </svg>
              <span>Pagos</span>
            </button>

            {/* 5. Más (Destination 5 - Rule of 3 to 5) */}
            <button
              className={`bottom-tab-item${moreDrawerOpen ? " active" : ""}`}
              onClick={() => setMoreDrawerOpen(true)}
              aria-label="Más opciones"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={moreDrawerOpen ? 2.5 : 1.8}>
                <circle cx="12" cy="12" r="1.5" />
                <circle cx="19" cy="12" r="1.5" />
                <circle cx="5" cy="12" r="1.5" />
              </svg>
              <span>Más</span>
            </button>
          </div>
        </nav>
      )}

      {/* ── 'Más' Drawer / Bottom Sheet (Mobile) ── */}
      {moreDrawerOpen && (
        <div className="bottom-sheet-overlay" onClick={() => setMoreDrawerOpen(false)}>
          <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="bottom-sheet-handle" />
            <div className="bottom-sheet-header">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "#1d72b8", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M12 2C8.5 2 6 4.5 6 7c0 2 1 3.5 1 5 0 2-1 4-1 6s1 3 2 3 2-1.5 2-3c0-1 .5-2 2-2s2 1 2 2c0 1.5 1 3 2 3s2-1 2-3-1-4-1-6c0-1.5 1-3 1-5 0-2.5-2.5-5-6-5z" />
                  </svg>
                </div>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1e293b" }}>García Osorio</h3>
                  <p style={{ fontSize: 11, color: "#64748b" }}>Clínica Odontológica</p>
                </div>
              </div>
              <button
                className="btn-ghost"
                style={{ padding: "6px 10px", border: "none", borderRadius: "50%" }}
                onClick={() => setMoreDrawerOpen(false)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="bottom-sheet-content">
              {/* Account Switcher Section */}
              <p style={{ fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Cuenta activa en uso
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {USER_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.id}
                    onClick={() => {
                      setActiveAccount(acc);
                      setMoreDrawerOpen(false);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "10px 14px",
                      borderRadius: 10,
                      background: acc.id === activeAccount.id ? "#eaf4fc" : "#f8fafc",
                      border: acc.id === activeAccount.id ? "1.5px solid #1d72b8" : "1px solid #e2e8f0",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <div style={{
                      width: 34, height: 34, borderRadius: "50%",
                      background: acc.id === activeAccount.id ? "#1d72b8" : "#cbd5e1",
                      color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, fontWeight: 700, flexShrink: 0,
                    }}>
                      {acc.initials}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: "#1e293b" }}>{acc.name}</div>
                      <div style={{ fontSize: 11.5, color: "#64748b" }}>{acc.role}</div>
                    </div>
                    {acc.id === activeAccount.id && (
                      <span style={{ fontSize: 12, color: "#1d72b8", fontWeight: 700 }}>Activo</span>
                    )}
                  </button>
                ))}
              </div>

              {/* Quick Clinic Info */}
              <div style={{ marginTop: 12, padding: "14px", borderRadius: 10, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1d72b8" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: "#1e293b" }}>Horario de Atención</span>
                </div>
                <p style={{ fontSize: 12, color: "#64748b" }}>Lunes a Viernes: 8:00 AM – 6:00 PM</p>
                <p style={{ fontSize: 12, color: "#64748b" }}>Sábados: 8:00 AM – 2:00 PM</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}