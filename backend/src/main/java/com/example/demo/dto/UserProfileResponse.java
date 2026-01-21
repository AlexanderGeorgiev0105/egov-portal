package com.example.demo.dto;

import java.time.LocalDate;
import java.util.UUID;

import com.example.demo.domain.AccountStatus;

public class UserProfileResponse {
    public UUID id;
    public String fullName;
    public String egn;
    public String gender;
    public LocalDate dob;
    public String birthPlace;
    public String address;
    public String phone;
    public String email;
    public AccountStatus accountStatus;
}
