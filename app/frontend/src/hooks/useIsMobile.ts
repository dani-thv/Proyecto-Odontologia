import { useSyncExternalStore } from "react";

const QUERY = "(max-width: 768px)";

const subscribe = (onChange: () => void) => {
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
};

const getSnapshot = () => window.matchMedia(QUERY).matches;

/** `true` en pantallas ≤ 768px (mismo breakpoint que el CSS del layout móvil). */
export function useIsMobile() {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
