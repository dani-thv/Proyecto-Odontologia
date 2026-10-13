package co.graciaosorio.clinica.service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.NumberFormat;
import java.util.Locale;

import co.graciaosorio.clinica.exception.ApiException;

/** Formatos de presentación colombianos y utilidades de ids. */
public final class Formats {

    private static final Locale CO = Locale.forLanguageTag("es-CO");

    private Formats() {
    }

    /** `1032458771` → `1.032.458.771`. */
    public static String cedula(String raw) {
        String digits = raw.replaceAll("\\D", "");
        if (digits.length() < 6) {
            throw ApiException.badRequest("La cédula debe tener al menos 6 dígitos.");
        }
        return digits.replaceAll("\\B(?=(\\d{3})+(?!\\d))", ".");
    }

    /** `3104528814` → `310 452 8814`; otros largos se guardan solo con dígitos. */
    public static String phone(String raw) {
        String digits = raw.replaceAll("\\D", "");
        if (digits.length() < 7) {
            throw ApiException.badRequest("Escribe un teléfono válido.");
        }
        return digits.length() == 10
                ? digits.substring(0, 3) + " " + digits.substring(3, 6) + " " + digits.substring(6)
                : digits;
    }

    /** `1234567` → `$ 1.234.567`. */
    public static String cop(long amount) {
        return "$ " + NumberFormat.getIntegerInstance(CO).format(amount);
    }

    public static String time(int hour, int min) {
        return "%02d:%02d".formatted(hour, min);
    }

    public static long id(String raw, String what) {
        try {
            return Long.parseLong(raw.trim());
        } catch (NumberFormatException | NullPointerException e) {
            throw ApiException.badRequest("Identificador inválido de " + what + ": " + raw);
        }
    }

    /** Genera enlace wa.me para Colombia (+57 si el teléfono tiene 10 dígitos). */
    public static String whatsappUrl(String rawPhone, String message) {
        if (rawPhone == null || rawPhone.isBlank()) {
            return null;
        }
        String digits = rawPhone.replaceAll("\\D", "");
        if (digits.length() == 10) {
            digits = "57" + digits;
        }
        if (digits.isBlank()) {
            return null;
        }
        String encoded = URLEncoder.encode(message == null ? "" : message, StandardCharsets.UTF_8).replace("+", "%20");
        return "https://wa.me/" + digits + "?text=" + encoded;
    }

    /** Convierte monto en pesos a letras para recibos de caja (ej. 250000 → "Doscientos cincuenta mil pesos M/CTE"). */
    public static String numberToWordsCOP(long amount) {
        if (amount <= 0) {
            return "Cero pesos M/CTE";
        }
        String text = convertNumber(amount).trim();
        String capitalized = Character.toUpperCase(text.charAt(0)) + text.substring(1);
        if (text.endsWith("millón") || text.endsWith("millones")) {
            return capitalized + " de pesos M/CTE";
        }
        return capitalized + (amount == 1 ? " peso M/CTE" : " pesos M/CTE");
    }

    private static String convertNumber(long n) {
        if (n == 0) return "";
        if (n < 1000) return convertHundreds((int) n);
        if (n < 1_000_000) {
            long thousands = n / 1000;
            long rem = n % 1000;
            String prefix = thousands == 1 ? "mil" : convertHundreds((int) thousands) + " mil";
            return prefix + (rem > 0 ? " " + convertHundreds((int) rem) : "");
        }
        if (n < 1_000_000_000L) {
            long millions = n / 1_000_000;
            long rem = n % 1_000_000;
            String prefix = millions == 1 ? "un millón" : convertNumber(millions) + " millones";
            return prefix + (rem > 0 ? " " + convertNumber(rem) : "");
        }
        return String.valueOf(n);
    }

    private static String convertHundreds(int n) {
        if (n == 100) return "cien";
        String[] hundreds = {"", "ciento", "doscientos", "trescientos", "cuatrocientos", "quinientos", "seiscientos", "setecientos", "ochocientos", "novecientos"};
        int h = n / 100;
        int rem = n % 100;
        String hStr = hundreds[h];
        if (rem == 0) return hStr;
        return (hStr.isEmpty() ? "" : hStr + " ") + convertTens(rem);
    }

    private static String convertTens(int n) {
        if (n < 10) {
            String[] units = {"", "un", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve"};
            return units[n];
        }
        if (n >= 11 && n <= 15) {
            String[] specials = {"once", "doce", "trece", "catorce", "quince"};
            return specials[n - 11];
        }
        if (n == 10) return "diez";
        if (n >= 16 && n <= 19) {
            String[] teens = {"dieciséis", "diecisiete", "dieciocho", "diecinueve"};
            return teens[n - 16];
        }
        if (n == 20) return "veinte";
        if (n >= 21 && n <= 29) {
            String[] twenties = {"veintiún", "veintidós", "veintitrés", "veinticuatro", "veinticinco", "veintiséis", "veintisiete", "veintiocho", "veintinueve"};
            return twenties[n - 21];
        }
        String[] tens = {"", "", "", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"};
        int t = n / 10;
        int rem = n % 10;
        String tStr = tens[t];
        if (rem == 0) return tStr;
        String[] units = {"", "un", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve"};
        return tStr + " y " + units[rem];
    }
}
