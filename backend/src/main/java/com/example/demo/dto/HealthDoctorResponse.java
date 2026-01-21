package com.example.demo.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public class HealthDoctorResponse {
    public UUID id;

    public String firstName;
    public String lastName;

    public String practiceNumber;
    public String rzokNo;
    public String healthRegion;

    public Short shift;

    public String mobile;

    public String oblast;
    public String city;
    public String street;

    public OffsetDateTime createdAt;
    public OffsetDateTime updatedAt;
}
