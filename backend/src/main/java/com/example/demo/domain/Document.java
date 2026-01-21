package com.example.demo.domain;

import java.time.LocalDate;
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
@Table(name = "documents")
public class Document {

    @Id
    @Column(name = "id", nullable = false)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "type", nullable = false, columnDefinition = "document_type")
    private DocumentType type;

    @Column(name = "first_name", nullable = false, columnDefinition = "text")
    private String firstName;

    @Column(name = "middle_name", nullable = false, columnDefinition = "text")
    private String middleName;

    @Column(name = "last_name", nullable = false, columnDefinition = "text")
    private String lastName;

    @Column(name = "egn", nullable = false, length = 10)
    private String egn;

    @Column(name = "gender", nullable = false, length = 20)
    private String gender; // male/female/other

    @Column(name = "dob", nullable = false)
    private LocalDate dob;

    @Column(name = "doc_number", nullable = false, length = 9)
    private String docNumber;

    @Column(name = "valid_until", nullable = false)
    private LocalDate validUntil;

    @Column(name = "issued_at", nullable = false, columnDefinition = "text")
    private String issuedAt;

    @Column(name = "birth_place", nullable = false, columnDefinition = "text")
    private String birthPlace;

    @Column(name = "address", nullable = false, columnDefinition = "text")
    private String address;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "categories", nullable = false, columnDefinition = "jsonb")
    private JsonNode categories; // JSON array (only for DRIVER_LICENSE)

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public DocumentType getType() { return type; }
    public void setType(DocumentType type) { this.type = type; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getMiddleName() { return middleName; }
    public void setMiddleName(String middleName) { this.middleName = middleName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public String getEgn() { return egn; }
    public void setEgn(String egn) { this.egn = egn; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }

    public LocalDate getDob() { return dob; }
    public void setDob(LocalDate dob) { this.dob = dob; }

    public String getDocNumber() { return docNumber; }
    public void setDocNumber(String docNumber) { this.docNumber = docNumber; }

    public LocalDate getValidUntil() { return validUntil; }
    public void setValidUntil(LocalDate validUntil) { this.validUntil = validUntil; }

    public String getIssuedAt() { return issuedAt; }
    public void setIssuedAt(String issuedAt) { this.issuedAt = issuedAt; }

    public String getBirthPlace() { return birthPlace; }
    public void setBirthPlace(String birthPlace) { this.birthPlace = birthPlace; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public JsonNode getCategories() { return categories; }
    public void setCategories(JsonNode categories) { this.categories = categories; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
}
