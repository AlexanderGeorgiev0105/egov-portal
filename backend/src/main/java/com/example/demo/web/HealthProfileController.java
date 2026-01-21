package com.example.demo.web;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.domain.HealthUserProfile;
import com.example.demo.dto.HealthProfileResponse;
import com.example.demo.security.UserPrincipal;
import com.example.demo.service.HealthProfileService;

@RestController
@RequestMapping("/api/health-profile")
public class HealthProfileController {

    private final HealthProfileService profileService;

    public HealthProfileController(HealthProfileService profileService) {
        this.profileService = profileService;
    }

    @GetMapping
    public HealthProfileResponse my(@AuthenticationPrincipal UserPrincipal principal) {
        HealthUserProfile p = profileService.getOrNull(principal.getUserId());

        HealthProfileResponse dto = new HealthProfileResponse();
        if (p != null) {
            dto.personalDoctorPracticeNumber = p.getPersonalDoctorPracticeNumber();
            dto.personalDoctorSnapshot = p.getPersonalDoctorSnapshot();
        }
        return dto;
    }
}
