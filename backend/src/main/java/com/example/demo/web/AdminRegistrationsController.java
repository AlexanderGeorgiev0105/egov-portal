package com.example.demo.web;

import java.util.List;
import java.util.UUID;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.domain.AccountStatus;
import com.example.demo.dto.AdminUserSummaryResponse;
import com.example.demo.security.AdminPrincipal;
import com.example.demo.service.AdminRegistrationService;

@RestController
@RequestMapping("/api/admin/registrations")
public class AdminRegistrationsController {

    private final AdminRegistrationService adminRegistrationService;

    public AdminRegistrationsController(AdminRegistrationService adminRegistrationService) {
        this.adminRegistrationService = adminRegistrationService;
    }

    @GetMapping
    public List<AdminUserSummaryResponse> list(@RequestParam(defaultValue = "PENDING") AccountStatus status) {
        return adminRegistrationService.list(status);
    }

    @PatchMapping("/{id}/approve")
    public void approve(@PathVariable("id") UUID userId, @AuthenticationPrincipal AdminPrincipal admin) {
        adminRegistrationService.approve(userId, admin.getAdminId());
    }

    @DeleteMapping("/{id}")
    public void reject(@PathVariable("id") UUID userId) {
        adminRegistrationService.rejectAndDelete(userId);
    }
}
