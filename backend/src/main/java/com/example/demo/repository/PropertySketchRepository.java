package com.example.demo.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.domain.PropertySketch;

public interface PropertySketchRepository extends JpaRepository<PropertySketch, UUID> {
    Optional<PropertySketch> findByPropertyId(UUID propertyId);
}
