package com.example.demo.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

import com.example.demo.domain.ProblemReportStatus;

public class ProblemReportResponse {

    public UUID id;

    public UUID userId;
    public String userEgn;

    // Frontend uses userName; keep it for parity.
    public String userName;

    // Also provide userFullName (optional, helpful in other admin UIs)
    public String userFullName;

    public String category;
    public String description;

    public ProblemReportStatus status;

    public String adminNote;

    public OffsetDateTime decidedAt;
    public UUID decidedByAdminId;

    public OffsetDateTime createdAt;
    public OffsetDateTime updatedAt;
}
