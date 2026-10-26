package co.graciaosorio.clinica.domain;

import java.time.Instant;
import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "payment")
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "plan_id")
    private TreatmentPlan plan;

    @Column(name = "paid_on", nullable = false)
    private LocalDate paidOn;

    @Column(nullable = false)
    private String concept;

    @Column(nullable = false)
    private long amount;

    @Column(nullable = false)
    private PaymentMethod method;

    @Column(nullable = false)
    private String signature;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected Payment() {
    }

    public Payment(TreatmentPlan plan, LocalDate paidOn, String concept, long amount, PaymentMethod method,
                   String signature) {
        this.plan = plan;
        this.paidOn = paidOn;
        this.concept = concept;
        this.amount = amount;
        this.method = method;
        this.signature = signature;
    }

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
    }

    public Long getId() { return id; }
    public TreatmentPlan getPlan() { return plan; }
    public LocalDate getPaidOn() { return paidOn; }
    public String getConcept() { return concept; }
    public long getAmount() { return amount; }
    public PaymentMethod getMethod() { return method; }
    public String getSignature() { return signature; }
}
