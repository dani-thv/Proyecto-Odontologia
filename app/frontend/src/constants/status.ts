import type { AppointmentStatus } from "@/types";

export interface StatusStyle {
  label: string;
  /** Clase del badge en index.css. */
  badge: string;
  /** Colores del bloque de cita en la agenda. */
  bg: string;
  border: string;
  text: string;
}

export const STATUS: Record<AppointmentStatus, StatusStyle> = {
  confirmed: { label: "Confirmada", badge: "badge-confirmed", bg: "#eafaf1", border: "#22c55e", text: "#15803d" },
  pending: { label: "Pendiente", badge: "badge-pending", bg: "#eaf4fc", border: "#0284c7", text: "#0369a1" },
  urgent: { label: "Urgente", badge: "badge-urgent", bg: "#fef0f0", border: "#ef4444", text: "#b91c1c" },
  cancelled: { label: "Cancelada", badge: "badge-cancelled", bg: "#f1f5f9", border: "#94a3b8", text: "#475569" },
};

export const STATUS_ORDER: AppointmentStatus[] = ["confirmed", "pending", "urgent", "cancelled"];
