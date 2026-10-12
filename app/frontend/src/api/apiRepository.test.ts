import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createApiRepository } from "./apiRepository";
import { ApiError, request } from "./http";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
const problem = (status: number, detail: string, extra: object = {}) =>
  json({ type: "about:blank", status, detail, ...extra }, status);

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

const lastCall = () => {
  const [url, init] = fetchMock.mock.calls.at(-1)!;
  return { url: url as string, init: init as RequestInit };
};

describe("request", () => {
  it("convierte un problem+json en ApiError con el detalle en español", async () => {
    fetchMock.mockImplementation(async () => problem(409, "Se cruza con la cita de Ana (08:00 – 09:00)."));
    await expect(request("/api/x")).rejects.toMatchObject({ name: "ApiError", status: 409, message: "Se cruza con la cita de Ana (08:00 – 09:00)." });
  });

  it("incluye los errores por campo de un 400", async () => {
    fetchMock.mockResolvedValue(problem(400, "Hay datos inválidos en la solicitud.", { errors: { name: "Obligatorio" } }));
    const err = (await request("/api/x").catch((e: unknown) => e)) as ApiError;
    expect(err).toBeInstanceOf(ApiError);
    expect(err.errors).toEqual({ name: "Obligatorio" });
  });

  it("status 0 cuando no hay conexión", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    await expect(request("/api/x")).rejects.toMatchObject({ status: 0, message: "No se pudo conectar con el servidor." });
  });

  it("acepta 204 sin cuerpo y errores sin JSON", async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
    await expect(request("/api/x", { method: "DELETE" })).resolves.toBeUndefined();
    fetchMock.mockResolvedValueOnce(new Response("<html>500</html>", { status: 500 }));
    await expect(request("/api/x")).rejects.toMatchObject({ status: 500, message: "El servidor respondió con error 500." });
  });

  it("un 502 del proxy (backend apagado) se trata como falta de conexión", async () => {
    fetchMock.mockImplementation(async () => new Response("Bad Gateway", { status: 502 }));
    await expect(request("/api/x")).rejects.toMatchObject({ status: 0, message: "No se pudo conectar con el servidor." });
  });
});

describe("apiRepository", () => {
  const appointment = {
    patientId: "1", patient: "Andrea", treatment: "Limpieza", doctorId: "carlos" as const, date: "2026-09-18",
    startHour: 15, startMin: 0, durationMin: 60, status: "confirmed" as const,
  };

  it("load() pide todo en paralelo y descarta los campos extra del backend", async () => {
    fetchMock.mockImplementation(async (url: string) => {
      if (url === "/api/patients") return json([{ id: "1", name: "Ana", cedula: "1", doctorId: "carlos", phone: "3", lastVisit: null, balance: 5000 }]);
      if (url === "/api/treatment-plans") return json([{ id: "9", patientId: "1", concept: "Limpieza", totalCost: 100, totalPaid: 40, pending: 60, payments: [] }]);
      return json([]);
    });
    const data = await createApiRepository().load();
    expect(data.patients).toEqual([{ id: "1", name: "Ana", cedula: "1", doctorId: "carlos", phone: "3", lastVisit: null }]);
    expect(data.plans).toEqual([{ id: "9", patientId: "1", concept: "Limpieza", totalCost: 100, payments: [] }]);
    expect(fetchMock.mock.calls.map((c) => c[0]).sort()).toEqual([
      "/api/appointments", "/api/appointments/pending-reschedule", "/api/patients", "/api/reminders", "/api/treatment-plans",
    ]);
  });

  it("crea citas con POST (y fromPendingId en la URL cuando viene de pendientes)", async () => {
    fetchMock.mockImplementation(async () => json({ ...appointment, id: "21" }, 201));
    const repo = createApiRepository();
    await repo.addAppointment(appointment);
    expect(lastCall().url).toBe("/api/appointments");
    expect(lastCall().init.method).toBe("POST");
    expect(JSON.parse(lastCall().init.body as string)).toEqual(appointment);

    await repo.addAppointment(appointment, "4");
    expect(lastCall().url).toBe("/api/appointments?fromPendingId=4");
  });

  it("actualiza, elimina y gestiona recordatorios con el verbo correcto", async () => {
    const repo = createApiRepository();
    fetchMock.mockResolvedValueOnce(json({ ...appointment, id: "9" }));
    await repo.updateAppointment("9", appointment);
    expect(lastCall()).toMatchObject({ url: "/api/appointments/9", init: { method: "PUT" } });

    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
    await repo.removeAppointment("9");
    expect(lastCall()).toMatchObject({ url: "/api/appointments/9", init: { method: "DELETE" } });

    fetchMock.mockResolvedValueOnce(json({ id: "1", appointmentId: "17", status: "confirmed" }));
    await repo.confirmReminder("1");
    expect(lastCall()).toMatchObject({ url: "/api/reminders/1/confirm", init: { method: "POST" } });

    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
    await repo.dismissReminder("1");
    expect(lastCall()).toMatchObject({ url: "/api/reminders/1", init: { method: "DELETE" } });
  });

  it("registra un abono y devuelve el tratamiento actualizado", async () => {
    fetchMock.mockResolvedValue(json({ id: "1", patientId: "3", concept: "Extracción", totalCost: 850000, totalPaid: 650000, pending: 200000, payments: [{ id: "13" }] }, 201));
    const plan = await createApiRepository().addPayment("1", {
      date: "2026-09-18", concept: "Abono", amount: 150000, method: "Efectivo", signature: "V. Cruz",
    });
    expect(lastCall().url).toBe("/api/treatment-plans/1/payments");
    expect(JSON.parse(lastCall().init.body as string)).toMatchObject({ amount: 150000, method: "Efectivo" });
    expect(plan).toEqual({ id: "1", patientId: "3", concept: "Extracción", totalCost: 850000, payments: [{ id: "13" }] });
  });

  it("propaga los rechazos del servidor como ApiError", async () => {
    fetchMock.mockResolvedValue(problem(422, "El abono no puede superar el saldo pendiente ($ 350.000)."));
    await expect(
      createApiRepository().addPayment("1", { date: "2026-09-18", concept: "", amount: 999999, method: "Efectivo", signature: "x" }),
    ).rejects.toMatchObject({ status: 422 });
  });
});
