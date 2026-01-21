package com.example.demo.service;

import static org.springframework.http.HttpStatus.UNAUTHORIZED;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.example.demo.dto.AuthResponse;
import com.example.demo.dto.LoginRequest;
import com.example.demo.repository.AdminRepository;

@Service
public class AdminAuthService {

    private final AdminRepository adminRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminAuthService(AdminRepository adminRepository, PasswordEncoder passwordEncoder) {
        this.adminRepository = adminRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public AuthResponse login(LoginRequest req) {
        var admin = adminRepository.findByUsername(req.identifier.trim())
                .orElseThrow(() -> new ResponseStatusException(UNAUTHORIZED, "Invalid credentials"));

        if (!admin.isActive()) {
            throw new ResponseStatusException(UNAUTHORIZED, "Invalid credentials");
        }

        if (!passwordEncoder.matches(req.password, admin.getPasswordHash())) {
            throw new ResponseStatusException(UNAUTHORIZED, "Invalid credentials");
        }

        return AuthResponse.admin();
    }
}
