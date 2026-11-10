# INFORME FINAL DE EJECUCION DE PRUEBAS DE SOFTWARE
## Sistema de Gestion Clinica y Control Administrativo de Abonos
### Centro Privado Odontologia Garcia Osorio (Cucuta)

---

### Control de Documento

| Campo | Detalle |
|---|---|
| **Documento** | Informe de Ejecucion de Pruebas de Software y Evaluacion de Calidad |
| **Proyecto** | Sistema de Agendamiento de Citas y Control de Abonos Garcia Osorio |
| **Sede Clinica** | Avenida 9E N° 11-89, Barrio La Riviera, Cucuta, Colombia |
| **Version Auditada** | Release `v1.0` (Commit `53dd5f9`) |
| **Fecha Real de Ejecucion** | 2026-11-09 18:40:47 -05:00 |
| **Elaboro** | **Kevin Sebastian Medina Nava** (`ksebas20500`) & **Didier Andre Vesga Fuentes** (`DidierAVF`) |
| **Reviso y Aprobo** | **Carla Daniela Martinez Panqueva** (`Daniela`, Lider de Proyecto y Frontend) |
| **Estado** | Campana de pruebas completada y aprobada para transicion a v1.1 |

---

## 1. Resumen Ejecutivo de la Ejecucion

La ejecucion de pruebas de software sobre la version `v1.0` se realizo de forma estricta y transparente, ejecutando las herramientas de prueba sobre el entorno real de desarrollo y recopilando las salidas literales sin manipulacion.

### Metricas Consolidadas de la Suite Automatizada

| Componente | Framework y Entorno | Total Pruebas | Pasaron | Fallaron | Errores Criticos | % Exito |
|---|---|:---:|:---:|:---:|:---:|:---:|
| **Backend API** | JUnit 5 Jupiter + MockMvc + H2 (modo PostgreSQL) | 45 | 40 | 4 | 1 | 88.89% |
| **Frontend SPA** | Vitest 5.0.4 + Testing Library + jsdom | 79 | 75 | 4 | 0 | 94.94% |
| **TOTAL CONSOLIDADO** | Suite completa automatizada v1.0 | **124** | **115** | **8** | **1** | **92.74%** |

---

## 2. Resultados de Pruebas por Version (Tags Historicos)

Las suites de prueba se ejecutaron en copias temporales aisladas sobre los tags del repositorio para evidenciar la evolucion del software:

| Tag | Hito de Desarrollo | Componentes Evaluados | Pruebas que Pasaron | Pruebas que Fallaron | Observaciones |
|:---:|---|---|:---:|:---:|---|
| **`v0.0`** | Entregas academicas y SRS | Ninguno (solo PDF/DOCX) | 0 | 0 | Sin codigo ejecutable. |
| **`v0.2`** | Prototipo UI en memoria | Vitest frontend (utilidades) | 9 | 1 archivo | Validacion de fechas y modales en memoria. |
| **`v0.3`** | Arquitectura backend y JPA | Maven test inicial | 0 | Build inicial | Esquema base de base de datos y entidades JPA. |
| **`v1.0`** | Prototipo funcional completo | **Suite total completa** | **115** | **9** | **Estado actual consolidado de la release.** |

*Evidencia cruda literal:* Registrada en `EVIDENCIAS/pruebas/evidencias-crudas/resultados-por-version.txt`.

---

## 3. Matriz de Requisitos del SRS y Estado Real de Cumplimiento

Cada uno de los 17 Requisitos Funcionales del documento `SRS.pdf` fue evaluado contra el codigo fuente real:

| ID Requisito | Nombre del Requisito en SRS | Tipo | Estado de Cumplimiento | Defecto o Hallazgo | Evidencia Asociada |
|:---:|---|:---:|:---:|:---:|---|
| **RF01** | Autenticacion de la secretaria | Funcional | **Pasa con Observacion** | Validacion local en `auth.ts` sin token JWT | `CAP-01-autenticacion-roles.png` |
| **RF02** | Registro de datos basicos del paciente | Funcional | **Pasa** | Validacion de cedula unica y busqueda | Suite `Patients.test.tsx` / `CAP-02-registro-busqueda-pacientes.png` |
| **RF03** | Asignacion sugerida de especialista | Funcional | **No implementado** | No existe logica de sugerencia automatica | Ausencia en codigo fuente |
| **RF04** | Gestion de agendas independientes | Funcional | **Pasa** | Cuadricula reactiva por doctor activo | Suite `Agenda.test.tsx` / `CAP-03-agendamiento-citas.png` |
| **RF05** | Registro y validacion de citas | Funcional | **Pasa** | Horarios 08:00 a 18:00 y duracion > 0 | Suite `ClinicScheduleTest` |
| **RF06** | Gestion de estados de la cita | Funcional | **Pasa** | confirmed, urgent, pending, cancelled | Suite `Agenda.test.tsx` |
| **RF07** | Recordatorios de confirmacion | Funcional | **Pasa** | Listado de citas de manana y wa.me | Suite `Dashboard.test.tsx` / `CAP-05-recordatorios-whatsapp.png` |
| **RF08** | Agendamiento prioritario de urgencia | Funcional | **Pasa** | Estado urgent con color distintivo | `CAP-04-deteccion-cruce-horario.png` |
| **RF09** | Busqueda de pacientes y citas | Funcional | **Pasa** | Filtro instantaneo por nombre o cedula | Suite `Patients.test.tsx` |
| **RF10** | Registro de tratamiento y costo total | Funcional | **Pasa** | Planes de tratamiento y saldos | Suite `ApiIntegrationTest` |
| **RF11** | Registro de abonos y calculo de saldo | Funcional | **Pasa** | Abonos parciales y saldo restante | Suite `finance.test.ts` |
| **RF12** | Validacion de abono inicial minimo | Funcional | **No implementado** | Solo valida no sobrepasar saldo | Ausencia en `PaymentService.java` |
| **RF13** | Separacion de pagos por doctor | Funcional | **Pasa** | Cierre de caja y kpis discriminados | Suite `finance.test.ts` |
| **RF14** | Registro del metodo de pago | Funcional | **Pasa** | Efectivo, Transferencia, Datafono | Suite `Payments.test.tsx` |
| **RF15** | Reporte de cierre de caja diario | Funcional | **Pasa con Defecto** | Etiqueta en test falla en jsdom | DEF-008 en `Payments.test.tsx` |
| **RF16** | Visualizacion diaria y semanal | Funcional | **Pasa** | Cuadricula adaptable a escritorio y movil | Suite `Agenda.test.tsx` |
| **RF17** | Acceso desde dispositivos moviles | Funcional | **Pasa** | BottomTabBar en viewports pequenos | Suite `App.test.tsx` |

---

## 4. Registro Exhaustivo de Defectos (Causas 100% Confirmadas en Codigo)

A continuacion se presentan los 10 defectos tecnicos documentados, clasificados por severidad y con causa raiz confirmada en el codigo:

### DEF-001 (Severidad: Alta / Bloqueante para Recibo HTML)
- **Componente**: `PaymentService.java:280` (`getReceiptHtml`)
- **Causa Confirmada**: En la linea 280 se invoca `.formatted(...)` sobre una plantilla HTML que contiene estilos CSS en linea con caracteres de porcentaje sin escapar (`width: 100%;`, `width: 50%;`). La maquina virtual interpreta `%;` como un especificador de conversion invalido y lanza `java.util.UnknownFormatConversionException: Conversion = ';'`.
- **Impacto**: El endpoint `/api/payments/{id}/receipt/html` falla con error HTTP 500 y detona fallo en `ApiIntegrationTest.generatesReceiptJsonAndHtml`.
- **Estado**: Abierto. Se corregira en v1.1 escapando los porcentajes como `%%`.

### DEF-002 (Severidad: Menor / Formatos)
- **Componente**: `Formats.java:43` / `FormatsTest.java:43`
- **Causa Confirmada**: `Formats.whatsappUrl()` utiliza `URLEncoder.encode(message, StandardCharsets.UTF_8)` que transforma la coma `,` en `%2C`. La prueba unitaria espera coma literal `,`.
- **Impacto**: Falla la prueba `FormatsTest.generatesWhatsappUrlsWithColombiaCode`.
- **Estado**: Abierto. Se corregira en v1.1.

### DEF-003 (Severidad: Media / Logica de Pruebas de Citas)
- **Componente**: `ApiIntegrationTest.java:337` (`changesStatusAndChecksConflictWhenReactivating`)
- **Causa Confirmada**: La prueba cancela la cita 9 y luego intenta crear una nueva cita para el Dr. Carlos de 08:00 a 09:00 esperando código 201 Created. Sin embargo, en `V2__seed.sql` existe la cita 10 (Luis Felipe Roa) de 08:30 a 09:30 para Carlos. El validador detecta colision entre 08:30 y 09:00 y retorna 409 Conflict.
- **Impacto**: Falla en suite de integracion.
- **Estado**: Abierto. Se corregira en v1.1 ajustando el horario de la prueba o los datos semilla.

### DEF-004 (Severidad: Menor / Orden de Consulta)
- **Componente**: `ApiIntegrationTest.java:159` (`includesWhatsappUrlInRemindersAndPending`)
- **Causa Confirmada**: La prueba asume que el indice 0 corresponde a Maria Fernanda Lopez (ID 1). Sin embargo, `AppointmentService.pendingReschedule()` ejecuta `findAllByOrderByRequestedOnAscIdAsc()`, entregando primero a Juliana Restrepo (solicitada el 15 de septiembre, antes del 16 de septiembre).
- **Impacto**: Falla en suite de integracion por ordenamiento.
- **Estado**: Abierto. Se corregira en v1.1.

### DEF-005 (Severidad: Menor / Datos del Dashboard)
- **Componente**: `ApiIntegrationTest.java:455` (`summarizesTheDashboard`)
- **Causa Confirmada**: La prueba valida `byDoctor[?(@.doctorId=='carlos')].count` esperando 6 citas. En `V2__seed.sql` se crearon exactamente 7 citas para Carlos el dia 2026-09-18.
- **Impacto**: Falla de asercion en surefire.
- **Estado**: Abierto. Se corregira en v1.1.

### DEF-006 (Severidad: Menor / Titulo de Pagina)
- **Componente**: `App.test.tsx:13,24`
- **Causa Confirmada**: El test espera `Agenda · Garcia Osorio` y `Pagos · Garcia Osorio`, pero `App.tsx:32` concatena la constante con ampersand `Garcia & Osorio`.
- **Impacto**: Falla en 2 pruebas de navegacion en Vitest.
- **Estado**: Abierto. Se corregira en v1.1.

### DEF-007 (Severidad: Menor / Ambiguedad de Selector)
- **Componente**: `App.test.tsx:50` (`permite cerrar sesion`)
- **Causa Confirmada**: El test invoca `screen.getByText("Merlin")`. Dicho nombre se renderiza simultaneamente en `Sidebar.tsx` y en `Topbar.tsx`, provocando que Testing Library lance `Found multiple elements with the text: Merlin`.
- **Impacto**: Falla en prueba de logout de Vitest.
- **Estado**: Abierto. Se corregira en v1.1 usando selector especifico o `getAllByText`.

### DEF-008 (Severidad: Media / Emulacion de Input Date en jsdom)
- **Componente**: `Payments.test.tsx:55` (`cierre de caja diario`)
- **Causa Confirmada**: En jsdom, `user.clear(dateInput)` y `user.type(dateInput, "2026-09-18")` sobre `<input type="date">` genera valores intermedios vacios o invalidos. La guarda `if (e.target.value) setClosingDate(...)` en `Payments.tsx:288` no actualiza el estado y la vista renderiza 'Sin movimientos registrados' en lugar de los calculos de caja.
- **Impacto**: Falla en suite de pagos de Vitest.
- **Estado**: Abierto. Se corregira en v1.1 utilizando `fireEvent.change`.

### DEF-009 (Severidad: Alta / Vulnerabilidad de Seguridad)
- **Componente**: `AuthController.java` y `src/constants/auth.ts`
- **Causa Confirmada**: Todos los endpoints de la API (`/api/**`) estan completamente abiertos sin filtro de autorizacion ni tokens JWT. El frontend valida credenciales localmente contra constantes estaticas con contrasenas en texto claro.
- **Impacto**: Falta de control de acceso a nivel de API REST.
- **Estado**: Abierto. Se abordara en fase posterior de seguridad.

### DEF-010 (Severidad: Media / Tipado Estricto TypeScript)
- **Componente**: `Dashboard.tsx:82`
- **Causa Confirmada**: Se invoca `const account = useAccount();` y luego se accede directamente a `{account.name}`. La interfaz `AccountContextValue` encapsula `{ account: UserAccount | null }`, por lo que el acceso directo provoca `TS2339: Property 'name' does not exist on type 'AccountContextValue'`.
- **Impacto**: Falla `npx tsc --noEmit` con codigo 1.
- **Estado**: Abierto. Se corregira en v1.1 con desestructuracion `const { account } = useAccount(); account?.name`.

---

## 5. Capturas de Pantalla de la Interfaz (Modo Demostracion)

Las capturas se tomaron en modo demostracion (datos en memoria), sin Spring Boot ni PostgreSQL. De los 9 flujos E2E se ejecutaron: 6 pasaron, 2 pasaron con observacion (E2E-01 y E2E-08) y 1 fallo (E2E-05, el enlace de la interfaz no incluye `?text=`):

| Identificador | Caso Asociado | Descripcion / Comprobacion | Estado | Archivo Generado |
|:---:|:---:|---|:---:|---|
| **CAP-01** | E2E-01 | Acceso y modulos comprobados para secretaria (Recepcion & Caja) y admin (Administrador) | Pasa con observacion | `CAP-01-autenticacion-roles.png` |
| **CAP-02** | E2E-02 | Paciente ficticio (cedula 9999999901) guardado y visible en busqueda instantanea | Pasa | `CAP-02-registro-busqueda-pacientes.png` |
| **CAP-03** | E2E-03 | Cita nueva guardada y renderizada en la cuadricula horaria | Pasa | `CAP-03-agendamiento-citas.png` |
| **CAP-04** | E2E-04 | Modal bloquea guardado y expone alerta de cruce con cita existente | Pasa | `CAP-04-deteccion-cruce-horario.png` |
| **CAP-05** | E2E-05 | Enlace wa.me interceptado pero sin parametro `?text=` en frontend; cita confirmada | Falla (el enlace de la interfaz no incluye ?text=) | `CAP-05-recordatorios-whatsapp.png` |
| **CAP-06** | E2E-06 | Plan de $850.000 con abonos acumulados de $500.000 y saldo pendiente de $350.000 | Pasa | `CAP-06-plan-tratamiento-abonos.png` |
| **CAP-07** | E2E-07 | window.print invocado por el boton de recibo y documento renderizado bajo media print | Pasa | `CAP-07-impresion-recibo-contable.png` |
| **CAP-08** | E2E-08 | Arqueo calculado con diferencia reflejada ante efectivo digitado, desglose por doctor y metodo | Pasa con observacion | `CAP-08-cierre-diario-arqueo.png` |
| **CAP-09** | E2E-09 | Paciente Juliana Restrepo Ocampo retirado de pendientes y agendado en cuadricula | Pasa | `CAP-09-reagendamiento-pendientes.png` |
| **CAP-10** | TC-USA-01 | Sidebar colapsada fuera de pantalla y BottomTabBar activa y visible en viewport 375x667 | Pasa | `CAP-10-diseno-responsivo-movil.png` |

---

## 6. Estado de la Base de Datos y Verificacion Flyway

- **PostgreSQL 16 en Docker**: **No ejecutada**. El motor Docker Desktop no se encontraba en ejecucion durante la campana. Se evito intencionalmente interferir con la base de datos local en el puerto 5432 o denominar 'PostgreSQL' a pruebas en H2.
- **Emulacion H2**: Las pruebas de integracion automatizadas se ejecutaron satisfactoriamente sobre H2 en modo emulacion PostgreSQL (`MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DEFAULT_NULL_ORDERING=HIGH`).
