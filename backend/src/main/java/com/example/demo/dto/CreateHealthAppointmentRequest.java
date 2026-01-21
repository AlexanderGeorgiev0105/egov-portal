package com.example.demo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class CreateHealthAppointmentRequest {

    @NotBlank
    @Pattern(regexp = "^[0-9]{10}$", message = "doctorPracticeNumber must be 10 digits")
    public String doctorPracticeNumber;

    @NotBlank public String doctorName;

    // yyyy-mm-dd
    @NotBlank public String date;

    // HH:mm
    @NotBlank public String time;
}
