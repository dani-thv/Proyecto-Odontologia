import { useState } from "react";
import type { FormEvent } from "react";
import type { Payment, PaymentMethod, TreatmentPlan } from "@/types";
import { ApiError, messageOf } from "@/api/http";
import { METHODS, planPending } from "@/utils/finance";
import { toHHMM } from "@/utils/dates";
import { formatCOP } from "@/utils/format";
import Modal from "./Modal";
import Field from "./Field";

interface Props {
  plan: TreatmentPlan;
  patientName: string;
  today: string;
  onSave: (payment: Omit<Payment, "id">) => Promise<void>;
  onClose: () => void;
}

type Errors = Partial<Record<"amount" | "signature", string>>;

export default function PaymentFormModal({ plan, patientName, today, onSave, onClose }: Props) {
  const pending = planPending(plan);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("Efectivo");
  const [concept, setConcept] = useState(plan.payments.length === 0 ? `Cuota inicial – ${plan.concept}` : `Abono – ${plan.concept}`);
  const [signature, setSignature] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const value = Number(amount.replace(/\D/g, ""));
    const next: Errors = {};
    if (!value) next.amount = "Escribe el valor del abono.";
    else if (value > pending) next.amount = `El abono no puede superar el saldo pendiente (${formatCOP(pending)}).`;
    if (!signature.trim()) next.signature = "Registra la firma de conformidad del paciente.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setFormError(null);
    setSaving(true);
    try {
      await onSave({
        date: today,
        time: toHHMM(new Date()),
        concept: value === pending && plan.payments.length === 0 ? `Pago total – ${plan.concept}` : concept.trim() || `Abono – ${plan.concept}`,
        amount: value,
        method,
        signature: signature.trim(),
      });
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) setErrors({ amount: err.message });
      else if (err instanceof ApiError && err.errors) setErrors(err.errors as Errors);
      else setFormError(messageOf(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Registrar abono"
      subtitle={`${patientName} · Saldo pendiente ${formatCOP(pending)}`}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button type="submit" form="payment-form" className="btn-orange" disabled={saving}>
            {saving ? "Guardando…" : "Registrar abono"}
          </button>
        </>
      }
    >
      <form id="payment-form" onSubmit={submit} noValidate className="flex flex-col gap-3.5">
        {formError && (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12.5px] font-semibold text-red-700">
            {formError}
          </p>
        )}
        <Field label="Valor del abono (COP) *" error={errors.amount}>
          <input className="input" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="150000" autoComplete="off" />
        </Field>
        <Field label="Método de pago">
          <select className="input" value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
            {METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </Field>
        <Field label="Concepto">
          <input className="input" value={concept} onChange={(e) => setConcept(e.target.value)} />
        </Field>
        <Field label="Firma de conformidad *" error={errors.signature} hint="Nombre de quien firma, por ejemplo: V. Cruz">
          <input className="input" value={signature} onChange={(e) => setSignature(e.target.value)} autoComplete="off" />
        </Field>
      </form>
    </Modal>
  );
}
