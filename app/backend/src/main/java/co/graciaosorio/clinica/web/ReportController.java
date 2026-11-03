package co.graciaosorio.clinica.web;

import java.time.Clock;
import java.time.LocalDate;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import co.graciaosorio.clinica.dto.Dtos.CashClosingDto;
import co.graciaosorio.clinica.dto.Dtos.DashboardSummaryDto;
import co.graciaosorio.clinica.service.CashClosingService;
import co.graciaosorio.clinica.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api")
@Tag(name = "Reportes", description = "Dashboard y cierre de caja")
public class ReportController {

    private final DashboardService dashboard;
    private final CashClosingService cashClosing;
    private final Clock clock;

    public ReportController(DashboardService dashboard, CashClosingService cashClosing, Clock clock) {
        this.dashboard = dashboard;
        this.cashClosing = cashClosing;
        this.clock = clock;
    }

    @GetMapping("/dashboard/summary")
    @Operation(summary = "Cifras del inicio. `today` permite fijar el día de referencia (la demo usa 2026-09-18).")
    public DashboardSummaryDto summary(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate today) {
        return dashboard.summary(today);
    }

    @GetMapping("/cash-closing")
    @Operation(summary = "Cierre de caja de un día: recaudo por doctor, por método y efectivo esperado")
    public CashClosingDto cashClosing(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return cashClosing.close(date != null ? date : LocalDate.now(clock));
    }
}
