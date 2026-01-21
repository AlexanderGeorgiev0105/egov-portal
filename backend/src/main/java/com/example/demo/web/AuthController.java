package com.example.demo.web;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.example.demo.dto.AuthResponse;
import com.example.demo.dto.LoginRequest;
import com.example.demo.dto.RegisterRequest;
import com.example.demo.service.AuthService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /**
     * Registration requires TWO images for ID card (front + back).
     * multipart/form-data:
     *  - "data" (application/json) -> RegisterRequest
     *  - "idFront" (image/*)
     *  - "idBack"  (image/*)
     */
    @PostMapping(value = "/register", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public AuthResponse register(@Valid @RequestPart("data") RegisterRequest req,
                                 @RequestPart("idFront") MultipartFile idFront,
                                 @RequestPart("idBack") MultipartFile idBack) {
        return authService.register(req, idFront, idBack);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest req) {
        return authService.loginUser(req);
    }
}
