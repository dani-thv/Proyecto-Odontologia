import { useState } from "react";
import type { FormEvent } from "react";
import type { DoctorId, Patient } from "@/types";
import { DOCTORS } from "@/constants/doctors";
import { ApiError, messageOf } from "@/api/http";
import { formatCedula, formatPhone } from "@/utils/format";
import Modal from "./Modal";
import Field from "./Field";

interface Props {
  existing: Patient[];
  onSave: (patient: Omit<Patient, "id">) => Promise<void>;
  onClose: () => void;
}

type Errors = Partial<Record<"name" | "cedula" | "phone", string>>;

export default function PatientFormModal({ existing, onSave, onClose }: Props) {
  const [name, setName] = useState("");
  const [cedula, setCedula] = useState("");
  const [phone, setPhone] = useState("");
  const [doctorId, setDoctorId] = useState<DoctorId>("carlos");
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next: Errors = {};
    const cedulaDigits = cedula.replace(/\D/g, "");
    if (name.trim().length < 3) next.name = "Escribe el nombre completo del paciente.";
    if (cedulaDigits.length < 6) next.cedula = "La cédula debe tener al menos 6 dígitos.";
    else if (existing.some((p) => p.cedula.replace(/\D/g, "") === cedulaDigits)) {
      next.cedula = "Ya existe un paciente con esta cédula.";
    }
    if (phone.replace(/\D/g, "").length < 7) next.phone = "Escribe un teléfono válido.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setFormError(null);
    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        cedula: formatCedula(cedula),
        phone: formatPhone(phone),
        doctorId,
        lastVisit: null,
      });
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) setErrors({ cedula: err.message });
      else if (err instanceof ApiError && err.errors) setErrors(err.errors as Errors);
      else setFormError(messageOf(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Nuevo paciente"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button type="submit" form="patient-form" className="btn-orange" disabled={saving}>
            {saving ? "Guardando…" : "Guardar paciente"}
          </button>
        </>
      }
    >
      <form id="patient-form" onSubmit={submit} noValidate className="flex flex-col gap-3.5">
        {formError && (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12.5px] font-semibold text-red-700">
            {formError}
          </p>
        )}
        <Field label="Nombre completo *" error={errors.name}>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Ana María Pérez" autoComplete="off" />
        </Field>
        <Field label="Cédula *" error={errors.cedula}>
          <input className="input" inputMode="numeric" value={cedula} onChange={(e) => setCedula(e.target.value)} placeholder="1.032.458.771" autoComplete="off" />
        </Field>
        <Field label="Teléfono *" error={errors.phone} hint="Se usa para llamar y escribir por WhatsApp.">
          <input className="input" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="310 452 8814" autoComplete="off" />
        </Field>
        <Field label="Doctor asignado">
          <select className="input" value={doctorId} onChange={(e) => setDoctorId(e.target.value as DoctorId)}>
            {DOCTORS.map((d) => (
              <option key={d.id} value={d.id}>{d.label}</option>
            ))}
          </select>
        </Field>
      </form>
    </Modal>
  );
}
