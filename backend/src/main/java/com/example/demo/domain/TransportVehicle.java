package com.example.demo.domain;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "transport_vehicles")
public class TransportVehicle {

    @Id
    @Column(name = "id", nullable = false)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "owner_egn", nullable = false, length = 10)
    private String ownerEgn;

    @Column(name = "reg_number", nullable = false, columnDefinition = "text")
    private String regNumber;

    @Column(name = "brand", nullable = false, columnDefinition = "text")
    private String brand;

    @Column(name = "model", nullable = false, columnDefinition = "text")
    private String model;

    @Column(name = "manufacture_year", nullable = false)
    private Integer manufactureYear;

    @Column(name = "power_kw", nullable = false)
    private Integer powerKw;

    @Column(name = "euro_category", nullable = false, columnDefinition = "text")
    private String euroCategory;

    @Column(name = "tech_inspection_date")
    private LocalDate techInspectionDate;

    @Column(name = "tech_inspection_valid_until")
    private LocalDate techInspectionValidUntil;

    @Column(name = "tech_inspection_approved_at")
    private OffsetDateTime techInspectionApprovedAt;

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

    public String getRegNumber() { return regNumber; }
    public void setRegNumber(String regNumber) { this.regNumber = regNumber; }

    public String getBrand() { return brand; }
    public void setBrand(String brand) { this.brand = brand; }

    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }

    public Integer getManufactureYear() { return manufactureYear; }
    public void setManufactureYear(Integer manufactureYear) { this.manufactureYear = manufactureYear; }

    public Integer getPowerKw() { return powerKw; }
    public void setPowerKw(Integer powerKw) { this.powerKw = powerKw; }

    public String getEuroCategory() { return euroCategory; }
    public void setEuroCategory(String euroCategory) { this.euroCategory = euroCategory; }

    public LocalDate getTechInspectionDate() { return techInspectionDate; }
    public void setTechInspectionDate(LocalDate techInspectionDate) { this.techInspectionDate = techInspectionDate; }

    public LocalDate getTechInspectionValidUntil() { return techInspectionValidUntil; }
    public void setTechInspectionValidUntil(LocalDate techInspectionValidUntil) { this.techInspectionValidUntil = techInspectionValidUntil; }

    public OffsetDateTime getTechInspectionApprovedAt() { return techInspectionApprovedAt; }
    public void setTechInspectionApprovedAt(OffsetDateTime techInspectionApprovedAt) { this.techInspectionApprovedAt = techInspectionApprovedAt; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
}
