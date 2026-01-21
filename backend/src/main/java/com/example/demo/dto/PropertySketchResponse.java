package com.example.demo.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

import com.example.demo.domain.PropertySketchDocType;

public class PropertySketchResponse {
    public UUID id;
    public UUID propertyId;
    public UUID requestId;

    public PropertySketchDocType docType;
    public int termDays;

    public OffsetDateTime approvedAt;
    public UUID approvedByAdminId;
    public OffsetDateTime createdAt;
}
