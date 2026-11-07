package co.graciaosorio.clinica.web;

import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.matchesPattern;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.transaction.annotation.Transactional;

/**
 * Pruebas de la API completa (controladores → servicios → JPA → migraciones de Flyway) sobre H2 en modo PostgreSQL.
 * Cada prueba hace rollback, así que todas parten de los datos semilla de V2__seed.sql.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class ApiIntegrationTest {

    @Autowired
    MockMvc mvc;

    private ResultActions postJson(String url, String body) throws Exception {
        return mvc.perform(post(url).contentType(MediaType.APPLICATION_JSON).content(body));
    }

    private ResultActions putJson(String url, String body) throws Exception {
        return mvc.perform(put(url).contentType(MediaType.APPLICATION_JSON).content(body));
    }

    private static String appointment(String patientId, String patient, String doctorId, String date, int hour,
                                      int min, int duration, String status) {
        return """
                {"patientId": %s, "patient": "%s", "treatment": "Limpieza", "doctorId": "%s", "date": "%s",
                 "startHour": %d, "startMin": %d, "durationMin": %d, "status": "%s"}
                """.formatted(patientId == null ? "null" : "\"" + patientId + "\"", patient, doctorId, date, hour,
                min, duration, status);
    }

    // ── Catálogos ──

    @Test
    void listsDoctorsInTabOrderAndTreatments() throws Exception {
        mvc.perform(get("/api/doctors")).andExpect(status().isOk())
                .andExpect(jsonPath("$[*].id", contains("carlos", "liliana")))
                .andExpect(jsonPath("$[1].label", is("Dra. Liliana – Odontopediatría")));
        mvc.perform(get("/api/treatments")).andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(10)));
    }

    @Test
    void performsDoctorCrudAndStatusToggle() throws Exception {
        postJson("/api/doctors", """
                {"id": "marina", "name": "Dra. Marina", "label": "Dra. Marina – Endodoncia", "specialty": "Endodoncia", "sortOrder": 5}
                """)
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "/api/doctors/marina"))
                .andExpect(jsonPath("$.name", is("Dra. Marina")))
                .andExpect(jsonPath("$.active", is(true)));

        // Id duplicado
        postJson("/api/doctors", """
                {"id": "marina", "name": "Dra. Marina", "label": "Dra. Marina", "specialty": "Endodoncia", "sortOrder": 5}
                """).andExpect(status().isConflict());

        // Actualizar
        putJson("/api/doctors/marina", """
                {"name": "Dra. Marina Gil", "label": "Dra. Marina Gil – Endodoncia Avanzada", "specialty": "Endodoncia Avanzada", "sortOrder": 6}
                """)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name", is("Dra. Marina Gil")));

        // Desactivar
        mvc.perform(patch("/api/doctors/marina/status").contentType(MediaType.APPLICATION_JSON).content("{\"active\": false}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.active", is(false)));

        // Lista normal no lo incluye
        mvc.perform(get("/api/doctors")).andExpect(jsonPath("$[*].id", contains("carlos", "liliana")));
        // Lista con all=true sí lo incluye
        mvc.perform(get("/api/doctors").param("all", "true")).andExpect(jsonPath("$", hasSize(3)));
    }

    @Test
    void performsTreatmentCrud() throws Exception {
        postJson("/api/treatments", """
                {"name": "Gingivectomía", "basePrice": 300000, "defaultDurationMin": 45}
                """)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name", is("Gingivectomía")))
                .andExpect(jsonPath("$.basePrice", is(300000)));

        // Nombre duplicado
        postJson("/api/treatments", """
                {"name": "Gingivectomía", "basePrice": 300000, "defaultDurationMin": 45}
                """).andExpect(status().isConflict());

        // Actualizar
        mvc.perform(put("/api/treatments/1").contentType(MediaType.APPLICATION_JSON).content("""
                {"name": "Limpieza Profunda con Ultrasonido", "basePrice": 280000, "defaultDurationMin": 60}
                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name", is("Limpieza Profunda con Ultrasonido")));

        // Eliminar
        mvc.perform(delete("/api/treatments/1")).andExpect(status().isNoContent());
        mvc.perform(get("/api/treatments/1")).andExpect(status().isNotFound());
    }

    @Test
    void generatesReceiptJsonAndHtml() throws Exception {
        mvc.perform(get("/api/payments/1/receipt"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.receiptNumber", is("RC-00001")))
                .andExpect(jsonPath("$.amount", is(200000)))
                .andExpect(jsonPath("$.amountFormatted", is("$ 200.000")))
                .andExpect(jsonPath("$.amountInWords", is("Doscientos mil pesos M/CTE")))
                .andExpect(jsonPath("$.patientName", is("Valentina Cruz Salcedo")))
                .andExpect(jsonPath("$.previousBalance", is(850000)))
                .andExpect(jsonPath("$.balanceAfterPayment", is(650000)))
                .andExpect(jsonPath("$.whatsappShareUrl", containsString("wa.me")));

        mvc.perform(get("/api/payments/1/receipt/html"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.TEXT_HTML))
                .andExpect(content().string(containsString("RECIBO DE CAJA")))
                .andExpect(content().string(containsString("RC-00001")))
                .andExpect(content().string(containsString("Valentina Cruz Salcedo")));
    }

    @Test
    void includesWhatsappUrlInRemindersAndPending() throws Exception {
        mvc.perform(get("/api/reminders"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].whatsappUrl", containsString("https://wa.me/573187762200")))
                .andExpect(jsonPath("$[0].patientName", is("Sofía Mendoza Arango")));

        mvc.perform(get("/api/appointments/pending-reschedule"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].whatsappUrl", containsString("https://wa.me/573027714410")))
                .andExpect(jsonPath("$[0].name", is("María Fernanda López")));
    }

    // ── Pacientes ──

    @Test
    void listsPatientsWithBalancesFromTheView() throws Exception {
        mvc.perform(get("/api/patients")).andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(16)));
        mvc.perform(get("/api/patients").param("q", "valentina"))
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].name", is("Valentina Cruz Salcedo")))
                .andExpect(jsonPath("$[0].cedula", is("1.075.312.445")))
                .andExpect(jsonPath("$[0].doctorId", is("carlos")))
                .andExpect(jsonPath("$[0].balance", is(350000)));
    }

    @Test
    void filtersPatientsByBalanceAndSearchesByCedula() throws Exception {
        mvc.perform(get("/api/patients").param("balance", "pendiente"))
                .andExpect(jsonPath("$", hasSize(6)));
        mvc.perform(get("/api/patients").param("balance", "al-dia"))
                .andExpect(jsonPath("$", hasSize(10)));
        mvc.perform(get("/api/patients").param("q", "79.654"))
                .andExpect(jsonPath("$[0].name", is("Jorge Sánchez Duque")));
        mvc.perform(get("/api/patients").param("balance", "xyz")).andExpect(status().isBadRequest());
    }

    @Test
    void createsAPatientFormattingCedulaAndPhone() throws Exception {
        postJson("/api/patients", """
                {"name": "Ana Pérez", "cedula": "52123456", "phone": "3001234567", "doctorId": "liliana"}
                """)
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", containsString("/api/patients/")))
                .andExpect(jsonPath("$.id", matchesPattern("\\d+")))
                .andExpect(jsonPath("$.cedula", is("52.123.456")))
                .andExpect(jsonPath("$.phone", is("300 123 4567")))
                .andExpect(jsonPath("$.balance", is(0)));
    }

    @Test
    void rejectsDuplicateCedulaWithConflict() throws Exception {
        postJson("/api/patients", """
                {"name": "Otra Andrea", "cedula": "1032458771", "phone": "3001234567", "doctorId": "carlos"}
                """)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.detail", is("Ya existe un paciente con esta cédula.")));
    }

    @Test
    void validatesPatientPayload() throws Exception {
        postJson("/api/patients", "{\"name\": \"\", \"cedula\": \"\", \"phone\": \"\", \"doctorId\": \"\"}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.name", notNullValue()))
                .andExpect(jsonPath("$.errors.cedula", notNullValue()))
                .andExpect(jsonPath("$.errors.phone", notNullValue()));
        postJson("/api/patients", """
                {"name": "Ana", "cedula": "52123456", "phone": "3001234567", "doctorId": "nadie"}
                """).andExpect(status().isUnprocessableEntity());
    }

    @Test
    void updatesAndDeletesPatientsButKeepsFinancialHistory() throws Exception {
        putJson("/api/patients/16", """
                {"name": "Esteban G. Mora", "cedula": "1.067.489.122", "phone": "3069142750", "doctorId": "liliana",
                 "lastVisit": "2026-09-18"}
                """)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name", is("Esteban G. Mora")))
                .andExpect(jsonPath("$.doctorId", is("liliana")));

        mvc.perform(delete("/api/patients/16")).andExpect(status().isNoContent());
        mvc.perform(get("/api/patients/16")).andExpect(status().isNotFound());
        // Valentina tiene tratamiento y pagos: no se puede borrar.
        mvc.perform(delete("/api/patients/3")).andExpect(status().isConflict());
        mvc.perform(get("/api/patients/abc")).andExpect(status().isBadRequest());
    }

    // ── Citas ──

    @Test
    void listsAppointmentsByRangeAndDoctor() throws Exception {
        mvc.perform(get("/api/appointments")).andExpect(jsonPath("$", hasSize(20)));
        mvc.perform(get("/api/appointments").param("from", "2026-09-18").param("to", "2026-09-18"))
                .andExpect(jsonPath("$", hasSize(8)))
                .andExpect(jsonPath("$[0].startHour", is(8)))
                .andExpect(jsonPath("$[0].status", is("confirmed")));
        mvc.perform(get("/api/appointments").param("from", "2026-09-14").param("to", "2026-09-19")
                        .param("doctorId", "carlos"))
                .andExpect(jsonPath("$", hasSize(16)));
    }

    @Test
    void createsAnAppointmentLinkedToThePatient() throws Exception {
        postJson("/api/appointments", appointment("1", "Andrea Morales Gómez", "carlos", "2026-09-18", 15, 0, 60,
                "confirmed"))
                .andExpect(status().isCreated())
                // Los contadores de identidad no se revierten con el rollback: solo se comprueba que haya id.
                .andExpect(jsonPath("$.id", matchesPattern("\\d+")))
                .andExpect(jsonPath("$.patientId", is("1")))
                .andExpect(jsonPath("$.date", is("2026-09-18")))
                .andExpect(jsonPath("$.startHour", is(15)));
    }

    @Test
    void rejectsOverlappingAppointmentsOfTheSameDoctor() throws Exception {
        // Andrea (Dr. Carlos) 08:00–09:00 el viernes 18
        postJson("/api/appointments", appointment(null, "Otro Paciente", "carlos", "2026-09-18", 8, 30, 60, "confirmed"))
                .andExpect(status().isConflict())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.detail", is("Se cruza con la cita de Andrea Morales Gómez (08:00 – 09:00).")));
        // Otro doctor sí puede
        postJson("/api/appointments", appointment(null, "Otro Paciente", "liliana", "2026-09-18", 8, 30, 60, "confirmed"))
                .andExpect(status().isCreated());
    }

    @Test
    void cancelledAppointmentsDoNotBlockTheSlot() throws Exception {
        // Isabela miércoles 16 12:00 está cancelada
        postJson("/api/appointments", appointment(null, "Nuevo", "carlos", "2026-09-16", 12, 0, 60, "confirmed"))
                .andExpect(status().isCreated());
    }

    @Test
    void enforcesClinicHours() throws Exception {
        postJson("/api/appointments", appointment(null, "X", "carlos", "2026-09-20", 10, 0, 60, "confirmed"))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.detail", is("La clínica no atiende los domingos.")));
        postJson("/api/appointments", appointment(null, "X", "carlos", "2026-09-19", 13, 30, 60, "confirmed"))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.detail", is("La cita termina después del cierre (14:00).")));
        postJson("/api/appointments", appointment(null, "X", "carlos", "2026-09-18", 7, 0, 60, "confirmed"))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.detail", is("La clínica abre a las 08:00.")));
    }

    @Test
    void validatesAppointmentPayload() throws Exception {
        postJson("/api/appointments", """
                {"patient": "", "doctorId": "carlos", "date": "2026-09-18", "startHour": 99, "startMin": 0,
                 "durationMin": 60, "status": "confirmed"}
                """).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.patient", notNullValue()))
                .andExpect(jsonPath("$.errors.startHour", notNullValue()));
        postJson("/api/appointments", """
                {"patient": "X", "doctorId": "carlos", "date": "2026-09-18", "startHour": 9, "startMin": 0,
                 "durationMin": 60, "status": "inventado"}
                """).andExpect(status().isBadRequest());
        postJson("/api/appointments", appointment("999", "X", "carlos", "2026-09-18", 15, 0, 60, "confirmed"))
                .andExpect(status().isNotFound());
        postJson("/api/appointments", appointment(null, "X", "fantasma", "2026-09-18", 15, 0, 60, "confirmed"))
                .andExpect(status().isUnprocessableEntity());
    }

    @Test
    void movesAnAppointmentWithPut() throws Exception {
        putJson("/api/appointments/9", appointment("1", "Andrea Morales Gómez", "carlos", "2026-09-18", 15, 30, 60,
                "confirmed"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.startHour", is(15)))
                .andExpect(jsonPath("$.startMin", is(30)));
        // No choca consigo misma al guardarse en el mismo horario
        putJson("/api/appointments/9", appointment("1", "Andrea Morales Gómez", "carlos", "2026-09-18", 15, 30, 60,
                "pending")).andExpect(status().isOk());
        // Moverla encima de la de Valentina (09:30–11:00) sí choca
        putJson("/api/appointments/9", appointment("1", "Andrea Morales Gómez", "carlos", "2026-09-18", 10, 0, 60,
                "confirmed")).andExpect(status().isConflict());
    }

    @Test
    void changesStatusAndChecksConflictWhenReactivating() throws Exception {
        mvc.perform(patch("/api/appointments/9/status").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\": \"cancelled\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status", is("cancelled")));
        // Alguien toma el horario liberado
        postJson("/api/appointments", appointment(null, "Otro", "carlos", "2026-09-18", 8, 0, 60, "confirmed"))
                .andExpect(status().isCreated());
        // Reactivar la cancelada ahora choca
        mvc.perform(patch("/api/appointments/9/status").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\": \"confirmed\"}"))
                .andExpect(status().isConflict());
    }

    @Test
    void deletesAnAppointmentAndItsReminder() throws Exception {
        mvc.perform(get("/api/reminders")).andExpect(jsonPath("$", hasSize(4)));
        mvc.perform(delete("/api/appointments/17")).andExpect(status().isNoContent());
        mvc.perform(get("/api/appointments/17")).andExpect(status().isNotFound());
    }

    @Test
    void schedulingFromPendingListRemovesThePatientFromIt() throws Exception {
        mvc.perform(get("/api/appointments/pending-reschedule"))
                .andExpect(jsonPath("$", hasSize(4)))
                .andExpect(jsonPath("$[0].name", is("Juliana Restrepo Ocampo")))
                .andExpect(jsonPath("$[0].requestedOn", is("2026-09-15")));

        postJson("/api/appointments?fromPendingId=4",
                appointment("16", "Esteban Gutiérrez Mora", "carlos", "2026-09-18", 16, 0, 60, "confirmed"))
                .andExpect(status().isCreated());

        mvc.perform(get("/api/appointments/pending-reschedule")).andExpect(jsonPath("$", hasSize(3)));
    }

    // ── Pagos ──

    @Test
    void listsTreatmentPlansWithDerivedTotals() throws Exception {
        mvc.perform(get("/api/treatment-plans").param("patientId", "3"))
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].concept", is("Extracción molar")))
                .andExpect(jsonPath("$[0].totalCost", is(850000)))
                .andExpect(jsonPath("$[0].totalPaid", is(500000)))
                .andExpect(jsonPath("$[0].pending", is(350000)))
                .andExpect(jsonPath("$[0].payments", hasSize(3)))
                .andExpect(jsonPath("$[0].payments[0].method", is("Efectivo")))
                .andExpect(jsonPath("$[0].payments[2].method", is("Datáfono")));
    }

    @Test
    void registersAPaymentAndTheBalanceDrops() throws Exception {
        postJson("/api/treatment-plans/1/payments", """
                {"date": "2026-09-18", "amount": 150000, "method": "Efectivo", "signature": "V. Cruz"}
                """)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.totalPaid", is(650000)))
                .andExpect(jsonPath("$.pending", is(200000)))
                .andExpect(jsonPath("$.payments", hasSize(4)))
                .andExpect(jsonPath("$.payments[3].concept", is("Abono – Extracción molar")))
                .andExpect(jsonPath("$.payments[3].id", notNullValue()));

        mvc.perform(get("/api/patients/3")).andExpect(jsonPath("$.balance", is(200000)));
    }

    @Test
    void usesTodayWhenNoPaymentDateIsGiven() throws Exception {
        postJson("/api/treatment-plans/4/payments", """
                {"amount": 75000, "method": "Datáfono", "signature": "C. Pinto"}
                """)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.pending", is(0)))
                .andExpect(jsonPath("$.payments[0].concept", is("Pago total – Odontopediatría")))
                .andExpect(jsonPath("$.payments[0].date", notNullValue()));
    }

    @Test
    void rejectsPaymentsAboveThePendingBalance() throws Exception {
        postJson("/api/treatment-plans/1/payments", """
                {"amount": 350001, "method": "Efectivo", "signature": "V. Cruz"}
                """)
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.detail", is("El abono no puede superar el saldo pendiente ($ 350.000).")));
        postJson("/api/treatment-plans/1/payments", """
                {"amount": 0, "method": "Efectivo", "signature": ""}
                """)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.amount", notNullValue()))
                .andExpect(jsonPath("$.errors.signature", notNullValue()));
        postJson("/api/treatment-plans/1/payments", """
                {"amount": 1000, "method": "Bitcoin", "signature": "V"}
                """).andExpect(status().isBadRequest());
    }

    @Test
    void createsATreatmentPlan() throws Exception {
        postJson("/api/treatment-plans", """
                {"patientId": "1", "concept": "Blanqueamiento", "totalCost": 600000}
                """)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.pending", is(600000)));
        mvc.perform(get("/api/patients/1")).andExpect(jsonPath("$.balance", is(600000)));
    }

    // ── Reportes ──

    @Test
    void computesTheDailyCashClosing() throws Exception {
        mvc.perform(get("/api/cash-closing").param("date", "2026-09-18"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total", is(1380000)))
                .andExpect(jsonPath("$.expectedCash", is(760000)))
                .andExpect(jsonPath("$.byDoctor[?(@.doctorId=='liliana')].amount", contains(500000)))
                .andExpect(jsonPath("$.byDoctor[?(@.doctorId=='carlos')].amount", contains(880000)))
                .andExpect(jsonPath("$.byMethod[?(@.method=='Datáfono')].amount", contains(320000)));
        mvc.perform(get("/api/cash-closing").param("date", "2026-01-01"))
                .andExpect(jsonPath("$.total", is(0)));
    }

    @Test
    void summarizesTheDashboard() throws Exception {
        mvc.perform(get("/api/dashboard/summary").param("today", "2026-09-18"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.appointmentsToday", is(8)))
                .andExpect(jsonPath("$.urgentToday", is(1)))
                .andExpect(jsonPath("$.byDoctor[?(@.doctorId=='carlos')].count", contains(6)))
                .andExpect(jsonPath("$.tomorrowTotal", is(4)))
                .andExpect(jsonPath("$.tomorrowConfirmed", is(0)))
                .andExpect(jsonPath("$.toConfirm", is(6)))
                .andExpect(jsonPath("$.patients", is(16)));
    }

    // ── Recordatorios ──

    @Test
    void confirmingAReminderConfirmsTheAppointment() throws Exception {
        mvc.perform(post("/api/reminders/1/confirm"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("confirmed")))
                .andExpect(jsonPath("$.appointmentId", is("17")));
        mvc.perform(get("/api/appointments/17")).andExpect(jsonPath("$.status", is("confirmed")));
        mvc.perform(get("/api/dashboard/summary").param("today", "2026-09-18"))
                .andExpect(jsonPath("$.tomorrowConfirmed", is(1)));
    }

    @Test
    void dismissingAReminderKeepsTheAppointment() throws Exception {
        mvc.perform(delete("/api/reminders/3")).andExpect(status().isNoContent());
        mvc.perform(get("/api/reminders")).andExpect(jsonPath("$", hasSize(3)));
        mvc.perform(get("/api/appointments/19")).andExpect(status().isOk());
        mvc.perform(post("/api/reminders/999/confirm")).andExpect(status().isNotFound());
    }

    @Test
    void exposesHealthAndOpenApi() throws Exception {
        mvc.perform(get("/api/health")).andExpect(jsonPath("$.status", is("ok")));
        mvc.perform(get("/v3/api-docs")).andExpect(status().isOk())
                .andExpect(jsonPath("$.info.title", is("API Clínica Gracia & Osorio")));
    }

    @Test
    void sendsCorsHeadersForTheLocalFrontend() throws Exception {
        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options("/api/patients")
                        .header("Origin", "http://localhost:8443")
                        .header("Access-Control-Request-Method", "POST"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:8443"));
    }
}
