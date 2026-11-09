// Script de auditoria de seguridad de endpoints y cabeceras
console.log("=== Auditoria de Seguridad Clinica API ===");
console.log("1. Endpoints desprotegidos: /api/* accesibles sin header Authorization (DEF-009)");
console.log("2. Credenciales en texto claro: Merlin y admin almacenados en constantes");
console.log("3. CORS: Configurado para origenes locales en WebConfig.java");
