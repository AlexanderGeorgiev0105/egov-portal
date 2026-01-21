package com.example.demo.domain;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "health_appointments")
public class HealthAppointment {

    @Id
    @Column(name = "id", nullable = false)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "doctor_practice_number", nullable = false, length = 10)
    private String doctorPracticeNumber;

    @Column(name = "doctor_name", nullable = false, columnDefinition = "text")
    private String doctorName;

    @Column(name = "appt_date", nullable = false)
    private LocalDate apptDate;

    @Column(name = "appt_time", nullable = false, length = 5)
    private String apptTime;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public String getDoctorPracticeNumber() { return doctorPracticeNumber; }
    public void setDoctorPracticeNumber(String doctorPracticeNumber) { this.doctorPracticeNumber = doctorPracticeNumber; }

    public String getDoctorName() { return doctorName; }
    public void setDoctorName(String doctorName) { this.doctorName = doctorName; }

    public LocalDate getApptDate() { return apptDate; }
    public void setApptDate(LocalDate apptDate) { this.apptDate = apptDate; }

    public String getApptTime() { return apptTime; }
    public void setApptTime(String apptTime) { this.apptTime = apptTime; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
}
