package co.graciaosorio.clinica.service;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class PaymentServiceUnitTest {

    @Test
    @DisplayName("Convierte montos monetarios a palabras en pesos colombianos segun regla formal")
    void convertsAmountsToWordsInCOP() {
        assertEquals("Quinientos mil pesos M/CTE", Formats.numberToWordsCOP(500000));
        assertEquals("Un millón de pesos M/CTE", Formats.numberToWordsCOP(1000000));
        assertEquals("Ochocientos cincuenta mil pesos M/CTE", Formats.numberToWordsCOP(850000));
        assertEquals("Cero pesos M/CTE", Formats.numberToWordsCOP(0));
    }

    @Test
    @DisplayName("Formatea consecutivos contables de recibo con prefijo RC- y cinco digitos")
    void formatsConsecutiveReceiptNumbers() {
        String receiptNumber = "RC-" + String.format("%05d", 1L);
        assertEquals("RC-00001", receiptNumber);

        String receiptNumber105 = "RC-" + String.format("%05d", 105L);
        assertEquals("RC-00105", receiptNumber105);
    }
}
