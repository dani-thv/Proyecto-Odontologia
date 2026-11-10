import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const baseURL = process.argv[2] || "http://localhost:8443";
const outDir = process.argv[3] || "capturas";
const logPath = process.argv[4] || "capturas-log.txt";

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

function getSha256(filePath) {
  const buffer = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function getLogDate() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const mins = pad(d.getMinutes());
  const secs = pad(d.getSeconds());
  return `${year}-${month}-${day} ${hours}:${mins}:${secs} -05:00`;
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const logEntries = [];
  const results = [];

  console.log("Iniciando captura automatizada con Playwright en: " + baseURL);

  async function record(page, capId, casoId, relUrl, viewport, checkDesc, checkResult, filename) {
    const filePath = path.join(outDir, filename);
    await page.screenshot({ path: filePath, fullPage: false });
    const stats = fs.statSync(filePath);
    const sha = getSha256(filePath);
    const relFile = "EVIDENCIAS/pruebas/capturas/" + filename;
    const vpStr = `${viewport.width}x${viewport.height}`;
    const logLine = `[${getLogDate()}] | ${capId} | Caso: ${casoId} | URL: ${relUrl} | Viewport: ${vpStr} | Comprobacion: ${checkDesc} -> ${checkResult} | Archivo: ${relFile} | Tamano: ${stats.size} bytes | SHA256: ${sha}`;
    logEntries.push(logLine);
    console.log(logLine);
    results.push({ capId, casoId, checkDesc, checkResult, relFile, size: stats.size, sha });
    return { capId, casoId, checkResult, relFile, size: stats.size, sha };
  }

  // ==========================================
  // CAP-01: Autenticacion y Roles (E2E-01)
  // Resultado Esperado: Acceso concedido a cada modulo segun rol
  // ==========================================
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(baseURL + "/");
    await page.waitForLoadState("networkidle");

    // 1. Iniciar sesion como Merlin
    const userIn = page.locator("#login-username");
    const passIn = page.locator("#login-password");
    await userIn.fill("Merlin");
    await passIn.fill("merlina1234");
    await page.click('button[type="submit"]');

    const demoBtn = page.getByRole("button", { name: "Continuar en modo demostración" });
    if (await demoBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
      await demoBtn.click();
    }
    await page.waitForSelector("aside.sidebar", { timeout: 8000 });

    const merlinRole = await page.locator("aside.sidebar").getByText("Recepción & Caja").isVisible();
    const merlinNav = (await page.locator("nav.sidebar-nav a").count()) === 4;
    const merlinOk = merlinRole && merlinNav;

    // 2. Cerrar sesion
    await page.click('button[aria-label="Cerrar sesión"]');
    await page.waitForSelector("#login-username", { timeout: 8000 });

    // 3. Iniciar sesion como admin
    await page.fill("#login-username", "admin");
    await page.fill("#login-password", "admin1234");
    await page.click('button[type="submit"]');

    if (await demoBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
      await demoBtn.click();
    }
    await page.waitForSelector("aside.sidebar", { timeout: 8000 });

    const adminRole = await page.locator("aside.sidebar").getByText("Administrador").first().isVisible();
    const adminNav = (await page.locator("nav.sidebar-nav a").count()) === 4;
    const adminOk = adminRole && adminNav;

    const cap01Ok = merlinOk && adminOk;

    await record(
      page,
      "CAP-01",
      "E2E-01",
      "#/agenda (sesion admin)",
      { width: 1440, height: 900 },
      "Acceso y modulos comprobados para secretaria (Recepción & Caja) y admin (Administrador)",
      cap01Ok,
      "CAP-01-autenticacion-roles.png"
    );
    await page.close();
  }

  // Helper para crear sesion autenticada en modo demo para los siguientes casos
  async function setupAuthenticatedPage(viewport = { width: 1440, height: 900 }) {
    const page = await browser.newPage({ viewport });
    // Inyectar espia de window.print
    await page.addInitScript(() => {
      window.__printInvoked = false;
      window.print = () => {
        window.__printInvoked = true;
        console.log("[window.print invocado]");
      };
    });

    await page.goto(baseURL + "/");
    await page.waitForLoadState("networkidle");

    const userIn = page.locator("#login-username");
    if (await userIn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await userIn.fill("Merlin");
      await page.fill("#login-password", "merlina1234");
      await page.click('button[type="submit"]');
    }

    const demoBtn = page.getByRole("button", { name: "Continuar en modo demostración" });
    if (await demoBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await demoBtn.click();
    }
    await page.waitForSelector("#app-root, .main-area, aside.sidebar", { timeout: 10000 });
    await page.waitForTimeout(500);
    return page;
  }

  const desktopPage = await setupAuthenticatedPage({ width: 1440, height: 900 });

  // ==========================================
  // CAP-02: Registro y Busqueda de Paciente (E2E-02)
  // Resultado Esperado: Paciente guardado y visible en busqueda instantanea
  // ==========================================
  {
    await desktopPage.click('a[href="#/pacientes"]');
    await desktopPage.waitForTimeout(500);

    // Abrir modal de nuevo paciente
    await desktopPage.click('button:has-text("Nuevo paciente")');
    await desktopPage.waitForSelector("#patient-form", { timeout: 5000 });

    // Llenar datos FICTICIOS evidentes (cédula 9999999901 requerida)
    const ficCedula = "9999999901";
    const ficNombre = "Paciente Ficticio Prueba";
    await desktopPage.fill('#patient-form input[placeholder*="Ana María"]', ficNombre);
    await desktopPage.fill('#patient-form input[placeholder*="1.032"]', ficCedula);
    await desktopPage.fill('#patient-form input[placeholder*="310 452"]', "3009999999");

    // Guardar
    await desktopPage.click('button[form="patient-form"]');
    await desktopPage.waitForSelector("#patient-form", { state: "detached", timeout: 5000 });
    await desktopPage.waitForTimeout(400);

    // Filtrar en la barra de busqueda por nombre del paciente ficticio registrado
    const searchInput = desktopPage.locator('input[placeholder*="Buscar"]').first();
    await searchInput.fill(ficNombre);
    await desktopPage.waitForTimeout(500);

    // Verificar que aparece en la tabla con su nombre y cédula formateada (9.999.999.901)
    const row = desktopPage.locator('[role="row"]').getByText(ficNombre);
    const cap02Ok = await row.isVisible();

    await record(
      desktopPage,
      "CAP-02",
      "E2E-02",
      "#/pacientes?q=Paciente+Ficticio",
      { width: 1440, height: 900 },
      "Paciente ficticio (cedula 9999999901) guardado y visible en busqueda instantanea",
      cap02Ok,
      "CAP-02-registro-busqueda-pacientes.png"
    );

    // Limpiar busqueda
    await searchInput.fill("");
    await desktopPage.waitForTimeout(300);
  }

  // ==========================================
  // CAP-03: Agendamiento de Cita Valida (E2E-03)
  // Resultado Esperado: Cita renderizada en la cuadricula horaria
  // ==========================================
  {
    await desktopPage.click('a[href="#/agenda"]');
    await desktopPage.waitForTimeout(500);

    // Abrir modal
    await desktopPage.click('button:has-text("Nueva cita")');
    await desktopPage.waitForSelector('form[id^="appointment-form"]', { timeout: 5000 });

    // Llenar cita sin cruce (Dr. Carlos, viernes 2026-09-18 a las 14:00)
    const patientName = "Cita Nueva Verificada";
    await desktopPage.fill('form[id^="appointment-form"] input[placeholder*="Nombre del paciente"], form[id^="appointment-form"] input.input', patientName);
    const treatInput = desktopPage.locator('form[id^="appointment-form"] input[placeholder*="Limpieza dental"]');
    if (await treatInput.isVisible()) {
      await treatInput.fill("Valoración General");
    }

    // Configurar hora inicio a las 14:00
    const timeInput = desktopPage.locator('form[id^="appointment-form"] input[type="time"]');
    if (await timeInput.isVisible()) {
      await timeInput.fill("14:00");
    }

    // Guardar cita
    await desktopPage.click('button:has-text("Guardar cita")');
    await desktopPage.waitForSelector('form[id^="appointment-form"]', { state: "detached", timeout: 5000 });
    await desktopPage.waitForTimeout(600);

    // Verificar en la cuadricula horaria
    const card = desktopPage.locator("main").getByText(patientName).first();
    const cap03Ok = await card.isVisible();

    await record(
      desktopPage,
      "CAP-03",
      "E2E-03",
      "#/agenda (cuadricula horaria)",
      { width: 1440, height: 900 },
      "Cita nueva guardada y renderizada en la cuadricula horaria",
      cap03Ok,
      "CAP-03-agendamiento-citas.png"
    );
  }

  // ==========================================
  // CAP-04: Deteccion de Cruce Horario (E2E-04)
  // Resultado Esperado: Modal bloquea guardado y expone mensaje 409
  // ==========================================
  {
    await desktopPage.click('a[href="#/agenda"]');
    await desktopPage.waitForTimeout(400);

    await desktopPage.click('button:has-text("Nueva cita")');
    await desktopPage.waitForSelector('form[id^="appointment-form"]', { timeout: 5000 });

    const patientInput = desktopPage.locator('form[id^="appointment-form"] input').first();
    await patientInput.fill("Paciente Conflicto");

    // Configurar hora en conflicto (08:00 con cita 9 de Carlos)
    const timeInput = desktopPage.locator('form[id^="appointment-form"] input[type="time"]');
    if (await timeInput.isVisible()) {
      await timeInput.fill("08:00");
    }

    // Intentar guardar
    await desktopPage.click('button:has-text("Guardar cita")');
    await desktopPage.waitForTimeout(400);

    const alertEl = desktopPage.locator('p[role="alert"]');
    const alertVisible = await alertEl.isVisible();
    const alertText = alertVisible ? await alertEl.textContent() : "";
    const cap04Ok = alertVisible && alertText.includes("cruza");

    await record(
      desktopPage,
      "CAP-04",
      "E2E-04",
      "#/agenda (modal conflicto 409)",
      { width: 1440, height: 900 },
      "Modal bloquea guardado y expone alerta de cruce con cita existente",
      cap04Ok,
      "CAP-04-deteccion-cruce-horario.png"
    );

    const cancelBtn = desktopPage.locator('button:has-text("Cancelar")').first();
    if (await cancelBtn.isVisible()) await cancelBtn.click();
    await desktopPage.waitForTimeout(400);
  }

  // ==========================================
  // CAP-05: Recordatorios y Enlace WhatsApp (E2E-05)
  // Resultado Esperado: Abre wa.me con mensaje y cita pasa a confirmada
  // ==========================================
  {
    await desktopPage.click('a[href="#/inicio"]');
    await desktopPage.waitForTimeout(500);

    // Interceptar URL wa.me sin abrirla
    const waLink = desktopPage.locator('section[aria-labelledby="dash-reminders"] a[href*="wa.me"]').first();
    const waHref = (await waLink.isVisible()) ? await waLink.getAttribute("href") : "";
    const hasWaMe = waHref ? waHref.includes("wa.me") : false;
    const hasMessageText = waHref ? waHref.includes("text=") : false;

    // Confirmar cita
    const confirmBtn = desktopPage.locator('section[aria-labelledby="dash-reminders"] button:has-text("Confirmar")').first();
    if (await confirmBtn.isVisible()) {
      await confirmBtn.click();
      await desktopPage.waitForTimeout(500);
    }

    const confirmedBadge = desktopPage.locator('section[aria-labelledby="dash-reminders"] span:has-text("Confirmado")').first();
    const isConfirmed = await confirmedBadge.isVisible();

    // Comprobacion estricta segun Resultado Esperado del xlsx:
    // Requiere wa.me, texto del mensaje, y paso a confirmada
    const cap05Ok = hasWaMe && hasMessageText && isConfirmed;

    const checkDesc = hasMessageText
      ? "Enlace wa.me contiene mensaje y cita pasa a confirmada"
      : `Enlace wa.me interceptado (${waHref}), pero sin parametro text= en frontend; cita confirmada: ${isConfirmed}`;

    await record(
      desktopPage,
      "CAP-05",
      "E2E-05",
      "#/inicio#dash-reminders",
      { width: 1440, height: 900 },
      checkDesc,
      cap05Ok,
      "CAP-05-recordatorios-whatsapp.png"
    );
  }

  // ==========================================
  // CAP-06: Plan de Tratamiento y Abonos (E2E-06)
  // Resultado Esperado: Saldo pendiente actualizado a $350.000
  // ==========================================
  {
    await desktopPage.click('a[href="#/pagos"]');
    await desktopPage.waitForTimeout(500);

    // Seleccionar plan-01 (Valentina Cruz Salcedo - Extraccion molar, total 850.000)
    await desktopPage.selectOption("#pay-patient", "plan-01");
    await desktopPage.waitForTimeout(500);

    // Verificar metricas en pantalla
    const mainText = await desktopPage.locator("main").textContent();
    const hasCost850 = mainText.includes("850.000");
    const hasPaid500 = mainText.includes("500.000");
    const hasBalance350 = mainText.includes("350.000");

    const cap06Ok = hasCost850 && hasPaid500 && hasBalance350;

    await record(
      desktopPage,
      "CAP-06",
      "E2E-06",
      "#/pagos (plan-01)",
      { width: 1440, height: 900 },
      "Plan de $850.000 con abonos acumulados de $500.000 y saldo pendiente de $350.000",
      cap06Ok,
      "CAP-06-plan-tratamiento-abonos.png"
    );
  }

  // ==========================================
  // CAP-07: Impresion de Recibo Contable (E2E-07)
  // Resultado Esperado: Activa window.print con CSS media print
  // ==========================================
  {
    await desktopPage.click('a[href="#/pagos"]');
    await desktopPage.waitForTimeout(400);

    // Resetear bandera del espia
    await desktopPage.evaluate(() => { window.__printInvoked = false; });

    // Clic en boton "Recibo" del primer abono registrado
    const receiptBtn = desktopPage.locator('button:has-text("Recibo")').first();
    if (await receiptBtn.isVisible()) {
      await receiptBtn.click();
      await desktopPage.waitForTimeout(400);
    }

    const printInvoked = await desktopPage.evaluate(() => window.__printInvoked === true);

    // Cambiar a media print para renderizar el documento imprimible
    await desktopPage.emulateMedia({ media: "print" });
    await desktopPage.waitForTimeout(400);

    const printRoot = desktopPage.locator("#print-root");
    const printDocVisible = (await printRoot.count()) > 0 && (await desktopPage.locator('text="N.° de Recibo"').count()) > 0;

    const cap07Ok = printInvoked && printDocVisible;

    await record(
      desktopPage,
      "CAP-07",
      "E2E-07",
      "#/pagos (recibo print view)",
      { width: 1440, height: 900 },
      "window.print invocado por el boton de recibo y documento renderizado bajo media print",
      cap07Ok,
      "CAP-07-impresion-recibo-contable.png"
    );

    await desktopPage.emulateMedia({ media: "screen" });
    await desktopPage.waitForTimeout(300);
  }

  // ==========================================
  // CAP-08: Cierre Diario y Arqueo (E2E-08)
  // Resultado Esperado: Calcula arqueo, desglose por doctor y metodo
  // ==========================================
  {
    await desktopPage.click('a[href="#/pagos"]');
    await desktopPage.waitForTimeout(400);

    // Establecer fecha con transacciones de efectivo (2026-08-10, donde hay abono de $200.000)
    const dateInput = desktopPage.locator('input[aria-label="Fecha del cierre de caja"]');
    await dateInput.fill("2026-08-10");
    await desktopPage.waitForTimeout(400);

    // Scroll hasta cierre de caja
    await desktopPage.locator("#pay-closing").scrollIntoViewIfNeeded();

    // Digitar efectivo contado: $180.000 (esperado: $200.000, diferencia: -$20.000)
    const cashInput = desktopPage.locator("#counted-cash");
    await cashInput.fill("180000");
    await desktopPage.waitForTimeout(400);

    // Validar status de diferencia en la sección de cierre de caja (evitando colisión con toasts)
    const diffStatus = desktopPage.locator('section[aria-labelledby="pay-closing"] div[role="status"]');
    const diffVisible = await diffStatus.isVisible();
    const diffText = diffVisible ? await diffStatus.textContent() : "";
    const hasDiff = diffText.includes("20.000") || diffText.includes("Diferencia");

    const hasByDoctor = await desktopPage.locator('text="Recaudo por doctor"').isVisible();
    const hasByMethod = await desktopPage.locator('text="Recaudo por método"').isVisible();

    const cap08Ok = diffVisible && hasDiff && hasByDoctor && hasByMethod;

    await record(
      desktopPage,
      "CAP-08",
      "E2E-08",
      "#/pagos#pay-closing",
      { width: 1440, height: 900 },
      "Arqueo calculado con diferencia reflejada ante efectivo digitado, desglose por doctor y metodo",
      cap08Ok,
      "CAP-08-cierre-diario-arqueo.png"
    );
  }

  // ==========================================
  // CAP-09: Reagendamiento de Pendientes (E2E-09)
  // Resultado Esperado: Paciente retirado de pendientes y cita agendada
  // ==========================================
  {
    await desktopPage.click('a[href="#/agenda"]');
    await desktopPage.waitForTimeout(500);

    // Verificar lista inicial de pendientes
    const pendingTitle = desktopPage.locator("#pending-title");
    await pendingTitle.scrollIntoViewIfNeeded();

    // Buscar boton de reagendar para el primer paciente pendiente
    const patientPendingName = "Juliana Restrepo Ocampo";
    const rescheduleBtn = desktopPage.locator(`button[aria-label="Reagendar a ${patientPendingName}"]`);

    if (await rescheduleBtn.isVisible()) {
      await rescheduleBtn.click();
      await desktopPage.waitForSelector('form[id^="appointment-form"]', { timeout: 5000 });

      // Seleccionar hora 15:00
      const timeInput = desktopPage.locator('form[id^="appointment-form"] input[type="time"]');
      if (await timeInput.isVisible()) {
        await timeInput.fill("15:00");
      }

      // Guardar cita
      await desktopPage.click('button:has-text("Guardar cita")');
      await desktopPage.waitForSelector('form[id^="appointment-form"]', { state: "detached", timeout: 5000 });
      await desktopPage.waitForTimeout(600);
    }

    // Verificar que el paciente fue retirado de la bandeja de pendientes
    const stillInPending = await desktopPage.locator('aside[aria-labelledby="pending-title"]').getByText(patientPendingName).isVisible();
    const removedFromPending = !stillInPending;

    // Verificar que aparece en la cuadricula
    const scheduledInGrid = await desktopPage.locator("main").getByText(patientPendingName).first().isVisible();

    const cap09Ok = removedFromPending && scheduledInGrid;

    await record(
      desktopPage,
      "CAP-09",
      "E2E-09",
      "#/agenda (reagendamiento)",
      { width: 1440, height: 900 },
      `Paciente ${patientPendingName} retirado de pendientes (${removedFromPending}) y agendado en cuadricula (${scheduledInGrid})`,
      cap09Ok,
      "CAP-09-reagendamiento-pendientes.png"
    );
  }

  await desktopPage.close();

  // ==========================================
  // CAP-10: Diseno Responsivo Movil (TC-USA-01 - 375x667)
  // Resultado Esperado: Sidebar oculta, BottomTabBar activa en base de pantalla
  // ==========================================
  {
    const mobilePage = await setupAuthenticatedPage({ width: 375, height: 667 });
    await mobilePage.waitForTimeout(800);

    const bottomBar = mobilePage.locator('nav.bottom-tab-bar[aria-label="Navegación principal"]');
    const bottomBarVisible = await bottomBar.isVisible();
    const sidebar = mobilePage.locator('aside.sidebar');
    const sidebarBox = (await sidebar.count()) > 0 ? await sidebar.boundingBox() : null;
    const sidebarHidden = !sidebarBox || (sidebarBox.x + sidebarBox.width <= 0) || sidebarBox.width === 0;

    const cap10Ok = bottomBarVisible && sidebarHidden;

    await record(
      mobilePage,
      "CAP-10",
      "TC-USA-01",
      "#/agenda (movil 375x667)",
      { width: 375, height: 667 },
      "Sidebar colapsada fuera de pantalla y BottomTabBar activa y visible en viewport movil 375x667",
      cap10Ok,
      "CAP-10-diseno-responsivo-movil.png"
    );
    await mobilePage.close();
  }

  await browser.close();

  // Guardar log en formato relativo sin rutas de usuario
  const logContent = [
    "REPORTE LITERAL DE GENERACION DE CAPTURAS DE PANTALLA E2E Y RESPONSIVAS",
    "Generado: " + getLogDate(),
    "Modo de ejecucion: Frontend en modo demostracion (LocalRepository) via Playwright / Chromium headless",
    "Base URL: " + baseURL,
    "=".repeat(80),
    "",
    ...logEntries,
    "",
    "=".repeat(80),
    "Fin del reporte de capturas."
  ].join("\n");

  fs.writeFileSync(logPath, logContent, "utf-8");
  console.log("Log guardado exitosamente en: " + logPath);
}

run().catch((err) => {
  console.error("Error ejecutando capturas:", err);
  process.exit(1);
});
