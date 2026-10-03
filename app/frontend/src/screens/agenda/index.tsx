import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { AppointmentInput, DoctorId, PendingPatient } from "@/types";
import { useClinic } from "@/state/ClinicContext";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useToast } from "@/components/Toast";
import { messageOf } from "@/api/http";
import Modal from "@/components/Modal";
import { DEMO_TODAY } from "@/data/demo";
import { DAY_NAMES, addDays, parseISODate, startOfWeek, weekdayIndex } from "@/utils/dates";
import { formatTime } from "@/utils/format";
import { validateAppointment } from "@/utils/schedule";
import AppointmentFormModal from "./AppointmentFormModal";
import DesktopAgenda from "./DesktopAgenda";
import MobileAgenda from "./MobileAgenda";
import PendingList from "./PendingList";
import { SLOTS } from "./layout";

type Editor =
  | { mode: "create"; draft: Partial<AppointmentInput>; fromPendingId?: string }
  | { mode: "edit"; id: string };

const TODAY_WEEK = startOfWeek(DEMO_TODAY);

export default function Agenda() {
  const { appointments, pending, patients, addAppointment, updateAppointment, removeAppointment } = useClinic();
  const isMobile = useIsMobile();
  const toast = useToast();
  const [params, setParams] = useSearchParams();

  const [weekStart, setWeekStart] = useState(TODAY_WEEK);
  const [doctorId, setDoctorId] = useState<DoctorId>("carlos");
  const [selectedDate, setSelectedDate] = useState(DEMO_TODAY);
  const [pendingSheetOpen, setPendingSheetOpen] = useState(false);
  const [editor, setEditor] = useState<Editor | null>(null);

  const weekDates = useMemo(() => Array.from({ length: 6 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const activeDate = weekDates.includes(selectedDate) ? selectedDate : weekDates[0]!;
  const defaultDate = isMobile ? activeDate : weekDates.includes(DEMO_TODAY) ? DEMO_TODAY : weekDates[0]!;
  const visible = useMemo(() => appointments.filter((a) => a.doctorId === doctorId), [appointments, doctorId]);

  const openNew = useCallback(
    () => setEditor({ mode: "create", draft: { date: defaultDate, doctorId } }),
    [defaultDate, doctorId],
  );

  // "Nueva cita" desde el dashboard llega como /agenda?nueva=1
  useEffect(() => {
    if (params.get("nueva")) {
      openNew();
      setParams({}, { replace: true });
    }
  }, [params, setParams, openNew]);

  const shiftWeek = (days: number) => {
    const next = addDays(weekStart, days);
    setWeekStart(next);
    setSelectedDate(next);
  };
  const goToday = () => {
    setWeekStart(TODAY_WEEK);
    setSelectedDate(DEMO_TODAY);
  };

  const openCreateAt = (date: string, slotIndex: number) => {
    const slot = SLOTS[slotIndex]!;
    setEditor({ mode: "create", draft: { date, doctorId, startHour: slot.hour, startMin: slot.min } });
  };

  const reschedule = (p: PendingPatient) => {
    setPendingSheetOpen(false);
    setEditor({
      mode: "create",
      fromPendingId: p.id,
      draft: { patientId: p.patientId, patient: p.name, treatment: p.treatment, doctorId, date: defaultDate },
    });
  };

  const label = (date: string) => `${DAY_NAMES[weekdayIndex(date)]} ${parseISODate(date).getDate()}`;

  const dropPending = async (p: PendingPatient, date: string, hour: number, min: number) => {
    const input: AppointmentInput = {
      patientId: p.patientId, patient: p.name, treatment: p.treatment, doctorId,
      date, startHour: hour, startMin: min, durationMin: 60, status: "confirmed",
    };
    const problem = validateAppointment(input, appointments);
    if (problem) return toast(problem, "error");
    try {
      await addAppointment(input, p.id);
      toast(`¡${p.name} agendado para el ${label(date)} a las ${formatTime(hour, min)}!`);
    } catch (e) {
      toast(messageOf(e), "error");
    }
  };

  const moveAppointment = async (id: string, date: string, hour: number, min: number) => {
    const current = appointments.find((a) => a.id === id);
    if (!current) return;
    const { id: _id, ...rest } = current;
    const input: AppointmentInput = { ...rest, date, startHour: hour, startMin: min };
    const problem = validateAppointment(input, appointments, id);
    if (problem) return toast(problem, "error");
    try {
      await updateAppointment(id, input);
      toast(`Cita reubicada a ${label(date)} a las ${formatTime(hour, min)}`);
    } catch (e) {
      toast(messageOf(e), "error");
    }
  };

  const editing = editor?.mode === "edit" ? appointments.find((a) => a.id === editor.id) : undefined;
  const closeEditor = () => setEditor(null);

  return (
    <div className="fade-in flex h-full w-full flex-col">
      {isMobile ? (
        <MobileAgenda
          weekStart={weekStart} weekDates={weekDates} selectedDate={activeDate} onSelectDate={setSelectedDate}
          doctorId={doctorId} onDoctorChange={setDoctorId} appointments={visible}
          pendingCount={pending.length} onOpenPending={() => setPendingSheetOpen(true)}
          onPrevWeek={() => shiftWeek(-7)} onNextWeek={() => shiftWeek(7)}
          onNew={openNew} onCreateAt={openCreateAt} onEdit={(id) => setEditor({ mode: "edit", id })}
        />
      ) : (
        <DesktopAgenda
          weekStart={weekStart} weekDates={weekDates} doctorId={doctorId} onDoctorChange={setDoctorId}
          appointments={visible} pending={pending}
          onPrevWeek={() => shiftWeek(-7)} onNextWeek={() => shiftWeek(7)} onToday={goToday}
          onNew={openNew} onCreateAt={openCreateAt} onEdit={(id) => setEditor({ mode: "edit", id })}
          onReschedule={reschedule} onMove={moveAppointment} onDropPending={dropPending}
        />
      )}

      {isMobile && pendingSheetOpen && (
        <Modal
          variant="sheet"
          title="Pendientes de reagendar"
          subtitle={`${pending.length} pacientes en espera`}
          onClose={() => setPendingSheetOpen(false)}
        >
          <PendingList pending={pending} variant="sheet" onReschedule={reschedule} rescheduleLabel={`Agendar para ${label(activeDate)}`} />
        </Modal>
      )}

      {editor?.mode === "create" && (
        <AppointmentFormModal
          mode="create"
          initial={editor.draft}
          patients={patients}
          appointments={appointments}
          onClose={closeEditor}
          onSave={async (input) => {
            await addAppointment(input, editor.fromPendingId);
            toast(`Cita programada para ${input.patient}`);
            closeEditor();
          }}
        />
      )}

      {editor?.mode === "edit" && editing && (
        <AppointmentFormModal
          mode="edit"
          editId={editing.id}
          initial={editing}
          patients={patients}
          appointments={appointments}
          onClose={closeEditor}
          onSave={async (input) => {
            await updateAppointment(editing.id, input);
            toast("Cita actualizada");
            closeEditor();
          }}
          onDelete={async () => {
            await removeAppointment(editing.id);
            toast("Cita eliminada");
            closeEditor();
          }}
        />
      )}
    </div>
  );
}
