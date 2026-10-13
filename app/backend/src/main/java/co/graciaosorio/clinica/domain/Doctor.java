package co.graciaosorio.clinica.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "doctor")
public class Doctor {

    @Id
    private String id;
    private String name;
    private String label;
    private String specialty;
    private int sortOrder;
    private boolean active = true;

    protected Doctor() {
    }

    public Doctor(String id, String name, String label, String specialty, int sortOrder, boolean active) {
        this.id = id;
        this.name = name;
        this.label = label;
        this.specialty = specialty;
        this.sortOrder = sortOrder;
        this.active = active;
    }

    public void update(String name, String label, String specialty, int sortOrder) {
        this.name = name;
        this.label = label;
        this.specialty = specialty;
        this.sortOrder = sortOrder;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public String getId() { return id; }
    public String getName() { return name; }
    public String getLabel() { return label; }
    public String getSpecialty() { return specialty; }
    public int getSortOrder() { return sortOrder; }
    public boolean isActive() { return active; }
}
