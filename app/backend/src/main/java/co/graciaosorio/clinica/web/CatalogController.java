package co.graciaosorio.clinica.web;

import java.net.URI;
import java.util.List;
import java.util.Map;

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

import co.graciaosorio.clinica.dto.Dtos.DoctorDto;
import co.graciaosorio.clinica.dto.Dtos.DoctorRequest;
import co.graciaosorio.clinica.dto.Dtos.DoctorStatusRequest;
import co.graciaosorio.clinica.dto.Dtos.DoctorUpdateRequest;
import co.graciaosorio.clinica.dto.Dtos.TreatmentDto;
import co.graciaosorio.clinica.dto.Dtos.TreatmentRequest;
import co.graciaosorio.clinica.service.CatalogService;
import co.graciaosorio.clinica.service.Formats;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api")
@Tag(name = "Catálogos", description = "Gestión de doctores y tratamientos")
public class CatalogController {

    private final CatalogService catalog;

    public CatalogController(CatalogService catalog) {
        this.catalog = catalog;
    }

    @GetMapping("/health")
    @Operation(summary = "Estado de la API")
    public Map<String, String> health() {
        return Map.of("status", "ok");
    }

    // ── Doctores ──

    @GetMapping("/doctors")
    @Operation(summary = "Lista doctores en el orden de las pestañas (por defecto solo activos, all=true para incluir inactivos)")
    public List<DoctorDto> doctors(@RequestParam(required = false, defaultValue = "false") boolean all) {
        return catalog.doctors(all);
    }

    @GetMapping("/doctors/{id}")
    @Operation(summary = "Obtiene los datos de un doctor")
    public DoctorDto getDoctor(@PathVariable String id) {
        return catalog.getDoctor(id);
    }

    @PostMapping("/doctors")
    @Operation(summary = "Registra un nuevo doctor en el catálogo (409 si el identificador ya existe)")
    public ResponseEntity<DoctorDto> createDoctor(@Valid @RequestBody DoctorRequest request) {
        DoctorDto created = catalog.createDoctor(request);
        return ResponseEntity.created(URI.create("/api/doctors/" + created.id())).body(created);
    }

    @PutMapping("/doctors/{id}")
    @Operation(summary = "Actualiza los datos de un doctor")
    public DoctorDto updateDoctor(@PathVariable String id, @Valid @RequestBody DoctorUpdateRequest request) {
        return catalog.updateDoctor(id, request);
    }

    @PatchMapping("/doctors/{id}/status")
    @Operation(summary = "Activa o desactiva un doctor en la agenda")
    public DoctorDto updateDoctorStatus(@PathVariable String id, @Valid @RequestBody DoctorStatusRequest request) {
        return catalog.updateDoctorStatus(id, request.active());
    }

    // ── Tratamientos ──

    @GetMapping("/treatments")
    @Operation(summary = "Catálogo de tratamientos ordenados por nombre")
    public List<TreatmentDto> treatments() {
        return catalog.treatments();
    }

    @GetMapping("/treatments/{id}")
    @Operation(summary = "Obtiene los detalles de un tratamiento")
    public TreatmentDto getTreatment(@PathVariable String id) {
        return catalog.getTreatment(Formats.id(id, "tratamiento"));
    }

    @PostMapping("/treatments")
    @Operation(summary = "Crea un nuevo tratamiento (409 si el nombre ya existe)")
    public ResponseEntity<TreatmentDto> createTreatment(@Valid @RequestBody TreatmentRequest request) {
        TreatmentDto created = catalog.createTreatment(request);
        return ResponseEntity.created(URI.create("/api/treatments/" + created.id())).body(created);
    }

    @PutMapping("/treatments/{id}")
    @Operation(summary = "Actualiza el tratamiento (nombre, precio base, duración por defecto)")
    public TreatmentDto updateTreatment(@PathVariable String id, @Valid @RequestBody TreatmentRequest request) {
        return catalog.updateTreatment(Formats.id(id, "tratamiento"), request);
    }

    @DeleteMapping("/treatments/{id}")
    @Operation(summary = "Elimina un tratamiento del catálogo")
    public ResponseEntity<Void> deleteTreatment(@PathVariable String id) {
        catalog.deleteTreatment(Formats.id(id, "tratamiento"));
        return ResponseEntity.noContent().build();
    }
}
