package com.example.demo.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

import com.example.demo.domain.TransportVignetteType;

public class TransportVignetteResponse {
    public UUID id;
    public UUID userId;
    public String ownerEgn;
    public UUID vehicleId;

    public TransportVignetteType type;
    public BigDecimal price;

    public LocalDate validFrom;
    public LocalDate validUntil;

    public OffsetDateTime paidAt;
    public OffsetDateTime createdAt;
}
