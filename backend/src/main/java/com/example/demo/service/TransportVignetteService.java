package com.example.demo.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.CONFLICT;
import static org.springframework.http.HttpStatus.NOT_FOUND;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.example.demo.domain.TransportVignette;
import com.example.demo.domain.TransportVignetteType;
import com.example.demo.repository.TransportVehicleRepository;
import com.example.demo.repository.TransportVignetteRepository;

@Service
public class TransportVignetteService {

    private final TransportVignetteRepository vignetteRepo;
    private final TransportVehicleRepository vehicleRepo;

    public TransportVignetteService(TransportVignetteRepository vignetteRepo,
                                    TransportVehicleRepository vehicleRepo) {
        this.vignetteRepo = vignetteRepo;
        this.vehicleRepo = vehicleRepo;
    }

    public List<TransportVignette> listMy(UUID userId) {
        return vignetteRepo.findAllByUserIdOrderByCreatedAtDesc(userId);
    }

    @Transactional
    public TransportVignette purchase(UUID userId, String ownerEgn, UUID vehicleId, TransportVignetteType type, LocalDate validFrom) {
        if (vehicleId == null) throw new ResponseStatusException(BAD_REQUEST, "VEHICLE_ID_REQUIRED");
        if (type == null) throw new ResponseStatusException(BAD_REQUEST, "TYPE_REQUIRED");

        // must own vehicle
        vehicleRepo.findByIdAndUserId(vehicleId, userId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "VEHICLE_NOT_FOUND"));

        LocalDate from = (validFrom == null) ? LocalDate.now() : validFrom;
        LocalDate until = computeValidUntil(from, type);

        // active vignette check (inclusive)
        if (vignetteRepo.findActiveForVehicle(vehicleId, LocalDate.now()).isPresent()) {
            throw new ResponseStatusException(CONFLICT, "ACTIVE_VIGNETTE_ALREADY_EXISTS");
        }

        BigDecimal price = basePrice(type);

        OffsetDateTime now = OffsetDateTime.now();

        TransportVignette v = new TransportVignette();
        v.setId(UUID.randomUUID());
        v.setUserId(userId);
        v.setOwnerEgn(ownerEgn);
        v.setVehicleId(vehicleId);
        v.setType(type);
        v.setPrice(price);
        v.setValidFrom(from);
        v.setValidUntil(until);
        v.setPaidAt(now);
        v.setCreatedAt(now);

        return vignetteRepo.save(v);
    }

    private static LocalDate computeValidUntil(LocalDate validFrom, TransportVignetteType type) {
        return switch (type) {
            case WEEKLY -> validFrom.plusDays(7);
            case MONTHLY -> validFrom.plusMonths(1);
            case QUARTERLY -> validFrom.plusMonths(3);
            case YEARLY -> validFrom.plusYears(1);
        };
    }

    // FE parity (vehiclesModel.js)
    private static BigDecimal basePrice(TransportVignetteType type) {
        return switch (type) {
            case WEEKLY -> BigDecimal.valueOf(15);
            case MONTHLY -> BigDecimal.valueOf(30);
            case QUARTERLY -> BigDecimal.valueOf(54);
            case YEARLY -> BigDecimal.valueOf(97);
        };
    }
}
