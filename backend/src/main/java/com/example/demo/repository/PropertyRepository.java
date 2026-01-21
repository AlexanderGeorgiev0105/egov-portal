package com.example.demo.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.domain.Property;

public interface PropertyRepository extends JpaRepository<Property, UUID> {
    List<Property> findAllByOwnerUserIdAndActiveOrderByCreatedAtDesc(UUID ownerUserId, boolean active);
    Optional<Property> findByIdAndOwnerUserId(UUID id, UUID ownerUserId);
}
