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
@Table(name = "patient")
public class Patient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "document_id", nullable = false)
    private String documentId;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(nullable = false)
    private String phone;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "doctor_id")
    private Doctor doctor;

    @Column(name = "last_visit")
    private LocalDate lastVisit;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected Patient() {
    }

    public Patient(String documentId, String fullName, String phone, Doctor doctor, LocalDate lastVisit) {
        this.documentId = documentId;
        this.fullName = fullName;
        this.phone = phone;
        this.doctor = doctor;
        this.lastVisit = lastVisit;
    }

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
    }

    public void update(String documentId, String fullName, String phone, Doctor doctor, LocalDate lastVisit) {
        this.documentId = documentId;
        this.fullName = fullName;
        this.phone = phone;
        this.doctor = doctor;
        this.lastVisit = lastVisit;
    }

    public Long getId() { return id; }
    public String getDocumentId() { return documentId; }
    public String getFullName() { return fullName; }
    public String getPhone() { return phone; }
    public Doctor getDoctor() { return doctor; }
    public LocalDate getLastVisit() { return lastVisit; }
}
