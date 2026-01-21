package com.example.demo.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.time.Year;
import java.util.List;
import java.util.UUID;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.NOT_FOUND;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.example.demo.domain.TransportVehicle;
import com.example.demo.domain.TransportVehicleTaxPayment;
import com.example.demo.repository.TransportVehicleRepository;
import com.example.demo.repository.TransportVehicleTaxPaymentRepository;

@Service
public class TransportVehicleService {

    private final TransportVehicleRepository vehicleRepo;
    private final TransportVehicleTaxPaymentRepository taxRepo;

    public TransportVehicleService(TransportVehicleRepository vehicleRepo,
                                   TransportVehicleTaxPaymentRepository taxRepo) {
        this.vehicleRepo = vehicleRepo;
        this.taxRepo = taxRepo;
    }

    public List<TransportVehicle> listMy(UUID userId) {
        return vehicleRepo.findAllByUserIdOrderByCreatedAtDesc(userId);
    }

    public TransportVehicle getMine(UUID userId, UUID vehicleId) {
        return vehicleRepo.findByIdAndUserId(vehicleId, userId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "VEHICLE_NOT_FOUND"));
    }

    public List<TransportVehicleTaxPayment> listTaxPayments(UUID vehicleId) {
        return taxRepo.findAllByVehicleIdOrderByTaxYearDesc(vehicleId);
    }

    @Transactional
    public TransportVehicleTaxPayment payAnnualTax(UUID userId, UUID vehicleId, Integer taxYear) {
        TransportVehicle v = getMine(userId, vehicleId);

        int y = (taxYear == null) ? Year.now().getValue() : taxYear;
        if (y < 1900 || y > 2100) {
            throw new ResponseStatusException(BAD_REQUEST, "TAX_YEAR_INVALID");
        }

        BigDecimal amount = computeAnnualTaxAmount(v).setScale(2, RoundingMode.HALF_UP);
        OffsetDateTime now = OffsetDateTime.now();

        TransportVehicleTaxPayment row = taxRepo.findByVehicleIdAndTaxYear(v.getId(), y).orElse(null);
        if (row == null) {
            row = new TransportVehicleTaxPayment();
            row.setId(UUID.randomUUID());
            row.setVehicleId(v.getId());
            row.setTaxYear(y);
            row.setCreatedAt(now);
        }

        row.setAmount(amount);
        row.setPaidAt(now);

        return taxRepo.save(row);
    }

    // -------- FE-parity tax calculation (vehiclesModel.js) --------

    private static BigDecimal computeAnnualTaxAmount(TransportVehicle v) {
        double kw = safeNum(v.getPowerKw());
        double rate = ratePerKw(kw);
        double aC = ageCoeff(v.getManufactureYear());
        double eC = euroCoeff(v.getEuroCategory());

        double amount = round2(Math.max(0, kw * rate * aC * eC));
        return BigDecimal.valueOf(amount);
    }

    private static double euroCoeff(String euro) {
        if (euro == null) return 1.0;
        return switch (euro.trim().toUpperCase()) {
            case "EURO_2" -> 1.2;
            case "EURO_3" -> 1.1;
            case "EURO_4" -> 1.0;
            case "EURO_5" -> 0.9;
            case "EURO_6" -> 0.85;
            default -> 1.0;
        };
    }

    private static double ageCoeff(Integer manufactureYear) {
        int y = manufactureYear == null ? 0 : manufactureYear;
        int nowY = Year.now().getValue();
        if (y < 1900 || y > nowY) return 1.2;

        int age = Math.max(0, nowY - y);
        if (age <= 5) return 1.0;
        if (age <= 14) return 1.2;
        if (age <= 20) return 1.4;
        return 1.6;
    }

    private static double ratePerKw(double kw) {
        if (kw <= 0) return 0;
        if (kw <= 37) return 0.34;
        if (kw <= 55) return 0.40;
        if (kw <= 74) return 0.54;
        if (kw <= 110) return 1.10;
        return 1.23;
    }

    private static double round2(double x) {
        return Math.round(x * 100.0) / 100.0;
    }

    private static double safeNum(Integer v) {
        return (v == null) ? 0 : v.doubleValue();
    }
}
