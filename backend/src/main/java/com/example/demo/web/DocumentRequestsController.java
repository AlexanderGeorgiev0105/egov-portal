package com.example.demo.web;

import java.util.List;
import java.util.UUID;

import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.example.demo.domain.DocumentRequest;
import com.example.demo.dto.CreateDocumentAddRequestData;
import com.example.demo.dto.CreateDocumentRemoveRequest;
import com.example.demo.dto.DocumentRequestResponse;
import com.example.demo.security.UserPrincipal;
import com.example.demo.service.DocumentRequestService;

@RestController
@RequestMapping("/api/document-requests")
public class DocumentRequestsController {

    private final DocumentRequestService requestService;

    public DocumentRequestsController(DocumentRequestService requestService) {
        this.requestService = requestService;
    }

    @GetMapping
    public List<DocumentRequestResponse> my(@AuthenticationPrincipal UserPrincipal principal) {
        UUID userId = principal.getUserId();
        return requestService.listMy(userId).stream().map(DocumentRequestsController::toDto).toList();
    }

    @GetMapping("/{id}")
    public DocumentRequestResponse get(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        DocumentRequest r = requestService.getMine(principal.getUserId(), id);
        return toDto(r);
    }

    @PostMapping(value = "/add", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public DocumentRequestResponse add(@AuthenticationPrincipal UserPrincipal principal,
                                       @RequestPart("data") CreateDocumentAddRequestData data,
                                       @RequestPart("photo1") MultipartFile photo1,
                                       @RequestPart("photo2") MultipartFile photo2) {

        DocumentRequest r = requestService.createAdd(principal.getUserId(), principal.getUsername(), data, photo1, photo2);
        return toDto(r);
    }

    @PostMapping("/remove")
    public DocumentRequestResponse remove(@AuthenticationPrincipal UserPrincipal principal,
                                          @RequestBody CreateDocumentRemoveRequest body) {
        DocumentRequest r = requestService.createRemove(principal.getUserId(), body);
        return toDto(r);
    }

    private static DocumentRequestResponse toDto(DocumentRequest r) {
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
        return dto;
    }
}
