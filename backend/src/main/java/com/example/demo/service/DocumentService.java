package com.example.demo.service;

import java.util.List;
import java.util.UUID;

import static org.springframework.http.HttpStatus.NOT_FOUND;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.example.demo.domain.Document;
import com.example.demo.repository.DocumentRepository;

@Service
public class DocumentService {

    private final DocumentRepository documentRepository;

    public DocumentService(DocumentRepository documentRepository) {
        this.documentRepository = documentRepository;
    }

    public List<Document> listMy(UUID userId) {
        return documentRepository.findAllByUserIdOrderByCreatedAtDesc(userId);
    }

    public Document getMine(UUID userId, UUID documentId) {
        return documentRepository.findByIdAndUserId(documentId, userId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "DOCUMENT_NOT_FOUND"));
    }
}
