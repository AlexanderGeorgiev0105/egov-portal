package com.example.demo.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public class PropertyResponse {
    public UUID id;
    public String type;
    public String oblast;
    public String place;
    public String address;
    public int areaSqm;
    public int purchaseYear;
    public boolean isActive;
    public OffsetDateTime deactivatedAt;
    public OffsetDateTime createdAt;
    public OffsetDateTime updatedAt;
}
