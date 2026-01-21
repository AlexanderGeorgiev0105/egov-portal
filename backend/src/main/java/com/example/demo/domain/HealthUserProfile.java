package com.example.demo.domain;

import java.time.OffsetDateTime;
import java.util.UUID;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import com.fasterxml.jackson.databind.JsonNode;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "health_user_profiles")
public class HealthUserProfile {

    @Id
    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "personal_doctor_practice_number", length = 10)
    private String personalDoctorPracticeNumber;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "personal_doctor_snapshot", columnDefinition = "jsonb")
    private JsonNode personalDoctorSnapshot;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public String getPersonalDoctorPracticeNumber() { return personalDoctorPracticeNumber; }
    public void setPersonalDoctorPracticeNumber(String personalDoctorPracticeNumber) {
        this.personalDoctorPracticeNumber = personalDoctorPracticeNumber;
    }

    public JsonNode getPersonalDoctorSnapshot() { return personalDoctorSnapshot; }
    public void setPersonalDoctorSnapshot(JsonNode personalDoctorSnapshot) {
        this.personalDoctorSnapshot = personalDoctorSnapshot;
    }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
}
