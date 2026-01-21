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

import com.example.demo.domain.DocumentRequest;
import com.example.demo.domain.DocumentRequestStatus;
import com.example.demo.domain.User;
import com.example.demo.dto.DocumentRequestResponse;
import com.example.demo.repository.UserRepository;
import com.example.demo.security.AdminPrincipal;
import com.example.demo.service.AdminDocumentRequestService;

@RestController
@RequestMapping("/api/admin/document-requests")
public class AdminDocumentRequestsController {

    private final AdminDocumentRequestService adminService;
    private final UserRepository userRepo;

    public AdminDocumentRequestsController(AdminDocumentRequestService adminService, UserRepository userRepo) {
        this.adminService = adminService;
        this.userRepo = userRepo;
    }

    @GetMapping
    public List<DocumentRequestResponse> list(@RequestParam(required = false) DocumentRequestStatus status) {
        List<DocumentRequest> list = adminService.listAllNonRejected();
        if (status != null) {
            list = list.stream().filter(r -> r.getStatus() == status).toList();
        }
        return list.stream().map(this::toDto).toList();
    }

    @GetMapping("/{id}")
    public DocumentRequestResponse get(@PathVariable UUID id) {
        return toDto(adminService.get(id));
    }

    @PatchMapping("/{id}/approve")
    public DocumentRequestResponse approve(@PathVariable UUID id,
                                           @AuthenticationPrincipal AdminPrincipal admin,
                                           @RequestParam(defaultValue = "") String note) {
        DocumentRequest r = adminService.approve(id, admin.getAdminId(), note);
        return toDto(r);
    }

    public static class NoteBody { public String note; }

    @PatchMapping("/{id}/reject")
    public DocumentRequestResponse reject(@PathVariable UUID id,
                                          @AuthenticationPrincipal AdminPrincipal admin,
                                          @RequestParam(defaultValue = "") String note,
                                          @RequestBody(required = false) NoteBody body) {
        String finalNote = (body != null && body.note != null) ? body.note : note;
        DocumentRequest r = adminService.reject(id, admin.getAdminId(), finalNote == null ? "" : finalNote);
        return toDto(r);
    }

    private DocumentRequestResponse toDto(DocumentRequest r) {
        DocumentRequestResponse dto = new DocumentRequestResponse();
        dto.id = r.getId();
        dto.userId = r.getUserId();
        dto.kind = r.getKind();
        dto.status = r.getStatus();
        dto.documentType = r.getDocumentType();
        dto.documentId = r.getDocumentId();
        dto.payload = r.getPayload();
        dto.adminNote = r.getAdminNote();
        dto.decidedAt = r.getDecidedAt();
        dto.decidedByAdminId = r.getDecidedByAdminId();
        dto.createdAt = r.getCreatedAt();
        dto.updatedAt = r.getUpdatedAt();

        User u = userRepo.findById(r.getUserId()).orElse(null);
        if (u != null) {
            dto.userEgn = u.getEgn();
            dto.userFullName = u.getFullName();
        }

        return dto;
    }
}
