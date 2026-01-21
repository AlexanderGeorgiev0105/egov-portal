package com.example.demo.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

import com.example.demo.domain.HealthRequestKind;
import com.example.demo.domain.HealthRequestStatus;
import com.fasterxml.jackson.databind.JsonNode;

public class HealthRequestResponse {
    public UUID id;
    public UUID userId;

    public HealthRequestKind kind;
    public HealthRequestStatus status;

    public JsonNode payload;

    // Admin UI
    public String userEgn;
    public String userFullName;

    public String adminNote;
    public OffsetDateTime decidedAt;
    public UUID decidedByAdminId;

    public OffsetDateTime createdAt;
    public OffsetDateTime updatedAt;
}
