package com.example.demo.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.domain.Document;
import com.example.demo.domain.DocumentType;

public interface DocumentRepository extends JpaRepository<Document, UUID> {
    List<Document> findAllByUserIdOrderByCreatedAtDesc(UUID userId);
    Optional<Document> findByIdAndUserId(UUID id, UUID userId);

    boolean existsByUserIdAndType(UUID userId, DocumentType type);
    Optional<Document> findByUserIdAndType(UUID userId, DocumentType type);
}
