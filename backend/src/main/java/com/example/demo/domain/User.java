package com.example.demo.domain;

import java.time.LocalDate;
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
@Table(name = "users")
public class User {

    @Id
    @Column(name = "id", nullable = false)
    private UUID id;

    @Column(name = "full_name", nullable = false, columnDefinition = "text")
    private String fullName;

    @Column(name = "egn", nullable = false, unique = true, length = 10)
    private String egn;

    @Column(name = "gender", nullable = false, length = 20)
    private String gender;

    @Column(name = "dob", nullable = false)
    private LocalDate dob;

    @Column(name = "doc_number", nullable = false, length = 9)
    private String docNumber;

    @Column(name = "doc_valid_until", nullable = false)
    private LocalDate docValidUntil;

    @Column(name = "issued_at", nullable = false, columnDefinition = "text")
    private String issuedAt;

    @Column(name = "birth_place", nullable = false, columnDefinition = "text")
    private String birthPlace;

    @Column(name = "address", nullable = false, columnDefinition = "text")
    private String address;

    @Column(name = "phone", nullable = false, length = 10)
    private String phone;

    @Column(name = "email", nullable = false, unique = true, length = 254)
    private String email;

    @Column(name = "password_hash", nullable = false, columnDefinition = "text")
    private String passwordHash;

    // IMPORTANT: PostgreSQL enum type mapping (account_status)
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "account_status", nullable = false, columnDefinition = "account_status")
    private AccountStatus accountStatus = AccountStatus.PENDING;

    @Column(name = "approved_at")
    private OffsetDateTime approvedAt;

    @Column(name = "approved_by_admin_id")
    private UUID approvedByAdminId;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getEgn() { return egn; }
    public void setEgn(String egn) { this.egn = egn; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }

    public LocalDate getDob() { return dob; }
    public void setDob(LocalDate dob) { this.dob = dob; }

    public String getDocNumber() { return docNumber; }
    public void setDocNumber(String docNumber) { this.docNumber = docNumber; }

    public LocalDate getDocValidUntil() { return docValidUntil; }
    public void setDocValidUntil(LocalDate docValidUntil) { this.docValidUntil = docValidUntil; }

    public String getIssuedAt() { return issuedAt; }
    public void setIssuedAt(String issuedAt) { this.issuedAt = issuedAt; }

    public String getBirthPlace() { return birthPlace; }
    public void setBirthPlace(String birthPlace) { this.birthPlace = birthPlace; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }

    public AccountStatus getAccountStatus() { return accountStatus; }
    public void setAccountStatus(AccountStatus accountStatus) { this.accountStatus = accountStatus; }

    public OffsetDateTime getApprovedAt() { return approvedAt; }
    public void setApprovedAt(OffsetDateTime approvedAt) { this.approvedAt = approvedAt; }

    public UUID getApprovedByAdminId() { return approvedByAdminId; }
    public void setApprovedByAdminId(UUID approvedByAdminId) { this.approvedByAdminId = approvedByAdminId; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
}
