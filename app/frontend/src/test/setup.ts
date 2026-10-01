import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach } from "vitest";
import { cleanup } from "@testing-library/react";

let mobile = false;

/** Simula el ancho de pantalla: `true` = ≤768px (layout móvil). */
export const setMobileViewport = (value: boolean) => {
  mobile = value;
};

beforeEach(() => {
  mobile = false;
  localStorage.setItem(
    "gracia_osorio_auth_user",
    JSON.stringify({
      id: "usr-merlin",
      username: "Merlin",
      name: "Merlin",
      role: "secretaria",
      roleLabel: "Recepción & Caja",
      initials: "M",
    })
  );
  window.matchMedia = ((query: string) => ({
    matches: mobile,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia;
  Element.prototype.scrollTo = () => {};
});

afterEach(() => cleanup());
