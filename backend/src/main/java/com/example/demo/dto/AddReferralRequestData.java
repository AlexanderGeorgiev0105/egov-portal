package com.example.demo.dto;

import jakarta.validation.constraints.NotBlank;

public class AddReferralRequestData {
    @NotBlank public String title;
}
