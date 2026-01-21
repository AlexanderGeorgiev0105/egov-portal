package com.example.demo.dto;

import com.fasterxml.jackson.databind.JsonNode;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class AddPersonalDoctorRequestData {

    @NotBlank
    @Pattern(regexp = "^[0-9]{10}$", message = "practiceNumber must be 10 digits")
    public String practiceNumber;

    // optional snapshot from FE (we also rebuild it from DB doctor if missing)
    public JsonNode doctor;
}
