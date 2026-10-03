import type { AppointmentStatus } from "@/types";
import { STATUS } from "@/constants/status";

export default function StatusBadge({ status, className = "" }: { status: AppointmentStatus; className?: string }) {
  const s = STATUS[status];
  return <span className={`badge ${s.badge} ${className}`}>{s.label}</span>;
}
