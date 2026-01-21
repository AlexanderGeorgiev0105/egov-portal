package com.example.demo.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

import com.example.demo.domain.TransportVehicleRequestKind;
import com.example.demo.domain.TransportVehicleRequestStatus;
import com.fasterxml.jackson.databind.JsonNode;

public class TransportVehicleRequestResponse {
    public UUID id;
    public UUID userId;
    public String ownerEgn;

    public TransportVehicleRequestKind kind;
    public TransportVehicleRequestStatus status;

    public String regNumber;
    public UUID vehicleId;

    public JsonNode payload;

    // Admin UI fields
    public String userEgn;
    public String userFullName;

    public String adminNote;
    public OffsetDateTime decidedAt;
    public UUID decidedByAdminId;

    public OffsetDateTime createdAt;
    public OffsetDateTime updatedAt;
}
