package com.example.demo.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

import com.example.demo.domain.PropertyRequestKind;
import com.example.demo.domain.PropertyRequestStatus;
import com.fasterxml.jackson.databind.JsonNode;

public class PropertyRequestResponse {
    public UUID id;
    public UUID userId;
    public UUID propertyId;
    public PropertyRequestKind kind;
    public PropertyRequestStatus status;
    public JsonNode payload;

    // Added for Admin UI
    public String userEgn;
    public String userFullName;

    public String adminNote;
    public OffsetDateTime decidedAt;
    public UUID decidedByAdminId;

    public OffsetDateTime createdAt;
    public OffsetDateTime updatedAt;
}
