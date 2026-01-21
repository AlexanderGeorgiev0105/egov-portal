package com.example.demo.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

import com.example.demo.domain.TransportFineType;

public class TransportFineResponse {
    public UUID id;
    public UUID userId;
    public String egn;

    public TransportFineType type;
    public BigDecimal amount;

    public OffsetDateTime issuedAt;

    public boolean paid;
    public OffsetDateTime paidAt;

    public OffsetDateTime createdAt;
    public OffsetDateTime updatedAt;
}
