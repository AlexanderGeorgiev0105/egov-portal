package com.example.demo.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

import com.example.demo.domain.DocumentRequestKind;
import com.example.demo.domain.DocumentRequestStatus;
import com.example.demo.domain.DocumentType;
import com.fasterxml.jackson.databind.JsonNode;

public class DocumentRequestResponse {
    public UUID id;
    public UUID userId;

    public DocumentRequestKind kind;
    public DocumentRequestStatus status;

    public DocumentType documentType; // ADD
    public UUID documentId;          // REMOVE

    public JsonNode payload;

    // Admin UI convenience
    public String userEgn;
    public String userFullName;

    public String adminNote;
    public OffsetDateTime decidedAt;
    public UUID decidedByAdminId;

    public OffsetDateTime createdAt;
    public OffsetDateTime updatedAt;
}
