package co.graciaosorio.clinica.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

/** Recordatorio de una cita para confirmar por llamada. */
@Entity
@Table(name = "reminder")
public class Reminder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "appointment_id")
    private Appointment appointment;

    @Column(nullable = false)
    private ReminderStatus status = ReminderStatus.PENDING;

    protected Reminder() {
    }

    public void confirm() {
        this.status = ReminderStatus.CONFIRMED;
        this.appointment.setStatus(AppointmentStatus.CONFIRMED);
    }

    public Long getId() { return id; }
    public Appointment getAppointment() { return appointment; }
    public ReminderStatus getStatus() { return status; }
}
