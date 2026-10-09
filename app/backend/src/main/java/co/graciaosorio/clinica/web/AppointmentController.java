package co.graciaosorio.clinica.web;

import java.net.URI;
import java.time.LocalDate;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import co.graciaosorio.clinica.dto.Dtos.AppointmentDto;
import co.graciaosorio.clinica.dto.Dtos.AppointmentRequest;
import co.graciaosorio.clinica.dto.Dtos.PendingDto;
import co.graciaosorio.clinica.dto.Dtos.StatusRequest;
import co.graciaosorio.clinica.service.AppointmentService;
import co.graciaosorio.clinica.service.Formats;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/appointments")
@Tag(name = "Agenda", description = "Citas y pacientes pendientes de reagendar")
public class AppointmentController {

    private final AppointmentService service;

    public AppointmentController(AppointmentService service) {
        this.service = service;
    }

    @GetMapping
    @Operation(summary = "Citas por rango de fechas (ISO yyyy-MM-dd) y doctor")
    public List<AppointmentDto> list(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) String doctorId) {
        return service.list(from, to, doctorId);
    }

    @GetMapping("/pending-reschedule")
    @Operation(summary = "Pacientes que esperan ser reagendados")
    public List<PendingDto> pendingReschedule() {
        return service.pendingReschedule();
    }

    @GetMapping("/{id}")
    public AppointmentDto get(@PathVariable String id) {
        return service.get(Formats.id(id, "cita"));
    }

    @PostMapping
    @Operation(summary = "Crea una cita. 422 fuera de horario, 409 si se cruza con otra del mismo doctor. "
            + "Con fromPendingId el paciente sale de la lista de pendientes.")
    public ResponseEntity<AppointmentDto> create(@Valid @RequestBody AppointmentRequest request,
                                                 @RequestParam(required = false) String fromPendingId) {
        AppointmentDto created = service.create(request,
                fromPendingId == null || fromPendingId.isBlank() ? null : Formats.id(fromPendingId, "pendiente"));
        return ResponseEntity.created(URI.create("/api/appointments/" + created.id())).body(created);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Reemplaza una cita (también sirve para moverla de día u hora)")
    public AppointmentDto update(@PathVariable String id, @Valid @RequestBody AppointmentRequest request) {
        return service.update(Formats.id(id, "cita"), request);
    }

    @PatchMapping("/{id}/status")
    public AppointmentDto updateStatus(@PathVariable String id, @Valid @RequestBody StatusRequest request) {
        return service.updateStatus(Formats.id(id, "cita"), request.status());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        service.delete(Formats.id(id, "cita"));
        return ResponseEntity.noContent().build();
    }
}
