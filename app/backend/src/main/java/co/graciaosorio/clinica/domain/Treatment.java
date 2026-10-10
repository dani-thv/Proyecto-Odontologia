package co.graciaosorio.clinica.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** Catálogo de tratamientos (sugerencias para el formulario de citas). */
@Entity
@Table(name = "treatment")
public class Treatment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    /** Pesos colombianos; null si el cliente aún no define el precio. */
    @Column(name = "base_price")
    private Long basePrice;

    @Column(name = "default_duration_min")
    private int defaultDurationMin;

    protected Treatment() {
    }

    public Treatment(String name, Long basePrice, int defaultDurationMin) {
        this.name = name;
        this.basePrice = basePrice;
        this.defaultDurationMin = defaultDurationMin;
    }

    public void update(String name, Long basePrice, int defaultDurationMin) {
        this.name = name;
        this.basePrice = basePrice;
        this.defaultDurationMin = defaultDurationMin;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public Long getBasePrice() { return basePrice; }
    public int getDefaultDurationMin() { return defaultDurationMin; }
}
