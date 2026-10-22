package co.graciaosorio.clinica.web;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import co.graciaosorio.clinica.dto.Dtos.ReminderDto;
import co.graciaosorio.clinica.service.Formats;
import co.graciaosorio.clinica.service.ReminderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/reminders")
@Tag(name = "Recordatorios")
public class ReminderController {

    private final ReminderService service;

    public ReminderController(ReminderService service) {
        this.service = service;
    }

    @GetMapping
    public List<ReminderDto> list() {
        return service.list();
    }

    @PostMapping("/{id}/confirm")
    @Operation(summary = "Confirma el recordatorio y la cita asociada")
    public ReminderDto confirm(@PathVariable String id) {
        return service.confirm(Formats.id(id, "recordatorio"));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Descarta el recordatorio (la cita no cambia)")
    public ResponseEntity<Void> dismiss(@PathVariable String id) {
        service.dismiss(Formats.id(id, "recordatorio"));
        return ResponseEntity.noContent().build();
    }
}
