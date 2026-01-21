package com.example.demo.domain;

import java.time.OffsetDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "properties")
public class Property {

    @Id
    @Column(name = "id", nullable = false)
    private UUID id;

    @Column(name = "owner_user_id", nullable = false)
    private UUID ownerUserId;

    @Column(name = "type", nullable = false, columnDefinition = "text")
    private String type;

    @Column(name = "oblast", nullable = false, columnDefinition = "text")
    private String oblast;

    @Column(name = "place", nullable = false, columnDefinition = "text")
    private String place;

    @Column(name = "address", nullable = false, columnDefinition = "text")
    private String address;

    @Column(name = "area_sqm", nullable = false)
    private int areaSqm;

    @Column(name = "purchase_year", nullable = false)
    private int purchaseYear;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @Column(name = "deactivated_at")
    private OffsetDateTime deactivatedAt;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getOwnerUserId() { return ownerUserId; }
    public void setOwnerUserId(UUID ownerUserId) { this.ownerUserId = ownerUserId; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getOblast() { return oblast; }
    public void setOblast(String oblast) { this.oblast = oblast; }

    public String getPlace() { return place; }
    public void setPlace(String place) { this.place = place; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public int getAreaSqm() { return areaSqm; }
    public void setAreaSqm(int areaSqm) { this.areaSqm = areaSqm; }

    public int getPurchaseYear() { return purchaseYear; }
    public void setPurchaseYear(int purchaseYear) { this.purchaseYear = purchaseYear; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public OffsetDateTime getDeactivatedAt() { return deactivatedAt; }
    public void setDeactivatedAt(OffsetDateTime deactivatedAt) { this.deactivatedAt = deactivatedAt; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
}
