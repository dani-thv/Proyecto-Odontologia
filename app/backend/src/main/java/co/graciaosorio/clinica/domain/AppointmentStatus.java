package co.graciaosorio.clinica.domain;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/** Estado de una cita. En JSON y en la base de datos se guarda en minúscula, igual que el frontend. */
public enum AppointmentStatus {
    CONFIRMED("confirmed"),
    PENDING("pending"),
    URGENT("urgent"),
    CANCELLED("cancelled");

    private final String value;

    AppointmentStatus(String value) {
        this.value = value;
    }

    @JsonValue
    public String value() {
        return value;
    }

    @JsonCreator
    public static AppointmentStatus fromValue(String value) {
        for (AppointmentStatus s : values()) {
            if (s.value.equalsIgnoreCase(value)) {
                return s;
            }
        }
        throw new IllegalArgumentException("Estado de cita desconocido: " + value);
    }

    @Converter(autoApply = true)
    public static class DbConverter implements AttributeConverter<AppointmentStatus, String> {
        @Override
        public String convertToDatabaseColumn(AppointmentStatus attribute) {
            return attribute == null ? null : attribute.value;
        }

        @Override
        public AppointmentStatus convertToEntityAttribute(String dbData) {
            return dbData == null ? null : fromValue(dbData);
        }
    }
}
