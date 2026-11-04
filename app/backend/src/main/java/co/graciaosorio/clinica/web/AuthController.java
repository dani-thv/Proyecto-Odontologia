package co.graciaosorio.clinica.web;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.NotBlank;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Autenticación", description = "Validación de credenciales en servidor con contraseñas hasheadas")
public class AuthController {

    public record LoginRequest(@NotBlank String username, @NotBlank String password) {}

    public record AuthResponse(String id, String username, String name, String role, String roleLabel, String initials) {}

    // Contraseñas almacenadas de forma hasheada (SHA-256)
    // Merlin: merlina1234 -> 46d03d1624c9c107beee676b701bc95462cfce6ae2862a939f5f65a12da9f1a2
    // admin: admin1234 -> 0192023a7bbd73250516f069df18b500e87b7a66e4a2a1b9f76a8b792e62058b
    private static final Map<String, UserRecord> USERS = Map.of(
        "merlin", new UserRecord("usr-merlin", "Merlin", "Merlin", "secretaria", "Recepción & Caja", "M",
            "46d03d1624c9c107beee676b701bc95462cfce6ae2862a939f5f65a12da9f1a2"),
        "admin", new UserRecord("usr-admin", "admin", "Administrador", "admin", "Administrador", "AD",
            "0192023a7bbd73250516f069df18b500e87b7a66e4a2a1b9f76a8b792e62058b")
    );

    private record UserRecord(String id, String username, String name, String role, String roleLabel, String initials, String passwordHash) {}

    @PostMapping("/login")
    @Operation(summary = "Valida credenciales de usuario con contraseña hasheada")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        if (request.username() == null || request.password() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Credenciales requeridas"));
        }

        String usernameKey = request.username().trim().toLowerCase();
        UserRecord user = USERS.get(usernameKey);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Usuario o contraseña inválidos"));
        }

        String inputHash = hashPassword(request.password().trim());
        if (!inputHash.equalsIgnoreCase(user.passwordHash())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Usuario o contraseña inválidos"));
        }

        return ResponseEntity.ok(new AuthResponse(
            user.id(), user.username(), user.name(), user.role(), user.roleLabel(), user.initials()
        ));
    }

    private static String hashPassword(String password) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] encodedhash = digest.digest(password.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(encodedhash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 no disponible", e);
        }
    }
}
