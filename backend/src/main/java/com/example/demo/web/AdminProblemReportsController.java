package com.example.demo.web;

import java.util.List;
import java.util.UUID;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.domain.ProblemReport;
import com.example.demo.domain.ProblemReportStatus;
import com.example.demo.dto.ProblemReportResponse;
import com.example.demo.security.AdminPrincipal;
import com.example.demo.service.AdminProblemReportService;

@RestController
@RequestMapping("/api/admin/problem-reports")
public class AdminProblemReportsController {

    private final AdminProblemReportService adminService;

    public AdminProblemReportsController(AdminProblemReportService adminService) {
        this.adminService = adminService;
    }

    @GetMapping
    public List<ProblemReportResponse> list(@RequestParam(required = false) ProblemReportStatus status) {
        return adminService.listAll(status).stream().map(AdminProblemReportsController::toDto).toList();
    }

    @GetMapping("/{id}")
    public ProblemReportResponse get(@PathVariable UUID id) {
        return toDto(adminService.get(id));
    }

    public static class NoteBody { public String note; }

    @PatchMapping("/{id}/resolve")
    public ProblemReportResponse resolve(@PathVariable UUID id,
                                        @AuthenticationPrincipal AdminPrincipal admin,
                                        @RequestParam(defaultValue = "") String note,
                                        @RequestBody(required = false) NoteBody body) {
        String finalNote = (body != null && body.note != null) ? body.note : note;
        ProblemReport r = adminService.resolve(id, admin.getAdminId(), finalNote == null ? "" : finalNote);
        return toDto(r);
    }

    @PatchMapping("/{id}/reject")
    public ProblemReportResponse reject(@PathVariable UUID id,
                                       @AuthenticationPrincipal AdminPrincipal admin,
                                       @RequestParam(defaultValue = "") String note,
                                       @RequestBody(required = false) NoteBody body) {
        String finalNote = (body != null && body.note != null) ? body.note : note;
        ProblemReport r = adminService.reject(id, admin.getAdminId(), finalNote == null ? "" : finalNote);
        return toDto(r);
    }

    public static ProblemReportResponse toDto(ProblemReport r) {
        ProblemReportResponse dto = new ProblemReportResponse();
        dto.id = r.getId();

        dto.userId = r.getUserId();
        dto.userEgn = r.getUserEgn();

        dto.userFullName = r.getUserFullName();
        dto.userName = r.getUserFullName(); // FE expects userName

        dto.category = r.getCategory();
        dto.description = r.getDescription();

        dto.status = r.getStatus();
        dto.adminNote = r.getAdminNote();

        dto.decidedAt = r.getDecidedAt();
        dto.decidedByAdminId = r.getDecidedByAdminId();

        dto.createdAt = r.getCreatedAt();
        dto.updatedAt = r.getUpdatedAt();
        return dto;
    }
}
