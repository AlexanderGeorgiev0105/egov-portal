package com.example.demo.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.domain.TransportVehicleRequest;
import com.example.demo.domain.TransportVehicleRequestKind;
import com.example.demo.domain.TransportVehicleRequestStatus;

public interface TransportVehicleRequestRepository extends JpaRepository<TransportVehicleRequest, UUID> {

    // User side
    List<TransportVehicleRequest> findAllByUserIdOrderByCreatedAtDesc(UUID userId);
    Optional<TransportVehicleRequest> findByIdAndUserId(UUID id, UUID userId);

    // Validation helpers (using denormalized columns)
    boolean existsByKindAndStatusAndRegNumberIgnoreCase(TransportVehicleRequestKind kind,
                                                        TransportVehicleRequestStatus status,
                                                        String regNumber);

    boolean existsByKindAndStatusAndVehicleId(TransportVehicleRequestKind kind,
                                              TransportVehicleRequestStatus status,
                                              UUID vehicleId);

    // Admin side
    List<TransportVehicleRequest> findAllByStatusNotOrderByCreatedAtDesc(TransportVehicleRequestStatus status);
    List<TransportVehicleRequest> findAllByStatusOrderByCreatedAtDesc(TransportVehicleRequestStatus status);
}
