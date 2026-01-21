package com.example.demo.domain;

import java.time.OffsetDateTime;
import java.util.UUID;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "problem_reports")
public class ProblemReport {

    @Id
    @Column(name = "id", nullable = false)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "user_egn", nullable = false, length = 10)
    private String userEgn;

    @Column(name = "user_full_name", nullable = false, columnDefinition = "text")
    private String userFullName;

    @Column(name = "category", nullable = false, columnDefinition = "text")
    private String category;

    @Column(name = "description", nullable = false, columnDefinition = "text")
    private String description;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "status", nullable = false, columnDefinition = "problem_report_status")
    private ProblemReportStatus status;

    @Column(name = "admin_note", columnDefinition = "text")
    private String adminNote;

    @Column(name = "decided_at")
    private OffsetDateTime decidedAt;

    @Column(name = "decided_by_admin_id")
    private UUID decidedByAdminId;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public String getUserEgn() { return userEgn; }
    public void setUserEgn(String userEgn) { this.userEgn = userEgn; }

    public String getUserFullName() { return userFullName; }
    public void setUserFullName(String userFullName) { this.userFullName = userFullName; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public ProblemReportStatus getStatus() { return status; }
    public void setStatus(ProblemReportStatus status) { this.status = status; }

    public String getAdminNote() { return adminNote; }
    public void setAdminNote(String adminNote) { this.adminNote = adminNote; }

    public OffsetDateTime getDecidedAt() { return decidedAt; }
    public void setDecidedAt(OffsetDateTime decidedAt) { this.decidedAt = decidedAt; }

    public UUID getDecidedByAdminId() { return decidedByAdminId; }
    public void setDecidedByAdminId(UUID decidedByAdminId) { this.decidedByAdminId = decidedByAdminId; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
}
