package com.example.demo.dto;

import java.util.UUID;

public class CreateRemovePropertyRequest {
    public UUID propertyId;

    // ✅ добавено за да работи remove request payload-а и admin details
    public String reason;
}
