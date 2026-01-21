package com.example.demo.dto;

import java.math.BigDecimal;

import com.example.demo.domain.TransportFineType;

public class AdminCreateTransportFineRequest {
    public String egn;
    public TransportFineType type;

    // optional; if null => base amount by type
    public BigDecimal amount;
}
