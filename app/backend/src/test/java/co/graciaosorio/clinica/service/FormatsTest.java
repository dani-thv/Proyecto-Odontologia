package co.graciaosorio.clinica.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;

import co.graciaosorio.clinica.exception.ApiException;

class FormatsTest {

    @Test
    void formatsCedulaAndPhone() {
        assertThat(Formats.cedula("1032458771")).isEqualTo("1.032.458.771");
        assertThat(Formats.cedula("1.032.458.771")).isEqualTo("1.032.458.771");
        assertThat(Formats.cedula("79654321")).isEqualTo("79.654.321");
        assertThat(Formats.phone("3104528814")).isEqualTo("310 452 8814");
        assertThat(Formats.phone("604-1234")).isEqualTo("6041234");
    }

    @Test
    void rejectsShortCedulaAndPhone() {
        assertThatThrownBy(() -> Formats.cedula("123")).isInstanceOf(ApiException.class);
        assertThatThrownBy(() -> Formats.phone("12345")).isInstanceOf(ApiException.class);
    }

    @Test
    void formatsPesos() {
        assertThat(Formats.cop(1234567)).isEqualTo("$ 1.234.567");
        assertThat(Formats.cop(0)).isEqualTo("$ 0");
    }

    @Test
    void parsesIds() {
        assertThat(Formats.id("12", "cita")).isEqualTo(12L);
        assertThatThrownBy(() -> Formats.id("abc", "cita")).isInstanceOf(ApiException.class)
                .hasMessageContaining("cita");
    }

    @Test
    void generatesWhatsappUrlsWithColombiaCode() {
        String url = Formats.whatsappUrl("310 452 8814", "Hola María, tu cita está lista.");
        assertThat(url).isEqualTo("https://wa.me/573104528814?text=Hola%20Mar%C3%ADa,%20tu%20cita%20est%C3%A1%20lista.");
        assertThat(Formats.whatsappUrl(null, "test")).isNull();
        assertThat(Formats.whatsappUrl("", "test")).isNull();
    }

    @Test
    void convertsNumbersToWordsInSpanish() {
        assertThat(Formats.numberToWordsCOP(0)).isEqualTo("Cero pesos M/CTE");
        assertThat(Formats.numberToWordsCOP(100)).isEqualTo("Cien pesos M/CTE");
        assertThat(Formats.numberToWordsCOP(250000)).isEqualTo("Doscientos cincuenta mil pesos M/CTE");
        assertThat(Formats.numberToWordsCOP(850000)).isEqualTo("Ochocientos cincuenta mil pesos M/CTE");
        assertThat(Formats.numberToWordsCOP(1000000)).isEqualTo("Un millón de pesos M/CTE");
        assertThat(Formats.numberToWordsCOP(1200000)).isEqualTo("Un millón doscientos mil pesos M/CTE");
    }
}
