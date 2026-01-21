package com.example.demo.web;

import java.util.List;
import java.util.UUID;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.domain.HealthDoctor;
import com.example.demo.dto.CreateHealthDoctorRequest;
import com.example.demo.dto.HealthDoctorResponse;
import com.example.demo.security.AdminPrincipal;
import com.example.demo.service.HealthDoctorService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/admin/health-doctors")
public class AdminHealthDoctorsController {

    private final HealthDoctorService doctorService;

    public AdminHealthDoctorsController(HealthDoctorService doctorService) {
        this.doctorService = doctorService;
    }

    @GetMapping
    public List<HealthDoctorResponse> list(@AuthenticationPrincipal AdminPrincipal admin) {
        return doctorService.listAll().stream().map(HealthDoctorController::toDto).toList();
    }

    @PostMapping
    public HealthDoctorResponse create(@AuthenticationPrincipal AdminPrincipal admin,
                                       @Valid @RequestBody CreateHealthDoctorRequest body) {
        HealthDoctor d = doctorService.create(body);
        return HealthDoctorController.toDto(d);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable UUID id, @AuthenticationPrincipal AdminPrincipal admin) {
        doctorService.delete(id);
    }
}
