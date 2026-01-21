package com.example.demo.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.domain.HealthReferral;

public interface HealthReferralRepository extends JpaRepository<HealthReferral, UUID> {
    List<HealthReferral> findAllByUserIdOrderByCreatedAtDesc(UUID userId);
    Optional<HealthReferral> findByIdAndUserId(UUID id, UUID userId);
}
