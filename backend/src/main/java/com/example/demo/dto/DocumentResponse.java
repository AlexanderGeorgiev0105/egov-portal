package com.example.demo.dto;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

import com.example.demo.domain.DocumentType;
import com.fasterxml.jackson.databind.JsonNode;

public class DocumentResponse {
    public UUID id;
    public UUID userId;

    public DocumentType type;

    public String firstName;
    public String middleName;
    public String lastName;

    public String egn;
    public String gender;
    public LocalDate dob;

    public String docNumber;
    public LocalDate validUntil;

    public String issuedAt;
    public String birthPlace;
    public String address;

    public JsonNode categories;

    public OffsetDateTime createdAt;
    public OffsetDateTime updatedAt;
}
