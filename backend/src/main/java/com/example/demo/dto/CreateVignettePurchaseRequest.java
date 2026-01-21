package com.example.demo.dto;

import java.time.LocalDate;
import java.util.UUID;

import com.example.demo.domain.TransportVignetteType;

public class CreateVignettePurchaseRequest {
    public UUID vehicleId;
    public TransportVignetteType type;

    // optional; if null => today
    public LocalDate validFrom;
}
