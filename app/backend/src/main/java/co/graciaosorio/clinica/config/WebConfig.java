package co.graciaosorio.clinica.config;

import java.time.Clock;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final String[] allowedOriginPatterns;

    public WebConfig(@Value("${app.cors.allowed-origin-patterns}") String[] allowedOriginPatterns) {
        this.allowedOriginPatterns = allowedOriginPatterns;
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOriginPatterns(allowedOriginPatterns)
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .maxAge(3600);
    }

    /** Reloj inyectable: las pruebas lo reemplazan por uno fijo. */
    @Bean
    Clock clock() {
        return Clock.systemDefaultZone();
    }

    @Bean
    OpenAPI clinicaOpenApi() {
        return new OpenAPI().info(new Info()
                .title("API Clínica Gracia & Osorio")
                .description("Prototipo local: pacientes, agenda de citas, pagos y cierre de caja.")
                .version("0.1.0"));
    }
}
