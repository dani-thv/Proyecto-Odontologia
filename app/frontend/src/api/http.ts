/** Base de la API. Vacío = mismo origen (el proxy de Vite reenvía /api al backend en :8080). */
const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "";

export class ApiError extends Error {
  /** 0 = no hubo respuesta (servidor apagado, sin red, tiempo agotado). */
  readonly status: number;
  /** Errores por campo cuando el servidor devuelve 400 de validación. */
  readonly errors?: Record<string, string>;

  constructor(status: number, detail: string, errors?: Record<string, string>) {
    super(detail);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

/** Mensaje en español listo para mostrar al usuario. */
export const messageOf = (e: unknown) =>
  e instanceof ApiError ? e.message : "Ocurrió un error inesperado. Inténtalo de nuevo.";

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  timeoutMs?: number;
}

export async function request<T>(path: string, { method = "GET", body, timeoutMs = 10_000 }: RequestOptions = {}): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers: body === undefined ? { Accept: "application/json" } : { Accept: "application/json", "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch {
    throw new ApiError(0, "No se pudo conectar con el servidor.");
  } finally {
    clearTimeout(timer);
  }

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  let json: unknown;
  try {
    json = text ? JSON.parse(text) : undefined;
  } catch {
    json = undefined;
  }

  // El proxy responde 502/503/504 cuando el backend está apagado o aún arrancando.
  if ([502, 503, 504].includes(res.status)) throw new ApiError(0, "No se pudo conectar con el servidor.");

  if (!res.ok) {
    const problem = (json ?? {}) as { detail?: string; errors?: Record<string, string> };
    throw new ApiError(res.status, problem.detail ?? `El servidor respondió con error ${res.status}.`, problem.errors);
  }
  if (json === undefined) throw new ApiError(res.status, "El servidor devolvió una respuesta inválida.");
  return json as T;
}
