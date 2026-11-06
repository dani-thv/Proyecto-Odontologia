import { useEffect, useMemo, useState } from "react";
import { createPortal, flushSync } from "react-dom";
import type { PaymentMethod } from "@/types";
import { useClinic } from "@/state/ClinicContext";
import { useAccount } from "@/state/AccountContext";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useToast } from "@/components/Toast";
import { doctorById } from "@/constants/doctors";
import { formatCOP } from "@/utils/format";
import { formatLongDate, formatShortDate, toHHMM, toISODate } from "@/utils/dates";
import { dailyClosing, paymentsWithRemaining, planPaid, planPending, planProgress } from "@/utils/finance";
import PaymentFormModal from "@/components/PaymentFormModal";
import { ChevronDownIcon, DownloadIcon, FileIcon, PlusIcon, ToothIcon } from "@/components/icons";

const METHOD_STYLES: Record<PaymentMethod, string> = {
  Efectivo: "bg-slate-100 text-slate-600 border-slate-300",
  Transferencia: "bg-sky-100 text-sky-600 border-sky-200",
  Datáfono: "bg-green-100 text-green-700 border-green-200",
};

const MethodPill = ({ method }: { method: PaymentMethod }) => (
  <span className={`inline-flex rounded-md border px-2.5 py-[3px] text-[11.5px] font-semibold ${METHOD_STYLES[method]}`}>{method}</span>
);

const TABLE_COLS = "grid-cols-[110px_1.8fr_1fr_1fr_1fr_90px_95px]";

const sectionTitle = "mb-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-400";

type PrintTarget =
  | { type: "closing"; printedAt: string }
  | { type: "receipt"; paymentId: string; printedAt: string };

function getPrintRoot(): HTMLElement {
  let el = document.getElementById("print-root");
  if (!el) {
    el = document.createElement("div");
    el.id = "print-root";
    document.body.appendChild(el);
  }
  return el;
}

function ClinicPrintHeader({ docLabel, docNumber }: { docLabel: string; docNumber: string }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4 border-b-2 border-slate-900 pb-3.5">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-slate-900 bg-white text-slate-900">
          <ToothIcon size={24} stroke="currentColor" />
        </div>
        <div className="min-w-0">
          <h1 className="text-[16pt] font-extrabold leading-tight tracking-tight text-slate-900">
            García & Osorio
          </h1>
          <p className="text-[10pt] font-bold uppercase tracking-wider text-slate-600">
            Clínica Odontológica
          </p>
          <p className="mt-0.5 text-[9.5pt] text-slate-600">
            NIT: 901.234.567-8 · PBX: (601) 456-7890 · Calle 100 # 15-20, Bogotá D.C.
          </p>
        </div>
      </div>

      <div className="shrink-0 text-right">
        <div className="inline-block rounded border border-slate-400 bg-white px-3 py-1.5 text-right">
          <p className="text-[9pt] font-bold uppercase text-slate-500">{docLabel}</p>
          <p className="font-mono text-[11pt] font-extrabold text-slate-900">{docNumber}</p>
        </div>
      </div>
    </div>
  );
}

export default function Payments() {
  const { plans, patients, addPayment } = useClinic();
  const { account } = useAccount();
  const isMobile = useIsMobile();
  const toast = useToast();

  const today = useMemo(() => toISODate(new Date()), []);

  const accounts = useMemo(
    () =>
      plans.flatMap((plan) => {
        const patient = patients.find((p) => p.id === plan.patientId);
        return patient ? [{ plan, patient }] : [];
      }),
    [plans, patients],
  );

  const [selectedId, setSelectedId] = useState(accounts[0]?.plan.id ?? "");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [closingDate, setClosingDate] = useState(today);
  const [countedCash, setCountedCash] = useState("");
  const [printTarget, setPrintTarget] = useState<PrintTarget | null>(null);

  const closing = useMemo(() => dailyClosing(plans, patients, closingDate), [plans, patients, closingDate]);

  useEffect(() => {
    const onBeforePrint = () => {
      setPrintTarget((prev) =>
        prev
          ? { ...prev, printedAt: toHHMM(new Date()) }
          : closing.transactionCount > 0
            ? { type: "closing", printedAt: toHHMM(new Date()) }
            : null,
      );
    };
    const onAfterPrint = () => {
      setPrintTarget(null);
    };
    window.addEventListener("beforeprint", onBeforePrint);
    window.addEventListener("afterprint", onAfterPrint);
    return () => {
      window.removeEventListener("beforeprint", onBeforePrint);
      window.removeEventListener("afterprint", onAfterPrint);
    };
  }, [closing.transactionCount]);

  if (accounts.length === 0) {
    return <div className="card card-shadow p-10 text-center text-slate-400">Aún no hay cuentas de pacientes.</div>;
  }

  const current = accounts.find((a) => a.plan.id === selectedId) ?? accounts[0]!;
  const { plan, patient } = current;
  const pending = planPending(plan);
  const progress = planProgress(plan);
  const history = paymentsWithRemaining(plan);
  const firstExpanded = expanded ?? history[history.length - 1]?.id ?? null;

  const counted = countedCash.trim() === "" ? null : Number(countedCash.replace(/\D/g, ""));
  const difference = counted === null ? null : counted - closing.expectedCash;

  const handlePay = async (payment: Parameters<typeof addPayment>[1]) => {
    await addPayment(plan.id, payment);
    setPaying(false);
    toast(`Abono de ${formatCOP(payment.amount)} registrado`);
  };

  const handlePrintClosing = () => {
    if (closing.transactionCount === 0) return;
    flushSync(() => {
      setPrintTarget({ type: "closing", printedAt: toHHMM(new Date()) });
    });
    window.print();
  };

  const handlePrintReceipt = (paymentId: string) => {
    flushSync(() => {
      setPrintTarget({ type: "receipt", paymentId, printedAt: toHHMM(new Date()) });
    });
    window.print();
  };

  const receiptIndex = printTarget?.type === "receipt" ? history.findIndex((p) => p.id === printTarget.paymentId) : -1;
  const receiptPayment = receiptIndex >= 0 ? history[receiptIndex] : history[history.length - 1];
  const closingDocNo = `CC-${closing.date.replace(/-/g, "")}-01`;
  const receiptDocNo = receiptPayment
    ? `RA-${receiptPayment.date.replace(/-/g, "")}-${String((receiptIndex >= 0 ? receiptIndex : history.length - 1) + 1).padStart(2, "0")}`
    : "";

  const metric = (label: string, value: number, tone: "neutral" | "good" | "bad") => {
    const tones = {
      neutral: "border-slate-200 bg-slate-50 text-brand [&_p:first-child]:text-slate-500",
      good: "border-green-200 bg-green-50 text-green-600 [&_p:first-child]:text-green-700",
      bad: "border-red-200 bg-red-50 text-red-600 [&_p:first-child]:text-red-700",
    } as const;
    return (
      <div className={`rounded-lg border px-4 py-3 mobile:px-2.5 mobile:py-2 ${tones[tone]}`}>
        <p className="text-xs font-semibold mobile:text-[10.5px]">{label}</p>
        <p className="mt-0.5 text-[22px] font-extrabold mobile:text-[15px]">{formatCOP(value)}</p>
      </div>
    );
  };

  return (
    <div className="fade-in flex w-full flex-col gap-4 mobile:gap-3 mobile:pb-6">
      <section className="card card-shadow px-[22px] py-[18px] mobile:px-4 mobile:py-3.5" aria-label="Resumen de cuenta">
        <div className="mb-3.5 flex items-end gap-3">
          <div className="flex-1">
            <label htmlFor="pay-patient" className="mb-1 block text-[11.5px] font-bold uppercase tracking-wide text-slate-500">
              Seleccionar paciente
            </label>
            <select
              id="pay-patient"
              className="input w-full border-slate-300 bg-white text-sm font-semibold mobile:text-[13px]"
              value={plan.id}
              onChange={(e) => { setSelectedId(e.target.value); setExpanded(null); }}
            >
              {accounts.map((a) => (
                <option key={a.plan.id} value={a.plan.id}>{a.patient.name} – {a.patient.cedula} · {a.plan.concept}</option>
              ))}
            </select>
          </div>
          <button type="button" className="btn-orange shrink-0" onClick={() => setPaying(true)} disabled={pending === 0}>
            <PlusIcon size={13} strokeWidth={2.5} /> Registrar abono
          </button>
        </div>

        <div className="mb-3.5 grid grid-cols-3 gap-4 mobile:gap-2">
          {metric("Costo total", plan.totalCost, "neutral")}
          {metric("Abonado", planPaid(plan), "good")}
          {metric("Pendiente", pending, pending > 0 ? "bad" : "good")}
        </div>

        <div>
          <div className="mb-1 flex justify-between text-[11.5px]">
            <span className="text-slate-500">Progreso de pago del tratamiento</span>
            <span className="font-bold text-slate-800">{progress}%</span>
          </div>
          <div className="progress-track h-1.5" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Progreso de pago">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </section>

      <section className="card card-shadow overflow-hidden" aria-labelledby="pay-history">
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-4 mobile:px-4 mobile:py-3">
          <div>
            <h2 id="pay-history" className="text-[15px] font-bold text-slate-800 mobile:text-sm">
              Historial de abonos — <span className="text-brand">{patient.name}</span>
            </h2>
            <p className="mt-px text-[11px] text-slate-400">{plan.payments.length} transacciones registradas</p>
          </div>
        </header>

        {history.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-400">Este tratamiento aún no tiene abonos.</p>
        ) : isMobile ? (
          <ul className="flex flex-col gap-2 px-3 py-2.5">
            {history.map((p) => {
              const open = firstExpanded === p.id;
              return (
                <li key={p.id} className="overflow-hidden rounded-[10px] border border-slate-200 bg-white">
                  <button
                    type="button"
                    aria-expanded={open}
                    aria-controls={`pay-${p.id}`}
                    onClick={() => setExpanded(open ? "" : p.id)}
                    className={`flex w-full cursor-pointer items-center justify-between gap-2 border-0 px-3.5 py-3 text-left font-[inherit] ${open ? "bg-slate-50" : "bg-white"}`}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13.5px] font-bold leading-tight text-slate-800">{p.concept}</span>
                      <span className="mt-1 block text-[11.5px] text-slate-500">
                        🗓️ {formatShortDate(p.date)}{p.time ? ` · ${p.time}` : ""}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <span className="text-[14.5px] font-extrabold text-green-600">{formatCOP(p.amount)}</span>
                      <ChevronDownIcon size={16} strokeWidth={2.5} className={`text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
                    </span>
                  </button>
                  {open && (
                    <div id={`pay-${p.id}`} className="flex flex-col gap-2 border-t border-slate-100 px-3.5 pb-3.5 pt-2.5">
                      <div className="flex items-center justify-between"><span className="text-xs text-slate-500">Método de pago:</span><MethodPill method={p.method} /></div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">Saldo restante:</span>
                        <span className={`text-[13px] font-bold ${p.remaining > 0 ? "text-red-600" : "text-green-600"}`}>{formatCOP(p.remaining)}</span>
                      </div>
                      <div className="flex items-center justify-between border-t border-dashed border-slate-100 pt-2">
                        <span className="text-xs text-slate-500">
                          Firma: <strong className="font-serif text-[13px] italic text-slate-700">{p.signature}</strong>
                        </span>
                        <button
                          type="button"
                          onClick={() => handlePrintReceipt(p.id)}
                          className="flex cursor-pointer items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 py-1 font-[inherit] text-xs font-semibold text-brand"
                        >
                          <DownloadIcon size={12} /> Recibo
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="overflow-x-auto" role="table" aria-label="Historial de abonos">
            <div className={`tbl-head min-w-[660px] rounded-none ${TABLE_COLS}`} role="row">
              {["Fecha", "Concepto", "Monto", "Saldo restante", "Método", "Firma", "Recibo"].map((h) => <span key={h} role="columnheader">{h}</span>)}
            </div>
            <div className="min-w-[660px]">
              {history.map((p) => (
                <div key={p.id} className={`tbl-row ${TABLE_COLS}`} role="row">
                  <p className="text-[13px] text-slate-500" role="cell">
                    {formatShortDate(p.date)}{p.time ? ` · ${p.time}` : ""}
                  </p>
                  <p className="text-[13px] font-semibold text-brand" role="cell">{p.concept}</p>
                  <p className="text-[13.5px] font-bold text-green-600" role="cell">{formatCOP(p.amount)}</p>
                  <p className="text-[13px] font-semibold text-slate-800" role="cell">{formatCOP(p.remaining)}</p>
                  <div role="cell"><MethodPill method={p.method} /></div>
                  <p className="font-serif text-[13px] italic text-slate-600" role="cell">{p.signature}</p>
                  <div role="cell">
                    <button
                      type="button"
                      onClick={() => handlePrintReceipt(p.id)}
                      className="flex cursor-pointer items-center gap-1.5 rounded-md border border-slate-300 bg-transparent px-2.5 py-1 font-[inherit] text-xs font-semibold text-brand hover:bg-slate-50"
                    >
                      <DownloadIcon size={12} /> Recibo
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="card card-shadow px-[22px] py-[18px] mobile:px-4 mobile:py-3.5" aria-labelledby="pay-closing">
        <div className="mb-3.5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 id="pay-closing" className="text-[15px] font-bold text-slate-800 mobile:text-sm">
              Cierre de caja diario
            </h2>
            <p className="mt-0.5 text-[11.5px] text-slate-500">
              {formatLongDate(closingDate)} · N° {closingDocNo}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              aria-label="Fecha del cierre de caja"
              value={closingDate}
              onChange={(e) => {
                if (e.target.value) setClosingDate(e.target.value);
              }}
              className="input h-8 border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold"
            />
            <button
              type="button"
              className="btn-blue px-3 py-1.5 text-xs no-print disabled:cursor-not-allowed disabled:opacity-40"
              onClick={handlePrintClosing}
              disabled={closing.transactionCount === 0}
              title={
                closing.transactionCount === 0
                  ? "No hay pagos registrados para esta fecha"
                  : "Imprimir comprobante de cierre de caja"
              }
            >
              <FileIcon size={13} /> Imprimir comprobante
            </button>
          </div>
        </div>

        {closing.transactionCount === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-7 text-center">
            <p className="text-sm font-bold text-slate-700">Sin movimientos registrados</p>
            <p className="mt-1 text-xs text-slate-500">
              No se registraron pagos el {formatLongDate(closingDate)}. El documento de cierre solo puede generarse en días con transacciones.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-6 mobile:grid-cols-1 mobile:gap-4">
            <div className="mobile:rounded-lg mobile:bg-slate-50 mobile:p-3">
              <h3 className={sectionTitle}>Recaudo por doctor</h3>
              {closing.byDoctor.map((d) => (
                <div key={d.doctorId} className="mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-[12.5px] text-slate-700">
                    <span aria-hidden="true" className="size-[7px] shrink-0 rounded-full bg-brand" />
                    {doctorById(d.doctorId).name}
                  </span>
                  <span className="text-[12.5px] font-semibold text-slate-800">{formatCOP(d.amount)}</span>
                </div>
              ))}
              <div className="mt-2 flex justify-between border-t border-slate-200 pt-2">
                <span className="text-[12.5px] font-bold text-slate-800">Total</span>
                <span className="text-[13px] font-extrabold text-brand">{formatCOP(closing.total)}</span>
              </div>
            </div>

            <div className="mobile:rounded-lg mobile:bg-slate-50 mobile:p-3">
              <h3 className={sectionTitle}>Recaudo por método</h3>
              {closing.byMethod.map((m) => (
                <div key={m.method} className="mb-1.5 flex items-center justify-between">
                  <MethodPill method={m.method} />
                  <span className="text-[12.5px] font-semibold text-slate-800">{formatCOP(m.amount)}</span>
                </div>
              ))}
              <div className="mt-2 flex justify-between border-t border-slate-200 pt-2">
                <span className="text-[12.5px] font-bold text-slate-800">Total recaudado</span>
                <span className="text-[13px] font-extrabold text-brand">{formatCOP(closing.total)}</span>
              </div>
            </div>

            <div className="mobile:rounded-lg mobile:bg-slate-50 mobile:p-3">
              <h3 className={sectionTitle}>Conciliación de efectivo</h3>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2">
                  <span className="text-xs text-slate-500">Debería haber</span>
                  <span className="text-[13px] font-bold text-slate-800">{formatCOP(closing.expectedCash)}</span>
                </div>
                <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5">
                  <label htmlFor="counted-cash" className="text-xs text-slate-500">Hay en caja</label>
                  <input
                    id="counted-cash"
                    className="input w-28 py-1 text-right text-[13px] font-bold"
                    inputMode="numeric"
                    placeholder="Contar…"
                    value={countedCash}
                    onChange={(e) => setCountedCash(e.target.value)}
                  />
                </div>
                {difference !== null && (
                  <div
                    role="status"
                    className={`flex items-center justify-between rounded-lg border px-3 py-2 ${
                      difference === 0 ? "border-green-200 bg-green-50 text-green-600" : "border-red-300 bg-red-100 text-red-600"
                    }`}
                  >
                    <span className="text-xs font-bold">{difference === 0 ? "Caja cuadrada" : "Diferencia"}</span>
                    <span className="text-[13px] font-extrabold">
                      {difference === 0 ? formatCOP(0) : `${difference < 0 ? "-" : "+"}${formatCOP(Math.abs(difference))}`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      {paying && (
        <PaymentFormModal plan={plan} patientName={patient.name} today={today} onSave={handlePay} onClose={() => setPaying(false)} />
      )}

      {printTarget &&
        createPortal(
          <div className="print-doc">
            {printTarget.type === "receipt" && receiptPayment ? (
              <div>
                <ClinicPrintHeader docLabel="N.° de Recibo" docNumber={receiptDocNo} />

                <div className="mb-4 text-center">
                  <h2 className="text-[14pt] font-black uppercase tracking-wider text-slate-900">
                    Recibo de abono
                  </h2>
                  <p className="text-[10pt] font-medium text-slate-600">
                    Comprobante individual de pago de tratamiento odontológico
                  </p>
                </div>

                <div className="print-avoid-break mb-4 grid grid-cols-2 gap-4 rounded border border-slate-300 bg-white p-4 text-[10.5pt]">
                  <div>
                    <p className="text-[9pt] font-bold uppercase text-slate-500">Paciente y documento</p>
                    <p className="font-bold text-slate-900">{patient.name} · C.C. {patient.cedula}</p>
                    <p className="mt-2.5 text-[9pt] font-bold uppercase text-slate-500">Doctor</p>
                    <p className="font-bold text-slate-900">{doctorById(patient.doctorId).name}</p>
                    <p className="mt-2.5 text-[9pt] font-bold uppercase text-slate-500">Tratamiento</p>
                    <p className="font-bold text-slate-900">{plan.concept}</p>
                  </div>
                  <div>
                    <p className="text-[9pt] font-bold uppercase text-slate-500">Fecha del abono</p>
                    <p className="font-bold text-slate-900">
                      {formatLongDate(receiptPayment.date)}{receiptPayment.time ? ` · ${receiptPayment.time}` : ""}
                    </p>
                    <p className="mt-2.5 text-[9pt] font-bold uppercase text-slate-500">Método de pago</p>
                    <p className="font-bold text-slate-900">{receiptPayment.method}</p>
                    <p className="mt-2.5 text-[9pt] font-bold uppercase text-slate-500">Emitido por</p>
                    <p className="font-bold text-slate-900">
                      {account ? `${account.name} (${account.roleLabel})` : "Administración"} · {printTarget.printedAt}
                    </p>
                  </div>
                </div>

                <div className="print-avoid-break mb-4 rounded border border-slate-300 bg-white">
                  <table className="w-full text-left text-[10.5pt]">
                    <colgroup>
                      <col style={{ width: "52%" }} />
                      <col style={{ width: "24%" }} />
                      <col style={{ width: "24%" }} />
                    </colgroup>
                    <thead className="border-b border-slate-300 bg-slate-50 text-[9.5pt] font-bold uppercase text-slate-700">
                      <tr>
                        <th className="px-3 py-2">Concepto</th>
                        <th className="px-3 py-2">Método de pago</th>
                        <th className="px-3 py-2 text-right">Monto pagado</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="px-3 py-2.5 font-semibold text-slate-900">{receiptPayment.concept}</td>
                        <td className="px-3 py-2.5 text-slate-700">{receiptPayment.method}</td>
                        <td className="px-3 py-2.5 text-right font-mono text-[11.5pt] font-extrabold text-slate-900">
                          {formatCOP(receiptPayment.amount)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="print-avoid-break mb-6 grid grid-cols-3 gap-4 rounded border border-slate-400 bg-white p-3.5 text-[10.5pt]">
                  <div>
                    <p className="text-[9pt] font-bold uppercase text-slate-500">Costo total del tratamiento</p>
                    <p className="mt-1 font-mono text-[12pt] font-bold text-slate-900">{formatCOP(plan.totalCost)}</p>
                  </div>
                  <div>
                    <p className="text-[9pt] font-bold uppercase text-slate-500">Monto pagado</p>
                    <p className="mt-1 font-mono text-[12pt] font-extrabold text-slate-900">{formatCOP(receiptPayment.amount)}</p>
                  </div>
                  <div>
                    <p className="text-[9pt] font-bold uppercase text-slate-500">Saldo restante</p>
                    <p className="mt-1 font-mono text-[12pt] font-extrabold text-slate-900">{formatCOP(receiptPayment.remaining)}</p>
                  </div>
                </div>

                <div className="print-avoid-break mt-12 grid grid-cols-2 gap-10 pt-4 text-center text-[10.5pt]">
                  <div>
                    <p className="min-h-[24px] font-serif text-[12pt] italic text-slate-900">{receiptPayment.signature}</p>
                    <div className="mt-1 border-t border-slate-400 pt-2">
                      <p className="font-bold text-slate-900">{patient.name}</p>
                      <p className="text-[9.5pt] text-slate-500">C.C. {patient.cedula} · Firma de conformidad del paciente</p>
                    </div>
                  </div>
                  <div>
                    <p className="min-h-[24px] text-[11pt] font-semibold text-slate-800">{account?.name ?? "García & Osorio"}</p>
                    <div className="mt-1 border-t border-slate-400 pt-2">
                      <p className="font-bold text-slate-900">{account?.name ?? "Administración"}</p>
                      <p className="text-[9.5pt] text-slate-500">{account?.roleLabel ?? "Clínica Odontológica"} · Emitido por</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <ClinicPrintHeader docLabel="N.° de Documento" docNumber={closingDocNo} />

                <div className="mb-3.5 text-center">
                  <h2 id="closing-title" className="text-[14pt] font-black uppercase tracking-wider text-slate-900">
                    Cierre de Caja Diaria
                  </h2>
                  <p className="text-[10pt] font-medium text-slate-600">
                    Reporte oficial de transacciones y conciliación de recaudo
                  </p>
                </div>

                <div className="print-avoid-break mb-3.5 grid grid-cols-2 gap-4 rounded border border-slate-300 bg-white px-4 py-2.5 text-[10.5pt]">
                  <div className="flex flex-col gap-1">
                    <p>
                      <span className="font-medium text-slate-500">Fecha de operación: </span>
                      <strong className="text-slate-900">{formatLongDate(closing.date)}</strong>
                    </p>
                    <p>
                      <span className="font-medium text-slate-500">Transacciones registradas: </span>
                      <strong className="text-slate-900">{closing.transactionCount} pagos en total</strong>
                    </p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <p>
                      <span className="font-medium text-slate-500">Emitido por: </span>
                      <strong className="text-slate-900">
                        {account?.name ?? "Administración"}{" "}
                        {account && <span className="font-normal text-slate-600">({account.roleLabel})</span>}
                      </strong>
                    </p>
                    <p>
                      <span className="font-medium text-slate-500">Hora de generación: </span>
                      <strong className="text-slate-900">{printTarget.printedAt}</strong>
                    </p>
                  </div>
                </div>

                <div className="mb-4 rounded border border-slate-300 bg-white">
                  <table className="w-full text-left text-[10pt]">
                    <colgroup>
                      <col style={{ width: "10%" }} />
                      <col style={{ width: "26%" }} />
                      <col style={{ width: "24%" }} />
                      <col style={{ width: "14%" }} />
                      <col style={{ width: "13%" }} />
                      <col style={{ width: "13%" }} />
                    </colgroup>
                    <thead className="border-b border-slate-300 bg-slate-100 text-[9.5pt] font-bold uppercase text-slate-700">
                      <tr>
                        <th className="px-2 py-1.5">Hora</th>
                        <th className="px-2 py-1.5">Paciente</th>
                        <th className="px-2 py-1.5">Concepto</th>
                        <th className="px-2 py-1.5">Doctor</th>
                        <th className="px-2 py-1.5">Método</th>
                        <th className="px-2 py-1.5 text-right">Monto</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {closing.items.map((item) => (
                        <tr key={item.id}>
                          <td className="px-2 py-1.5 font-mono text-[9.5pt] text-slate-600">{item.time}</td>
                          <td className="px-2 py-1.5">
                            <span className="font-bold text-slate-900">{item.patientName}</span>{" "}
                            <span className="text-[9pt] text-slate-500">({item.patientCedula})</span>
                          </td>
                          <td className="px-2 py-1.5 text-slate-700">{item.concept}</td>
                          <td className="px-2 py-1.5 font-semibold text-slate-800">{item.doctorName}</td>
                          <td className="px-2 py-1.5 text-slate-700">{item.method}</td>
                          <td className="px-2 py-1.5 text-right font-mono font-bold text-slate-900">
                            {formatCOP(item.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="print-avoid-break mb-5 grid grid-cols-2 gap-4">
                  <div className="rounded border border-slate-300 bg-white p-3 text-[10.5pt]">
                    <p className="mb-1.5 text-[9.5pt] font-bold uppercase text-slate-500">
                      Subtotales por método de pago
                    </p>
                    <div className="flex flex-col gap-1">
                      {closing.byMethod.map((m) => (
                        <div key={m.method} className="flex justify-between text-slate-700">
                          <span>
                            {m.method} <span className="text-[9.5pt] text-slate-500">({m.count})</span>:
                          </span>
                          <span className="font-mono font-semibold">{formatCOP(m.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col justify-between rounded border-2 border-slate-900 bg-white p-3.5">
                    <div className="flex items-center justify-between text-[10.5pt] text-slate-600">
                      <span>Total de transacciones:</span>
                      <span className="font-bold text-slate-900">{closing.transactionCount}</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-300 pt-2 text-[11pt]">
                      <span className="font-black uppercase tracking-wide text-slate-900">Total del Día:</span>
                      <span className="font-mono text-[14pt] font-black text-slate-900">
                        {formatCOP(closing.total)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="print-avoid-break mt-8 grid grid-cols-2 gap-10 pt-4 text-center text-[10pt]">
                  <div className="border-t border-slate-400 pt-2">
                    <p className="font-bold text-slate-900">{account?.name ?? "Administración"}</p>
                    <p className="text-[9.5pt] text-slate-500">{account?.roleLabel ?? "Responsable"} · Emisor responsable</p>
                    <p className="mt-0.5 text-[9pt] text-slate-400">Firma del responsable de caja</p>
                  </div>
                  <div className="border-t border-slate-400 pt-2">
                    <p className="font-bold text-slate-900">Dirección Administrativa</p>
                    <p className="text-[9.5pt] text-slate-500">García & Osorio Clínica Odontológica</p>
                    <p className="mt-0.5 text-[9pt] text-slate-400">Firma de revisión y auditoría</p>
                  </div>
                </div>
              </div>
            )}
          </div>,
          getPrintRoot(),
        )}
    </div>
  );
}
