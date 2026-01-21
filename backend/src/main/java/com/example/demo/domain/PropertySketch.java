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
@Table(name = "property_sketches")
public class PropertySketch {

    @Id
    @Column(name = "id", nullable = false)
    private UUID id;

    @Column(name = "property_id", nullable = false)
    private UUID propertyId;

    @Column(name = "request_id", nullable = false, unique = true)
    private UUID requestId;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "doc_type", nullable = false, columnDefinition = "property_sketch_doc_type")
    private PropertySketchDocType docType;

    @Column(name = "term_days", nullable = false)
    private int termDays;

    @Column(name = "approved_at", nullable = false)
    private OffsetDateTime approvedAt;

    @Column(name = "approved_by_admin_id")
    private UUID approvedByAdminId;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getPropertyId() { return propertyId; }
    public void setPropertyId(UUID propertyId) { this.propertyId = propertyId; }

    public UUID getRequestId() { return requestId; }
    public void setRequestId(UUID requestId) { this.requestId = requestId; }

    public PropertySketchDocType getDocType() { return docType; }
    public void setDocType(PropertySketchDocType docType) { this.docType = docType; }

    public int getTermDays() { return termDays; }
    public void setTermDays(int termDays) { this.termDays = termDays; }

    public OffsetDateTime getApprovedAt() { return approvedAt; }
    public void setApprovedAt(OffsetDateTime approvedAt) { this.approvedAt = approvedAt; }

    public UUID getApprovedByAdminId() { return approvedByAdminId; }
    public void setApprovedByAdminId(UUID approvedByAdminId) { this.approvedByAdminId = approvedByAdminId; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
