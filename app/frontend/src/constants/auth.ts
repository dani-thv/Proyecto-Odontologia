import type { UserAccount } from "@/types";

export interface StoredCredential {
  user: UserAccount;
  passwordHash: string; // SHA-256 hex or plain fallback
  plainPassword: string;
}

/**
 * Usuarios únicos del sistema (configuración/seed de autenticación).
 * a) Secretaría: usuario `Merlin`, contraseña `merlina1234`, rol secretaria (Recepción & Caja)
 * b) Administrador: usuario `admin`, contraseña `admin1234`, rol admin
 */
export const SYSTEM_CREDENTIALS: StoredCredential[] = [
  {
    plainPassword: "merlina1234",
    passwordHash: "46d03d1624c9c107beee676b701bc95462cfce6ae2862a939f5f65a12da9f1a2",
    user: {
      id: "usr-merlin",
      username: "Merlin",
      name: "Merlin",
      role: "secretaria",
      roleLabel: "Recepción & Caja",
      initials: "M",
    },
  },
  {
    plainPassword: "admin1234",
    passwordHash: "0192023a7bbd73250516f069df18b500e87b7a66e4a2a1b9f76a8b792e62058b",
    user: {
      id: "usr-admin",
      username: "admin",
      name: "Administrador",
      role: "admin",
      roleLabel: "Administrador",
      initials: "AD",
    },
  },
];

export const SYSTEM_USERS: UserAccount[] = SYSTEM_CREDENTIALS.map((c) => c.user);

const SESSION_STORAGE_KEY = "gracia_osorio_auth_user";

export function authenticateUser(username: string, password: string): UserAccount | null {
  const cleanUser = username.trim().toLowerCase();
  const cleanPass = password.trim();

  const found = SYSTEM_CREDENTIALS.find(
    (c) => c.user.username.toLowerCase() === cleanUser && c.plainPassword === cleanPass
  );

  return found ? found.user : null;
}

export function getStoredUser(): UserAccount | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as UserAccount;
    // Validar que el usuario guardado exista en los usuarios del sistema
    const valid = SYSTEM_USERS.find((u) => u.id === parsed.id);
    return valid ?? null;
  } catch {
    return null;
  }
}

export function setStoredUser(user: UserAccount | null): void {
  try {
    if (user) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  } catch {
    // Ignore storage issues
  }
}
