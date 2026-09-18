import type { ComponentType } from "react";
import { CalendarIcon, CardIcon, HomeIcon, UsersIcon } from "@/components/icons";

export interface NavItem {
  path: string;
  label: string;
  Icon: ComponentType<{ size?: number; strokeWidth?: number }>;
}

export const NAV: NavItem[] = [
  { path: "/inicio", label: "Inicio", Icon: HomeIcon },
  { path: "/agenda", label: "Agenda", Icon: CalendarIcon },
  { path: "/pacientes", label: "Pacientes", Icon: UsersIcon },
  { path: "/pagos", label: "Pagos", Icon: CardIcon },
];
