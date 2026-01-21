package com.example.demo.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public class PropertyTaxAssessmentResponse {
    public UUID id;
    public UUID propertyId;
    public UUID requestId;

    public String neighborhood;
    public String purpose;
    public String purposeOther;
    public boolean hasAdjoiningParts;

    public BigDecimal price;
    public BigDecimal yearlyTax;
    public BigDecimal trashFee;

    public OffsetDateTime approvedAt;
    public UUID approvedByAdminId;
    public OffsetDateTime createdAt;
}
