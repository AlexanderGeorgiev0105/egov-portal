package com.example.demo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class CreateProblemReportRequestData {
    @NotBlank public String category;

    @NotBlank
    @Size(min = 10, message = "DESCRIPTION_MIN_10")
    public String description;
}
