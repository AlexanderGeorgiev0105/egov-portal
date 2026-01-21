package com.example.demo.domain;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "property_tax_assessments")
public class PropertyTaxAssessment {

    @Id
    @Column(name = "id", nullable = false)
    private UUID id;

    @Column(name = "property_id", nullable = false)
    private UUID propertyId;

    @Column(name = "request_id", nullable = false, unique = true)
    private UUID requestId;

    @Column(name = "neighborhood", nullable = false, columnDefinition = "text")
    private String neighborhood;

    @Column(name = "purpose", nullable = false, columnDefinition = "text")
    private String purpose;

    @Column(name = "purpose_other", columnDefinition = "text")
    private String purposeOther;

    @Column(name = "has_adjoining_parts", nullable = false)
    private boolean hasAdjoiningParts;

    @Column(name = "price", nullable = false, precision = 12, scale = 2)
    private BigDecimal price = BigDecimal.ZERO;

    @Column(name = "yearly_tax", nullable = false, precision = 12, scale = 2)
    private BigDecimal yearlyTax = BigDecimal.ZERO;

    @Column(name = "trash_fee", nullable = false, precision = 12, scale = 2)
    private BigDecimal trashFee = BigDecimal.ZERO;

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

    public String getNeighborhood() { return neighborhood; }
    public void setNeighborhood(String neighborhood) { this.neighborhood = neighborhood; }

    public String getPurpose() { return purpose; }
    public void setPurpose(String purpose) { this.purpose = purpose; }

    public String getPurposeOther() { return purposeOther; }
    public void setPurposeOther(String purposeOther) { this.purposeOther = purposeOther; }

    public boolean isHasAdjoiningParts() { return hasAdjoiningParts; }
    public void setHasAdjoiningParts(boolean hasAdjoiningParts) { this.hasAdjoiningParts = hasAdjoiningParts; }

    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }

    public BigDecimal getYearlyTax() { return yearlyTax; }
    public void setYearlyTax(BigDecimal yearlyTax) { this.yearlyTax = yearlyTax; }

    public BigDecimal getTrashFee() { return trashFee; }
    public void setTrashFee(BigDecimal trashFee) { this.trashFee = trashFee; }

    public OffsetDateTime getApprovedAt() { return approvedAt; }
    public void setApprovedAt(OffsetDateTime approvedAt) { this.approvedAt = approvedAt; }

    public UUID getApprovedByAdminId() { return approvedByAdminId; }
    public void setApprovedByAdminId(UUID approvedByAdminId) { this.approvedByAdminId = approvedByAdminId; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
