package com.example.demo.dto;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

import com.example.demo.domain.AccountStatus;

public class AdminUserSummaryResponse {
    public UUID id;
    public String fullName;
    public String egn;
    public String email;

    public String gender;
    public LocalDate dob;

    public String docNumber;
    public LocalDate docValidUntil;
    public String issuedAt;

    public String birthPlace;
    public String address;
    public String phone;

    // NEW: ID card image file IDs (optional but useful for admin UI)
    public UUID idCardFrontFileId;
    public UUID idCardBackFileId;

    public AccountStatus accountStatus;
    public OffsetDateTime createdAt;
}
