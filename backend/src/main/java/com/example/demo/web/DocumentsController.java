package com.example.demo.web;

import java.util.List;
import java.util.UUID;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.domain.Document;
import com.example.demo.dto.DocumentResponse;
import com.example.demo.security.UserPrincipal;
import com.example.demo.service.DocumentService;

@RestController
@RequestMapping("/api/documents")
public class DocumentsController {

    private final DocumentService documentService;

    public DocumentsController(DocumentService documentService) {
        this.documentService = documentService;
    }

    @GetMapping
    public List<DocumentResponse> my(@AuthenticationPrincipal UserPrincipal principal) {
        return documentService.listMy(principal.getUserId()).stream().map(DocumentsController::toDto).toList();
    }

    @GetMapping("/{id}")
    public DocumentResponse get(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        Document d = documentService.getMine(principal.getUserId(), id);
        return toDto(d);
    }

    private static DocumentResponse toDto(Document d) {
        DocumentResponse dto = new DocumentResponse();
        dto.id = d.getId();
        dto.userId = d.getUserId();
        dto.type = d.getType();

        dto.firstName = d.getFirstName();
        dto.middleName = d.getMiddleName();
        dto.lastName = d.getLastName();

        dto.egn = d.getEgn();
        dto.gender = d.getGender();
        dto.dob = d.getDob();

        dto.docNumber = d.getDocNumber();
        dto.validUntil = d.getValidUntil();

        dto.issuedAt = d.getIssuedAt();
        dto.birthPlace = d.getBirthPlace();
        dto.address = d.getAddress();

        dto.categories = d.getCategories();

        dto.createdAt = d.getCreatedAt();
        dto.updatedAt = d.getUpdatedAt();
        return dto;
    }
}
