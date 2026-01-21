package com.example.demo.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

public class PropertyDebtResponse {
    public UUID id;
    public UUID propertyId;
    public int year;
    public LocalDate dueDate;

    public BigDecimal yearlyTaxAmount;
    public boolean yearlyTaxIsPaid;
    public OffsetDateTime yearlyTaxPaidAt;

    public BigDecimal trashFeeAmount;
    public boolean trashFeeIsPaid;
    public OffsetDateTime trashFeePaidAt;

    public OffsetDateTime createdAt;
    public OffsetDateTime updatedAt;
}
