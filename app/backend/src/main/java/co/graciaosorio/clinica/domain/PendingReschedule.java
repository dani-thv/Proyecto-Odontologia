package co.graciaosorio.clinica.domain;

import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/** Paciente que canceló o quedó sin cita y está esperando que lo vuelvan a agendar. */
@Entity
@Table(name = "pending_reschedule")
public class PendingReschedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id")
    private Patient patient;

    private String name;
    private String treatment;
    private String phone;

    @Column(name = "requested_on", nullable = false)
    private LocalDate requestedOn;

    protected PendingReschedule() {
    }

    public Long getId() { return id; }
    public Patient getPatient() { return patient; }
    public String getName() { return name; }
    public String getTreatment() { return treatment; }
    public String getPhone() { return phone; }
    public LocalDate getRequestedOn() { return requestedOn; }
}
