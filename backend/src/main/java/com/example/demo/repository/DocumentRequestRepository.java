package com.example.demo.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.domain.DocumentRequest;
import com.example.demo.domain.DocumentRequestKind;
import com.example.demo.domain.DocumentRequestStatus;
import com.example.demo.domain.DocumentType;

public interface DocumentRequestRepository extends JpaRepository<DocumentRequest, UUID> {

    // User side
    List<DocumentRequest> findAllByUserIdOrderByCreatedAtDesc(UUID userId);
    Optional<DocumentRequest> findByIdAndUserId(UUID id, UUID userId);

    boolean existsByUserIdAndKindAndStatusAndDocumentType(UUID userId,
                                                          DocumentRequestKind kind,
                                                          DocumentRequestStatus status,
                                                          DocumentType documentType);

    boolean existsByUserIdAndKindAndStatusAndDocumentId(UUID userId,
                                                        DocumentRequestKind kind,
                                                        DocumentRequestStatus status,
                                                        UUID documentId);

    // Admin side
    List<DocumentRequest> findAllByStatusNotOrderByCreatedAtDesc(DocumentRequestStatus status);
    List<DocumentRequest> findAllByStatusOrderByCreatedAtDesc(DocumentRequestStatus status);
}
