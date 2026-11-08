# Backend (Java + Spring Boot)

API REST local del prototipo. Java 21+ (probado con 25), Spring Boot 3.5, Spring Data JPA, Flyway, PostgreSQL.
No hace falta instalar Maven: se usa el wrapper `./mvnw`.

```bash
database/scripts/local-pg.sh start     # 1) base de datos (ver database/README.md)
cd backend && ./mvnw spring-boot:run   # 2) API en http://localhost:8080
```

- Swagger (probar los endpoints): <http://localhost:8080/swagger-ui.html>
- Salud: `GET /api/health`

Configuración por variables de entorno (valores por defecto entre paréntesis):
`DB_URL` (`jdbc:postgresql://localhost:5432/gracia_osorio`), `DB_USER` (`gracia`), `DB_PASSWORD` (`gracia`),
`PORT` (`8080`), `CORS_ORIGINS` (`http://localhost:*,http://127.0.0.1:*`).

## Pruebas

```bash
./mvnw test    # 39 pruebas; usan H2 en memoria (modo PostgreSQL) con las mismas migraciones, no necesitan Postgres
```

## Endpoints (`/api`)

| Recurso | Operaciones |
|---|---|
| `doctors` | `GET ?all=true\|false`, `GET /{id}`, `POST`, `PUT /{id}`, `PATCH /{id}/status` |
| `treatments` | `GET`, `GET /{id}`, `POST`, `PUT /{id}`, `DELETE /{id}` |
| `patients` | `GET ?q=&balance=pendiente\|al-dia`, `GET /{id}`, `POST`, `PUT /{id}`, `DELETE /{id}` |
| `appointments` | `GET ?from=&to=&doctorId=`, `GET /{id}`, `POST ?fromPendingId=`, `PUT /{id}`, `PATCH /{id}/status`, `DELETE /{id}` (incluye `whatsappUrl`) |
| `appointments/pending-reschedule` | `GET` (incluye `whatsappUrl` para contactar y reagendar al paciente) |
| `treatment-plans` | `GET ?patientId=`, `GET /{id}`, `POST`, `POST /{id}/payments` (registrar abono) |
| `payments/{id}/receipt` | `GET` (comprobante de recibo de caja contable en JSON, desglose de saldo anterior, abono y saldo pendiente) |
| `payments/{id}/receipt/html` | `GET` (comprobante de recibo en HTML imprimible con membrete y botón para PDF/WhatsApp) |
| `reminders` | `GET` (incluye `whatsappUrl` pre-redactado para confirmar cita por chat), `POST /{id}/confirm`, `DELETE /{id}` |
| `cash-closing?date=` | `GET` (recaudo por doctor y método, efectivo esperado) |
| `dashboard/summary?today=` | `GET` |

Los nombres de campo coinciden con `frontend/src/types`; los ids viajan como string.

## Reglas de negocio (mismas del frontend)

- Horario: lunes–viernes 8:00–18:00, sábado 8:00–14:00, domingo cerrado → **422**.
- Una cita no puede cruzarse con otra activa del mismo doctor y día → **409**. Las canceladas liberan el horario.
- Un abono no puede superar el saldo pendiente → **422**. Cédula repetida → **409**.
- Errores en formato RFC 7807 (`application/problem+json`) con `detail` en español; los de validación traen `errors` por campo.

## Estructura

`web` (controladores) → `service` (reglas) → `repository` (Spring Data) → `domain` (entidades JPA); `dto` (contratos), `exception` (manejo de errores), `config` (CORS, OpenAPI, reloj).
