package com.example.demo.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public class HealthAppointmentResponse {
    public UUID id;

    public String doctorPracticeNumber;
    public String doctorName;

    public String date; // yyyy-mm-dd
    public String time; // HH:mm

    public OffsetDateTime createdAt;
    public OffsetDateTime updatedAt;
}
