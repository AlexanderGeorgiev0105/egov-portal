package com.example.demo.web;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.domain.HealthAppointment;
import com.example.demo.dto.CreateHealthAppointmentRequest;
import com.example.demo.dto.HealthAppointmentResponse;
import com.example.demo.security.UserPrincipal;
import com.example.demo.service.HealthAppointmentService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/health-appointments")
public class HealthAppointmentsController {

    private final HealthAppointmentService apptService;

    public HealthAppointmentsController(HealthAppointmentService apptService) {
        this.apptService = apptService;
    }

    @GetMapping
    public List<HealthAppointmentResponse> my(@AuthenticationPrincipal UserPrincipal principal) {
        return apptService.listMy(principal.getUserId()).stream().map(HealthAppointmentsController::toDto).toList();
    }

    @GetMapping("/busy")
    public List<String> busy(@RequestParam String practiceNumber,
                             @RequestParam String date,
                             @AuthenticationPrincipal UserPrincipal principal) {
        LocalDate d = LocalDate.parse(date);
        return apptService.listBusySlots(practiceNumber, d).stream().map(HealthAppointment::getApptTime).toList();
    }

    @PostMapping
    public HealthAppointmentResponse book(@AuthenticationPrincipal UserPrincipal principal,
                                         @Valid @RequestBody CreateHealthAppointmentRequest body) {
        HealthAppointment a = apptService.book(principal.getUserId(), body);
        return toDto(a);
    }

    @DeleteMapping("/{id}")
    public void cancel(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        apptService.cancel(principal.getUserId(), id);
    }

    private static HealthAppointmentResponse toDto(HealthAppointment a) {
        HealthAppointmentResponse dto = new HealthAppointmentResponse();
        dto.id = a.getId();
        dto.doctorPracticeNumber = a.getDoctorPracticeNumber();
        dto.doctorName = a.getDoctorName();
        dto.date = a.getApptDate().toString();
        dto.time = a.getApptTime();
        dto.createdAt = a.getCreatedAt();
        dto.updatedAt = a.getUpdatedAt();
        return dto;
    }
}
