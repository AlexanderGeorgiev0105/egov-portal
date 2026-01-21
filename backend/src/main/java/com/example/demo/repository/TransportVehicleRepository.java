package com.example.demo.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.domain.TransportVehicle;

public interface TransportVehicleRepository extends JpaRepository<TransportVehicle, UUID> {
    List<TransportVehicle> findAllByUserIdOrderByCreatedAtDesc(UUID userId);
    Optional<TransportVehicle> findByIdAndUserId(UUID id, UUID userId);

    boolean existsByRegNumberIgnoreCase(String regNumber);
}
