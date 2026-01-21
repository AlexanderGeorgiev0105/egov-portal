package com.example.demo.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.domain.PropertyRequest;
import com.example.demo.domain.PropertyRequestKind;
import com.example.demo.domain.PropertyRequestStatus;

public interface PropertyRequestRepository extends JpaRepository<PropertyRequest, UUID> {

    // User side
    List<PropertyRequest> findAllByUserIdOrderByCreatedAtDesc(UUID userId);

    Optional<PropertyRequest> findByIdAndUserId(UUID id, UUID userId);

    // Validation helpers
    boolean existsByUserIdAndKindAndStatus(UUID userId, PropertyRequestKind kind, PropertyRequestStatus status);

    boolean existsByPropertyIdAndKindAndStatus(UUID propertyId, PropertyRequestKind kind, PropertyRequestStatus status);

    // Admin side
    List<PropertyRequest> findAllByStatusNotOrderByCreatedAtDesc(PropertyRequestStatus status);

    // (Optional but useful)
    List<PropertyRequest> findAllByStatusOrderByCreatedAtDesc(PropertyRequestStatus status);
}
