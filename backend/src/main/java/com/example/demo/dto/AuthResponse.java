package com.example.demo.dto;

import java.util.UUID;

import com.example.demo.domain.AccountStatus;

public class AuthResponse {
    public String role; // "USER" or "ADMIN"
    public UUID userId; // for USER
    public AccountStatus accountStatus; // for USER
    public String fullName; // for USER

    public static AuthResponse user(UUID id, AccountStatus status, String fullName) {
        AuthResponse r = new AuthResponse();
        r.role = "USER";
        r.userId = id;
        r.accountStatus = status;
        r.fullName = fullName;
        return r;
    }

    public static AuthResponse admin() {
        AuthResponse r = new AuthResponse();
        r.role = "ADMIN";
        return r;
    }
}
