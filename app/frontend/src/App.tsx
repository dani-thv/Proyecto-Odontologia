import { useEffect, useRef, useState } from "react";
import type { UIEvent } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AccountProvider, useAccount } from "@/state/AccountContext";
import { useClinic } from "@/state/ClinicContext";
import { useIsMobile } from "@/hooks/useIsMobile";
import { DEMO_TODAY } from "@/data/demo";
import { formatLongDate, toISODate } from "@/utils/dates";
import ConnectionScreen from "@/components/ConnectionScreen";
import Sidebar from "@/layout/Sidebar";
import Topbar from "@/layout/Topbar";
import BottomTabBar from "@/layout/BottomTabBar";
import MoreSheet from "@/layout/MoreSheet";
import { NAV } from "@/layout/nav";
import Dashboard from "@/screens/Dashboard";
import Agenda from "@/screens/agenda";
import Patients from "@/screens/Patients";
import Payments from "@/screens/Payments";
import Login from "@/screens/Login";

const CLINIC = "García & Osorio";

function AuthenticatedApp() {
  const { account, logout } = useAccount();
  const { reminders, status, demoMode } = useClinic();
  const isMobile = useIsMobile();
  const { pathname } = useLocation();

  const [moreOpen, setMoreOpen] = useState(false);
  const [navVisible, setNavVisible] = useState(true);
  const lastScrollY = useRef(0);
  const mainRef = useRef<HTMLElement>(null);

  const title = NAV.find((n) => pathname.startsWith(n.path))?.label ?? "Agenda";

  useEffect(() => {
    document.title = `${title} · ${CLINIC}`;
    mainRef.current?.scrollTo({ top: 0 });
    lastScrollY.current = 0;
    setNavVisible(true);
  }, [title, pathname]);

  // Si no hay usuario autenticado, muestra la pantalla de Login
  if (!account) {
    return <Login />;
  }

  // La barra inferior se oculta al bajar y reaparece al subir.
  const onContentScroll = (e: UIEvent<HTMLElement>) => {
    const y = e.currentTarget.scrollTop;
    const diff = y - lastScrollY.current;
    if (y <= 15 || diff < -10) setNavVisible(true);
    else if (diff > 10) setNavVisible(false);
    lastScrollY.current = y;
  };

  if (status !== "ready") return <ConnectionScreen />;

  return (
    <div id="app-root" className="flex h-dvh w-screen overflow-hidden">
      <Sidebar account={account} onLogout={logout} />

      <div className="main-area">
        <Topbar
          title={title}
          date={formatLongDate(pathname.startsWith("/pagos") ? toISODate(new Date()) : DEMO_TODAY)}
          account={account}
          onLogout={logout}
          pendingReminders={reminders.filter((r) => r.status === "pending").length}
          demoMode={demoMode}
        />

        <main className="page-content" ref={mainRef} onScroll={onContentScroll}>
          <Routes>
            <Route path="/" element={<Navigate to="/agenda" replace />} />
            <Route path="/inicio" element={<Dashboard />} />
            <Route path="/agenda" element={<Agenda />} />
            <Route path="/pacientes" element={<Patients />} />
            <Route path="/pagos" element={<Payments />} />
            <Route path="*" element={<Navigate to="/agenda" replace />} />
          </Routes>
        </main>
      </div>

      {isMobile && (
        <BottomTabBar
          visible={navVisible}
          moreOpen={moreOpen}
          onOpenMore={() => setMoreOpen(true)}
        />
      )}
      {isMobile && moreOpen && (
        <MoreSheet account={account} onLogout={logout} onClose={() => setMoreOpen(false)} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AccountProvider>
      <AuthenticatedApp />
    </AccountProvider>
  );
}
