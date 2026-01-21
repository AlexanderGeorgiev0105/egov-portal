package com.example.demo.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class AddPropertyRequestData {

    @NotBlank public String type;
    @NotBlank public String oblast;
    @NotBlank public String place;
    @NotBlank public String address;

    @NotNull @Min(1) public Integer areaSqm;

    @NotNull @Min(1900) @Max(3000) public Integer purchaseYear;
}
