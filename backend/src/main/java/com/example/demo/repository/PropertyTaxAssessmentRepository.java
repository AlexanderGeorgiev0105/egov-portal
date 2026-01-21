package com.example.demo.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.domain.PropertyTaxAssessment;

public interface PropertyTaxAssessmentRepository extends JpaRepository<PropertyTaxAssessment, UUID> {
    Optional<PropertyTaxAssessment> findByPropertyId(UUID propertyId);
}
