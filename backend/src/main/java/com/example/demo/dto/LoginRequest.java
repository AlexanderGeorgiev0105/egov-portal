package com.example.demo.dto;

import jakarta.validation.constraints.NotBlank;

public class LoginRequest {
    @NotBlank
    public String identifier; // USER: EGN, ADMIN: username

    @NotBlank
    public String password;
}
