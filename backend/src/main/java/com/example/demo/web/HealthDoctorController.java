package com.example.demo.web;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.domain.HealthDoctor;
import com.example.demo.dto.HealthDoctorResponse;
import com.example.demo.security.UserPrincipal;
import com.example.demo.service.HealthDoctorService;

@RestController
@RequestMapping("/api/health-doctors")
public class HealthDoctorController {

    private final HealthDoctorService doctorService;

    public HealthDoctorController(HealthDoctorService doctorService) {
        this.doctorService = doctorService;
    }

    @GetMapping("/{practiceNumber}")
    public HealthDoctorResponse byPracticeNumber(@PathVariable String practiceNumber,
                                                 @AuthenticationPrincipal UserPrincipal principal) {
        // principal is required by security (authenticated), but we don't need it directly
        HealthDoctor d = doctorService.getByPracticeNumber(practiceNumber);
        return toDto(d);
    }

    public static HealthDoctorResponse toDto(HealthDoctor d) {
        HealthDoctorResponse dto = new HealthDoctorResponse();
        dto.id = d.getId();
        dto.firstName = d.getFirstName();
        dto.lastName = d.getLastName();
        dto.practiceNumber = d.getPracticeNumber();
        dto.rzokNo = d.getRzokNo();
        dto.healthRegion = d.getHealthRegion();
        dto.shift = d.getShift();
        dto.mobile = d.getMobile();
        dto.oblast = d.getOblast();
        dto.city = d.getCity();
        dto.street = d.getStreet();
        dto.createdAt = d.getCreatedAt();
        dto.updatedAt = d.getUpdatedAt();
        return dto;
    }
}
