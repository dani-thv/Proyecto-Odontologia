/** Todas las fechas se manejan como strings ISO locales (YYYY-MM-DD), sin zona horaria. */

export const toISODate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const toHHMM = (d: Date = new Date()) =>
  `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

export const parseISODate = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y!, m! - 1, d!);
};

export const addDays = (iso: string, days: number) => {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
};

/** Lunes de la semana a la que pertenece `iso`. */
export const startOfWeek = (iso: string) => {
  const d = parseISODate(iso);
  const offset = (d.getDay() + 6) % 7; // lunes = 0
  d.setDate(d.getDate() - offset);
  return toISODate(d);
};

/** 0 = lunes … 5 = sábado, 6 = domingo. */
export const weekdayIndex = (iso: string) => (parseISODate(iso).getDay() + 6) % 7;

export const DAY_NAMES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"] as const;

const MONTHS_SHORT = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sept", "oct", "nov", "dic"];

/** `14/09/2026` */
export const formatShortDate = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

/** `14 de sept` */
export const formatDayMonth = (iso: string) => {
  const d = parseISODate(iso);
  return `${d.getDate()} de ${MONTHS_SHORT[d.getMonth()]}`;
};

/** `14 de sept – 19 de sept de 2026` */
export const formatWeekRange = (weekStart: string) => {
  const end = addDays(weekStart, 5);
  return `${formatDayMonth(weekStart)} – ${formatDayMonth(end)} de ${parseISODate(end).getFullYear()}`;
};

/** `Viernes, 18 de septiembre de 2026` */
export const formatLongDate = (iso: string) => {
  const text = parseISODate(iso).toLocaleDateString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return text.charAt(0).toUpperCase() + text.slice(1);
};

/** Días de `from` a `to` (positivo si `to` es posterior). */
export const diffDays = (from: string, to: string) =>
  Math.round((parseISODate(to).getTime() - parseISODate(from).getTime()) / 86_400_000);

/** `Hoy`, `Ayer` o `Hace N días` de `iso` visto desde `today`. */
export const formatRelative = (iso: string, today: string) => {
  const days = diffDays(iso, today);
  if (days <= 0) return "Hoy";
  if (days === 1) return "Ayer";
  return `Hace ${days} días`;
};
