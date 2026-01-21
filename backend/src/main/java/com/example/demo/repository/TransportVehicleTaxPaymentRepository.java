package com.example.demo.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.domain.TransportVehicleTaxPayment;

public interface TransportVehicleTaxPaymentRepository extends JpaRepository<TransportVehicleTaxPayment, UUID> {
    List<TransportVehicleTaxPayment> findAllByVehicleIdOrderByTaxYearDesc(UUID vehicleId);
    Optional<TransportVehicleTaxPayment> findByVehicleIdAndTaxYear(UUID vehicleId, Integer taxYear);
}
