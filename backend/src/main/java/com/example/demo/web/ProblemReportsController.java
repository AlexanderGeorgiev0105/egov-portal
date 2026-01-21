package com.example.demo.web;

import java.util.List;
import java.util.UUID;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.domain.ProblemReport;
import com.example.demo.dto.CreateProblemReportRequestData;
import com.example.demo.dto.ProblemReportResponse;
import com.example.demo.security.UserPrincipal;
import com.example.demo.service.ProblemReportService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/problem-reports")
public class ProblemReportsController {

    private final ProblemReportService reportService;

    public ProblemReportsController(ProblemReportService reportService) {
        this.reportService = reportService;
    }

    // GET /api/problem-reports => my list
    @GetMapping
    public List<ProblemReportResponse> my(@AuthenticationPrincipal UserPrincipal principal) {
        UUID userId = principal.getUserId();
        return reportService.listMy(userId).stream().map(ProblemReportsController::toDto).toList();
    }

    // GET /api/problem-reports/{id} => my report details (optional but useful)
    @GetMapping("/{id}")
    public ProblemReportResponse getMine(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        return toDto(reportService.getMine(principal.getUserId(), id));
    }

    // POST /api/problem-reports
    @PostMapping
    public ProblemReportResponse create(@AuthenticationPrincipal UserPrincipal principal,
                                       @Valid @RequestBody CreateProblemReportRequestData body) {
        ProblemReport r = reportService.create(principal.getUserId(), body);
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
