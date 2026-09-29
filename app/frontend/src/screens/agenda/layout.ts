import { OPEN_HOUR, WEEKDAY_CLOSE_HOUR, closingHour } from "@/utils/schedule";
import { formatTime } from "@/utils/format";

export const FIRST_HOUR = OPEN_HOUR;
export const LAST_HOUR = WEEKDAY_CLOSE_HOUR;
export const SLOT_MIN = 30;
/** px por franja de 30 min. */
export const SLOT_H = 65;
export const TIME_COL = 72;
export const MIN_DAY_WIDTH = 140;

export interface Slot {
  index: number;
  hour: number;
  min: number;
  label: string;
}

export const SLOTS: Slot[] = Array.from({ length: ((LAST_HOUR - FIRST_HOUR) * 60) / SLOT_MIN }, (_, index) => {
  const total = FIRST_HOUR * 60 + index * SLOT_MIN;
  const hour = Math.floor(total / 60);
  const min = total % 60;
  return { index, hour, min, label: formatTime(hour, min) };
});

export const topPx = (hour: number, min: number) => (((hour - FIRST_HOUR) * 60 + min) / SLOT_MIN) * SLOT_H;
export const heightPx = (durationMin: number) => (durationMin / SLOT_MIN) * SLOT_H;

/** La franja arranca fuera del horario de atención de ese día (domingo, o sábado después de las 14:00). */
export const isClosedSlot = (date: string, slot: Slot) => {
  const close = closingHour(date);
  return close === null || slot.hour >= close;
};

export const gridColumns = `${TIME_COL}px repeat(6, minmax(${MIN_DAY_WIDTH}px, 1fr))`;
