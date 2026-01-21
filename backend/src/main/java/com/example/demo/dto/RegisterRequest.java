package com.example.demo.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class RegisterRequest {

    @NotBlank
    public String fullName;

    @NotBlank
    @Pattern(regexp = "^[0-9]{10}$", message = "EGN must be exactly 10 digits")
    public String egn;

    @NotBlank
    public String gender;

    @NotBlank
    // expect ISO date "YYYY-MM-DD" from frontend
    public String dob;

    @NotBlank
    @Pattern(regexp = "^[0-9]{9}$", message = "Document number must be exactly 9 digits")
    public String docNumber;

    @NotBlank
    public String docValidUntil;

    @NotBlank
    public String issuedAt;

    @NotBlank
    public String birthPlace;

    @NotBlank
    public String address;

    @NotBlank
    @Pattern(regexp = "^[0-9]{1,10}$", message = "Phone must be digits up to 10 chars")
    public String phone;

    @NotBlank
    @Email
    public String email;

    @NotBlank
    @Size(min = 8, message = "Password too short")
    public String password;
}
