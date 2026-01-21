package com.example.demo.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.domain.HealthRequest;
import com.example.demo.domain.HealthRequestKind;
import com.example.demo.domain.HealthRequestStatus;

public interface HealthRequestRepository extends JpaRepository<HealthRequest, UUID> {

    // User side
    List<HealthRequest> findAllByUserIdOrderByCreatedAtDesc(UUID userId);
    Optional<HealthRequest> findByIdAndUserId(UUID id, UUID userId);

    // Validation helper
    boolean existsByUserIdAndKindAndStatus(UUID userId, HealthRequestKind kind, HealthRequestStatus status);

    // Admin side
    List<HealthRequest> findAllByStatusOrderByCreatedAtDesc(HealthRequestStatus status);
    List<HealthRequest> findAllByOrderByCreatedAtDesc();
}
