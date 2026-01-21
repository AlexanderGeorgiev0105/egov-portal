package com.example.demo.domain;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "property_debts")
public class PropertyDebt {

    @Id
    @Column(name = "id", nullable = false)
    private UUID id;

    @Column(name = "property_id", nullable = false)
    private UUID propertyId;

    @Column(name = "year", nullable = false)
    private int year;

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @Column(name = "yearly_tax_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal yearlyTaxAmount = BigDecimal.ZERO;

    @Column(name = "yearly_tax_is_paid", nullable = false)
    private boolean yearlyTaxPaid;

    @Column(name = "yearly_tax_paid_at")
    private OffsetDateTime yearlyTaxPaidAt;

    @Column(name = "trash_fee_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal trashFeeAmount = BigDecimal.ZERO;

    @Column(name = "trash_fee_is_paid", nullable = false)
    private boolean trashFeePaid;

    @Column(name = "trash_fee_paid_at")
    private OffsetDateTime trashFeePaidAt;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getPropertyId() { return propertyId; }
    public void setPropertyId(UUID propertyId) { this.propertyId = propertyId; }

    public int getYear() { return year; }
    public void setYear(int year) { this.year = year; }

    public LocalDate getDueDate() { return dueDate; }
    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }

    public BigDecimal getYearlyTaxAmount() { return yearlyTaxAmount; }
    public void setYearlyTaxAmount(BigDecimal yearlyTaxAmount) { this.yearlyTaxAmount = yearlyTaxAmount; }

    public boolean isYearlyTaxPaid() { return yearlyTaxPaid; }
    public void setYearlyTaxPaid(boolean yearlyTaxPaid) { this.yearlyTaxPaid = yearlyTaxPaid; }

    public OffsetDateTime getYearlyTaxPaidAt() { return yearlyTaxPaidAt; }
    public void setYearlyTaxPaidAt(OffsetDateTime yearlyTaxPaidAt) { this.yearlyTaxPaidAt = yearlyTaxPaidAt; }

    public BigDecimal getTrashFeeAmount() { return trashFeeAmount; }
    public void setTrashFeeAmount(BigDecimal trashFeeAmount) { this.trashFeeAmount = trashFeeAmount; }

    public boolean isTrashFeePaid() { return trashFeePaid; }
    public void setTrashFeePaid(boolean trashFeePaid) { this.trashFeePaid = trashFeePaid; }

    public OffsetDateTime getTrashFeePaidAt() { return trashFeePaidAt; }
    public void setTrashFeePaidAt(OffsetDateTime trashFeePaidAt) { this.trashFeePaidAt = trashFeePaidAt; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
}
