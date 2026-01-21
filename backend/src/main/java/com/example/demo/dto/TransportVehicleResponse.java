package com.example.demo.dto;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;

public class TransportVehicleResponse {
    public UUID id;
    public UUID userId;
    public String ownerEgn;

    public String regNumber;
    public String brand;
    public String model;

    public Integer manufactureYear;
    public Integer powerKw;
    public String euroCategory;

    public TechInspection techInspection;
    public Map<String, VehicleTaxPayment> taxPayments;

    public OffsetDateTime createdAt;
    public OffsetDateTime updatedAt;

    public static class TechInspection {
        public LocalDate inspectionDate;
        public LocalDate validUntil;
        public OffsetDateTime approvedAt;
    }

    public static class VehicleTaxPayment {
        public Integer year;
        public Double amount;
        public boolean paid;
        public OffsetDateTime paidAt;
    }
}
