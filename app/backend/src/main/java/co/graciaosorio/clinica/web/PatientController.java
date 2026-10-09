package co.graciaosorio.clinica.web;

import java.net.URI;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import co.graciaosorio.clinica.dto.Dtos.PatientDto;
import co.graciaosorio.clinica.dto.Dtos.PatientRequest;
import co.graciaosorio.clinica.service.Formats;
import co.graciaosorio.clinica.service.PatientService;
import co.graciaosorio.clinica.service.PatientService.BalanceFilter;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/patients")
@Tag(name = "Pacientes")
public class PatientController {

    private final PatientService service;

    public PatientController(PatientService service) {
        this.service = service;
    }

    @GetMapping
    @Operation(summary = "Lista pacientes con su saldo. Filtros: q (nombre o cédula) y balance (pendiente | al-dia)")
    public List<PatientDto> list(@RequestParam(required = false) String q,
                                 @RequestParam(required = false) String balance) {
        return service.list(q, BalanceFilter.parse(balance));
    }

    @GetMapping("/{id}")
    public PatientDto get(@PathVariable String id) {
        return service.get(Formats.id(id, "paciente"));
    }

    @PostMapping
    @Operation(summary = "Registra un paciente (409 si la cédula ya existe)")
    public ResponseEntity<PatientDto> create(@Valid @RequestBody PatientRequest request) {
        PatientDto created = service.create(request);
        return ResponseEntity.created(URI.create("/api/patients/" + created.id())).body(created);
    }

    @PutMapping("/{id}")
    public PatientDto update(@PathVariable String id, @Valid @RequestBody PatientRequest request) {
        return service.update(Formats.id(id, "paciente"), request);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Elimina un paciente sin tratamientos ni pagos (409 en caso contrario)")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        service.delete(Formats.id(id, "paciente"));
        return ResponseEntity.noContent().build();
    }
}
