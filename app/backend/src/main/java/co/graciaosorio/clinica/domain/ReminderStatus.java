package co.graciaosorio.clinica.domain;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

public enum ReminderStatus {
    PENDING("pending"),
    CONFIRMED("confirmed");

    private final String value;

    ReminderStatus(String value) {
        this.value = value;
    }

    @JsonValue
    public String value() {
        return value;
    }

    @JsonCreator
    public static ReminderStatus fromValue(String value) {
        for (ReminderStatus s : values()) {
            if (s.value.equalsIgnoreCase(value)) {
                return s;
            }
        }
        throw new IllegalArgumentException("Estado de recordatorio desconocido: " + value);
    }

    @Converter(autoApply = true)
    public static class DbConverter implements AttributeConverter<ReminderStatus, String> {
        @Override
        public String convertToDatabaseColumn(ReminderStatus attribute) {
            return attribute == null ? null : attribute.value;
        }

        @Override
        public ReminderStatus convertToEntityAttribute(String dbData) {
            return dbData == null ? null : fromValue(dbData);
        }
    }
}
