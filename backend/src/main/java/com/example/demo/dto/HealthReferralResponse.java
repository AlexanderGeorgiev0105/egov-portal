package com.example.demo.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public class HealthReferralResponse {
    public UUID id;
    public String title;
    public UUID sourceRequestId;

    public OffsetDateTime createdAt;
    public OffsetDateTime updatedAt;
}
