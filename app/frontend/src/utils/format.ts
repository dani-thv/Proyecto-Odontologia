export const pad2 = (n: number) => String(n).padStart(2, "0");

export const formatTime = (hour: number, min: number) => `${pad2(hour)}:${pad2(min)}`;

/** `$ 1.234.567` (COP, locale es-CO). */
export const formatCOP = (n: number) => `$ ${n.toLocaleString("es-CO")}`;

/** Quita espacios para usar el teléfono en `tel:` y `wa.me`. */
export const cleanPhone = (phone: string) => phone.replace(/\s+/g, "");

export const telHref = (phone: string) => `tel:${cleanPhone(phone)}`;

/** WhatsApp con prefijo de Colombia (+57). */
export const whatsappHref = (phone: string) => `https://wa.me/57${cleanPhone(phone)}`;

export const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");

/** `1032458771` → `1.032.458.771` */
export const formatCedula = (raw: string) => raw.replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ".");

/** `3104528814` → `310 452 8814` (si no tiene 10 dígitos, deja los dígitos tal cual). */
export const formatPhone = (raw: string) => {
  const digits = raw.replace(/\D/g, "");
  return digits.length === 10 ? `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}` : digits;
};
