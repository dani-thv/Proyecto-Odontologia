package co.graciaosorio.clinica.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import co.graciaosorio.clinica.domain.Reminder;
import co.graciaosorio.clinica.dto.Dtos.ReminderDto;
import co.graciaosorio.clinica.dto.Mappers;
import co.graciaosorio.clinica.exception.ApiException;
import co.graciaosorio.clinica.repository.ReminderRepository;

@Service
@Transactional(readOnly = true)
public class ReminderService {

    private final ReminderRepository reminders;

    public ReminderService(ReminderRepository reminders) {
        this.reminders = reminders;
    }

    public List<ReminderDto> list() {
        return reminders.findAllWithDetails().stream().map(Mappers::toDto).toList();
    }

    /** Marca el recordatorio como confirmado y deja la cita en estado confirmada. */
    @Transactional
    public ReminderDto confirm(Long id) {
        Reminder reminder = find(id);
        reminder.confirm();
        return Mappers.toDto(reminder);
    }

    @Transactional
    public void dismiss(Long id) {
        reminders.delete(find(id));
    }

    private Reminder find(Long id) {
        return reminders.findById(id).orElseThrow(() -> ApiException.notFound("Recordatorio", id));
    }
}
