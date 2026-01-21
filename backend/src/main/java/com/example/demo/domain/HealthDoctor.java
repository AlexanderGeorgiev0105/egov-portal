package com.example.demo.domain;

import java.time.OffsetDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "health_doctors")
public class HealthDoctor {

    @Id
    @Column(name = "id", nullable = false)
    private UUID id;

    @Column(name = "first_name", nullable = false, columnDefinition = "text")
    private String firstName;

    @Column(name = "last_name", nullable = false, columnDefinition = "text")
    private String lastName;

    @Column(name = "practice_number", nullable = false, unique = true, length = 10)
    private String practiceNumber;

    @Column(name = "rzok_no", nullable = false, length = 30)
    private String rzokNo;

    @Column(name = "health_region", nullable = false, length = 30)
    private String healthRegion;

    @Column(name = "shift", nullable = false)
    private short shift; // 1 or 2

    @Column(name = "mobile", nullable = false, length = 30)
    private String mobile;

    @Column(name = "oblast", nullable = false, columnDefinition = "text")
    private String oblast;

    @Column(name = "city", nullable = false, columnDefinition = "text")
    private String city;

    @Column(name = "street", nullable = false, columnDefinition = "text")
    private String street;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public String getPracticeNumber() { return practiceNumber; }
    public void setPracticeNumber(String practiceNumber) { this.practiceNumber = practiceNumber; }

    public String getRzokNo() { return rzokNo; }
    public void setRzokNo(String rzokNo) { this.rzokNo = rzokNo; }

    public String getHealthRegion() { return healthRegion; }
    public void setHealthRegion(String healthRegion) { this.healthRegion = healthRegion; }

    public short getShift() { return shift; }
    public void setShift(short shift) { this.shift = shift; }

    public String getMobile() { return mobile; }
    public void setMobile(String mobile) { this.mobile = mobile; }

    public String getOblast() { return oblast; }
    public void setOblast(String oblast) { this.oblast = oblast; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getStreet() { return street; }
    public void setStreet(String street) { this.street = street; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
}
