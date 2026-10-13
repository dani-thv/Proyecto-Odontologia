package co.graciaosorio.clinica.domain;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;

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
@Table(name = "appointment")
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Null cuando se agenda a alguien que todavía no es paciente registrado. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id")
    private Patient patient;

    @Column(name = "patient_name", nullable = false)
    private String patientName;

    @Column(nullable = false)
    private String treatment = "";

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "doctor_id")
    private Doctor doctor;

    @Column(name = "scheduled_on", nullable = false)
    private LocalDate date;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "duration_min", nullable = false)
    private int durationMin;

    @Column(nullable = false)
    private AppointmentStatus status;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public Appointment() {
    }

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
    }

    public void set(Patient patient, String patientName, String treatment, Doctor doctor, LocalDate date,
                    LocalTime startTime, int durationMin, AppointmentStatus status) {
        this.patient = patient;
        this.patientName = patientName;
        this.treatment = treatment;
        this.doctor = doctor;
        this.date = date;
        this.startTime = startTime;
        this.durationMin = durationMin;
        this.status = status;
    }

    public int startMinutes() {
        return startTime.getHour() * 60 + startTime.getMinute();
    }

    public int endMinutes() {
        return startMinutes() + durationMin;
    }

    public void setStatus(AppointmentStatus status) { this.status = status; }

    public Long getId() { return id; }
    public Patient getPatient() { return patient; }
    public String getPatientName() { return patientName; }
    public String getTreatment() { return treatment; }
    public Doctor getDoctor() { return doctor; }
    public LocalDate getDate() { return date; }
    public LocalTime getStartTime() { return startTime; }
    public int getDurationMin() { return durationMin; }
    public AppointmentStatus getStatus() { return status; }
}
