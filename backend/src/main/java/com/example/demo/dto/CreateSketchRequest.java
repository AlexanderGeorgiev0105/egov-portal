package com.example.demo.dto;

import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class CreateSketchRequest {
    @NotNull
    public UUID propertyId;

    @NotBlank
    public String docType; // "SKICA" или "SCHEMA"

    // FE подава termDays (3/7)
    @NotNull
    public Integer termDays;
}
