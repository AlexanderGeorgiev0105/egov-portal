package com.example.demo.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.domain.ProblemReport;
import com.example.demo.domain.ProblemReportStatus;

public interface ProblemReportRepository extends JpaRepository<ProblemReport, UUID> {

    // User side
    List<ProblemReport> findAllByUserIdOrderByCreatedAtDesc(UUID userId);

    Optional<ProblemReport> findByIdAndUserId(UUID id, UUID userId);

    // Admin side
    List<ProblemReport> findAllByStatusOrderByCreatedAtDesc(ProblemReportStatus status);

    List<ProblemReport> findAllByOrderByCreatedAtDesc();
}
