package co.graciaosorio.clinica.domain;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/** Método de pago. Se serializa con la etiqueta que muestra el frontend (con tilde en "Datáfono"). */
public enum PaymentMethod {
    EFECTIVO("Efectivo"),
    TRANSFERENCIA("Transferencia"),
    DATAFONO("Datáfono");

    private final String label;

    PaymentMethod(String label) {
        this.label = label;
    }

    @JsonValue
    public String label() {
        return label;
    }

    @JsonCreator
    public static PaymentMethod fromLabel(String label) {
        for (PaymentMethod m : values()) {
            if (m.label.equalsIgnoreCase(label) || m.name().equalsIgnoreCase(label)) {
                return m;
            }
        }
        throw new IllegalArgumentException("Método de pago desconocido: " + label);
    }

    @Converter(autoApply = true)
    public static class DbConverter implements AttributeConverter<PaymentMethod, String> {
        @Override
        public String convertToDatabaseColumn(PaymentMethod attribute) {
            return attribute == null ? null : attribute.label;
        }

        @Override
        public PaymentMethod convertToEntityAttribute(String dbData) {
            return dbData == null ? null : fromLabel(dbData);
        }
    }
}
