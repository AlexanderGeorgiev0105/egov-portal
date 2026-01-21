package com.example.demo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class CreateHealthDoctorRequest {

    @NotBlank public String firstName;
    @NotBlank public String lastName;

    @NotBlank
    @Pattern(regexp = "^[0-9]{10}$", message = "practiceNumber must be 10 digits")
    public String practiceNumber;

    @NotBlank @Size(max = 30) public String rzokNo;
    @NotBlank @Size(max = 30) public String healthRegion;

    // "1" or "2" in FE -> backend uses short 1/2
    public Short shift;

    @NotBlank @Size(max = 30) public String mobile;

    @NotBlank public String oblast;
    @NotBlank public String city;
    @NotBlank public String street;
}
