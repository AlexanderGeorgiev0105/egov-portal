package com.example.demo.domain;

import java.time.OffsetDateTime;
import java.util.UUID;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import com.fasterxml.jackson.databind.JsonNode;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "transport_vehicle_requests")
public class TransportVehicleRequest {

    @Id
    @Column(name = "id", nullable = false)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "owner_egn", nullable = false, length = 10)
    private String ownerEgn;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "kind", nullable = false, columnDefinition = "transport_vehicle_request_kind")
    private TransportVehicleRequestKind kind;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "status", nullable = false, columnDefinition = "transport_vehicle_request_status")
    private TransportVehicleRequestStatus status = TransportVehicleRequestStatus.PENDING;

    @Column(name = "reg_number", columnDefinition = "text")
    private String regNumber;

    @Column(name = "vehicle_id")
    private UUID vehicleId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "payload", nullable = false, columnDefinition = "jsonb")
    private JsonNode payload;

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

    public String getOwnerEgn() { return ownerEgn; }
    public void setOwnerEgn(String ownerEgn) { this.ownerEgn = ownerEgn; }

    public TransportVehicleRequestKind getKind() { return kind; }
    public void setKind(TransportVehicleRequestKind kind) { this.kind = kind; }

    public TransportVehicleRequestStatus getStatus() { return status; }
    public void setStatus(TransportVehicleRequestStatus status) { this.status = status; }

    public String getRegNumber() { return regNumber; }
    public void setRegNumber(String regNumber) { this.regNumber = regNumber; }

    public UUID getVehicleId() { return vehicleId; }
    public void setVehicleId(UUID vehicleId) { this.vehicleId = vehicleId; }

    public JsonNode getPayload() { return payload; }
    public void setPayload(JsonNode payload) { this.payload = payload; }

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
