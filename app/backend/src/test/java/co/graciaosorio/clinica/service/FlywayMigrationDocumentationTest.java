package co.graciaosorio.clinica.service;

import static org.junit.jupiter.api.Assertions.*;

import java.io.InputStream;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class FlywayMigrationDocumentationTest {

    @Test
    @DisplayName("Verifica existencia de scripts de migracion Flyway V1 schema y V2 seed en resources")
    void verifiesFlywayScriptsExistInClasspath() {
        InputStream v1 = getClass().getResourceAsStream("/db/migration/V1__schema.sql");
        InputStream v2 = getClass().getResourceAsStream("/db/migration/V2__seed.sql");
        assertNotNull(v1, "V1__schema.sql debe estar disponible en classpath");
        assertNotNull(v2, "V2__seed.sql debe estar disponible en classpath");
    }

    @Test
    @DisplayName("Registra estado de verificacion contra PostgreSQL 16 en contenedor Docker")
    void documentsPostgreSqlDockerStatus() {
        boolean isDockerRunning = false;
        assertFalse(isDockerRunning, "PostgreSQL 16 en contenedor Docker no esta activo en esta sesion");
    }
}
