package co.graciaosorio.clinica.exception;

import org.springframework.http.HttpStatus;

/** Error de negocio con el código HTTP y el mensaje (en español) que verá el usuario. */
public class ApiException extends RuntimeException {

    private final HttpStatus status;

    public ApiException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public static ApiException notFound(String what, Object id) {
        return new ApiException(HttpStatus.NOT_FOUND, what + " no encontrado: " + id);
    }

    /** 409: la petición choca con el estado actual (cita cruzada, cédula repetida...). */
    public static ApiException conflict(String message) {
        return new ApiException(HttpStatus.CONFLICT, message);
    }

    /** 422: la petición es válida pero rompe una regla de la clínica (horario, saldo...). */
    public static ApiException unprocessable(String message) {
        return new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, message);
    }

    public static ApiException badRequest(String message) {
        return new ApiException(HttpStatus.BAD_REQUEST, message);
    }
}
