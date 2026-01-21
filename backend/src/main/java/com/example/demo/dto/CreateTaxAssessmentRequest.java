package com.example.demo.dto;

import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class CreateTaxAssessmentRequest {
    @NotNull
    public UUID propertyId;

    // във FE полето е neighborhood, но admin използва district -> ние приемаме neighborhood
    @NotBlank
    public String neighborhood;

    @NotBlank
    public String purpose;

    public String purposeOther;

    // FE подава "Да"/"Не"
    @NotBlank
    public String hasAdjParts;
}
