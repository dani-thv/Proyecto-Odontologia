import React from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import "./index.css";
import App from "./App";
import { ClinicProvider } from "@/state/ClinicContext";
import { ToastProvider } from "@/components/Toast";

// HashRouter: las URLs (#/agenda) funcionan en cualquier servidor estático o vista previa, sin configuración.
createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <HashRouter>
      <ClinicProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </ClinicProvider>
    </HashRouter>
  </React.StrictMode>,
);
