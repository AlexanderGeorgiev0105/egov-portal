package com.example.demo.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.example.demo.domain.TransportVignette;

public interface TransportVignetteRepository extends JpaRepository<TransportVignette, UUID> {

    List<TransportVignette> findAllByUserIdOrderByCreatedAtDesc(UUID userId);

    List<TransportVignette> findAllByVehicleIdOrderByCreatedAtDesc(UUID vehicleId);

    @Query(value = """
        select * from transport_vignettes
        where vehicle_id = :vehicleId
          and :d between valid_from and valid_until
        order by valid_until desc
        limit 1
        """, nativeQuery = true)
    Optional<TransportVignette> findActiveForVehicle(UUID vehicleId, LocalDate d);
}
