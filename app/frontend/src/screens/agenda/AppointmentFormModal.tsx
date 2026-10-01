import { useState } from "react";
import type { FormEvent } from "react";
import type { Appointment, AppointmentInput, AppointmentStatus, DoctorId, Patient } from "@/types";
import { DOCTORS } from "@/constants/doctors";
import { STATUS, STATUS_ORDER } from "@/constants/status";
import { DEMO_TODAY } from "@/data/demo";
import { formatTime } from "@/utils/format";
import { messageOf } from "@/api/http";
import { validateAppointment } from "@/utils/schedule";
import Modal from "@/components/Modal";
import Field from "@/components/Field";
import ConfirmDialog from "@/components/ConfirmDialog";

export const DURATIONS = [30, 45, 60, 75, 90, 105, 120];

interface Props {
  mode: "create" | "edit";
  initial: Partial<AppointmentInput>;
  patients: Patient[];
  appointments: Appointment[];
  editId?: string;
  onSave: (input: AppointmentInput) => Promise<void>;
  onDelete?: () => Promise<void>;
  onClose: () => void;
}

export default function AppointmentFormModal({
  mode, initial, patients, appointments, editId, onSave, onDelete, onClose,
}: Props) {
  const [patient, setPatient] = useState(initial.patient ?? "");
  const [patientId, setPatientId] = useState<string | null>(initial.patientId ?? null);
  const [treatment, setTreatment] = useState(initial.treatment ?? "");
  const [doctorId, setDoctorId] = useState<DoctorId>(initial.doctorId ?? "carlos");
  const [date, setDate] = useState(initial.date ?? DEMO_TODAY);
  const [time, setTime] = useState(formatTime(initial.startHour ?? 9, initial.startMin ?? 0));
  const [durationMin, setDurationMin] = useState(initial.durationMin ?? 60);
  const [status, setStatus] = useState<AppointmentStatus>(initial.status ?? "confirmed");
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [saving, setSaving] = useState(false);

  const onPatientChange = (value: string) => {
    setPatient(value);
    // Si coincide exactamente con un paciente registrado, la cita queda enlazada por id.
    setPatientId(patients.find((p) => p.name.toLowerCase() === value.trim().toLowerCase())?.id ?? null);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const [startHour = 0, startMin = 0] = time.split(":").map(Number);
    const input: AppointmentInput = {
      patientId, patient: patient.trim(), treatment: treatment.trim(),
      doctorId, date, startHour, startMin, durationMin, status,
    };
    const problem = !date ? "Selecciona la fecha de la cita." : !time ? "Selecciona la hora de inicio." : validateAppointment(input, appointments, editId);
    setError(problem);
    if (problem) return;
    setSaving(true);
    try {
      await onSave(input); // el servidor vuelve a validar horario y cruces
    } catch (err) {
      setError(messageOf(err));
    } finally {
      setSaving(false);
    }
  };

  const formId = `appointment-form-${mode}`;

  return (
    <>
      <Modal
        title={mode === "create" ? "Nueva cita" : "Editar cita"}
        onClose={onClose}
        footer={
          <>
            {mode === "edit" && (
              <>
                <button type="button" className="btn-link-red" onClick={() => setConfirmingDelete(true)}>Eliminar cita</button>
                <div className="flex-1" />
              </>
            )}
            <button type="button" className="btn-ghost" onClick={onClose}>Cancelar</button>
            <button type="submit" form={formId} className="btn-orange" disabled={saving}>
              {saving ? "Guardando…" : mode === "create" ? "Guardar cita" : "Guardar cambios"}
            </button>
          </>
        }
      >
        <form id={formId} onSubmit={submit} noValidate className="flex flex-col gap-3.5">
          {error && (
            <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12.5px] font-semibold text-red-700">
              {error}
            </p>
          )}
          <Field label="Paciente *">
            <input
              className="input"
              list="appointment-patients"
              placeholder="Nombre del paciente"
              value={patient}
              onChange={(e) => onPatientChange(e.target.value)}
              autoComplete="off"
            />
          </Field>
          <datalist id="appointment-patients">
            {patients.map((p) => <option key={p.id} value={p.name} />)}
          </datalist>
          <Field label="Tratamiento">
            <input className="input" placeholder="Ej: Limpieza dental, Extracción molar..." value={treatment} onChange={(e) => setTreatment(e.target.value)} />
          </Field>
          <Field label="Doctor">
            <select className="input" value={doctorId} onChange={(e) => setDoctorId(e.target.value as DoctorId)}>
              {DOCTORS.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Fecha">
              <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
            <Field label="Hora inicio">
              <input className="input" type="time" step={300} value={time} onChange={(e) => setTime(e.target.value)} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Duración">
              <select className="input" value={durationMin} onChange={(e) => setDurationMin(Number(e.target.value))}>
                {DURATIONS.map((v) => <option key={v} value={v}>{v} min</option>)}
              </select>
            </Field>
            <Field label="Estado">
              <select className="input" value={status} onChange={(e) => setStatus(e.target.value as AppointmentStatus)}>
                {STATUS_ORDER.map((s) => <option key={s} value={s}>{STATUS[s].label}</option>)}
              </select>
            </Field>
          </div>
        </form>
      </Modal>

      {confirmingDelete && (
        <ConfirmDialog
          title="Eliminar cita"
          confirmLabel="Eliminar"
          onCancel={() => setConfirmingDelete(false)}
          onConfirm={async () => {
            try {
              await onDelete?.();
            } catch (err) {
              setConfirmingDelete(false);
              setError(messageOf(err));
            }
          }}
        >
          ¿Estás seguro de que deseas eliminar esta cita de la agenda? Esta acción no se puede deshacer.
        </ConfirmDialog>
      )}
    </>
  );
}
