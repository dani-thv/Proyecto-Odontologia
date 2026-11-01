package co.graciaosorio.clinica.domain;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

/** Tratamiento de un paciente con su costo total; se paga por abonos. */
@Entity
@Table(name = "treatment_plan")
public class TreatmentPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "patient_id")
    private Patient patient;

    @Column(nullable = false)
    private String concept;

    @Column(name = "total_cost", nullable = false)
    private long totalCost;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @OneToMany(mappedBy = "plan", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("paidOn ASC, id ASC")
    private List<Payment> payments = new ArrayList<>();

    protected TreatmentPlan() {
    }

    public TreatmentPlan(Patient patient, String concept, long totalCost) {
        this.patient = patient;
        this.concept = concept;
        this.totalCost = totalCost;
    }

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
    }

    public long totalPaid() {
        return payments.stream().mapToLong(Payment::getAmount).sum();
    }

    public long pending() {
        return totalCost - totalPaid();
    }

    public Payment addPayment(Payment payment) {
        payments.add(payment);
        return payment;
    }

    public Long getId() { return id; }
    public Patient getPatient() { return patient; }
    public String getConcept() { return concept; }
    public long getTotalCost() { return totalCost; }
    public List<Payment> getPayments() { return payments; }
}
