package com.example.demo.service;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.example.demo.domain.TransportFine;
import com.example.demo.domain.TransportFineType;
import com.example.demo.domain.User;
import com.example.demo.repository.TransportFineRepository;
import com.example.demo.repository.UserRepository;

@Service
public class AdminTransportFineService {

    private final TransportFineRepository fineRepo;
    private final UserRepository userRepo;

    public AdminTransportFineService(TransportFineRepository fineRepo, UserRepository userRepo) {
        this.fineRepo = fineRepo;
        this.userRepo = userRepo;
    }

    @Transactional
    public TransportFine createFine(String egn, TransportFineType type, BigDecimal amount) {
        String e = (egn == null) ? "" : egn.trim();
        if (!e.matches("^[0-9]{10}$")) throw new ResponseStatusException(BAD_REQUEST, "EGN_INVALID");
        if (type == null) throw new ResponseStatusException(BAD_REQUEST, "TYPE_REQUIRED");

        BigDecimal finalAmount = (amount == null) ? baseAmount(type) : amount;
        if (finalAmount.signum() < 0) throw new ResponseStatusException(BAD_REQUEST, "AMOUNT_INVALID");

        User u = userRepo.findByEgn(e).orElse(null);

        OffsetDateTime now = OffsetDateTime.now();

        TransportFine f = new TransportFine();
        f.setId(UUID.randomUUID());
        f.setUserId(u != null ? u.getId() : null);
        f.setEgn(e);
        f.setType(type);
        f.setAmount(finalAmount);
        f.setIssuedAt(now);
        f.setPaid(false);
        f.setPaidAt(null);
        f.setCreatedAt(now);
        f.setUpdatedAt(now);

        return fineRepo.save(f);
    }

    // FE parity base amounts (vehiclesModel.js)
    private static BigDecimal baseAmount(TransportFineType type) {
        return switch (type) {
            case SPEED_UP_TO_10 -> BigDecimal.valueOf(20);
            case SPEED_11_20 -> BigDecimal.valueOf(50);
            case SPEED_21_30 -> BigDecimal.valueOf(100);
            case SPEED_31_40 -> BigDecimal.valueOf(300);
            case RED_LIGHT -> BigDecimal.valueOf(150);
            case NO_SEATBELT -> BigDecimal.valueOf(50);
            case PHONE_WHILE_DRIVING -> BigDecimal.valueOf(50);
            case NO_INSURANCE -> BigDecimal.valueOf(250);
            case NO_LICENSE -> BigDecimal.valueOf(300);
            case PARKING_FORBIDDEN -> BigDecimal.valueOf(30);
        };
    }
}
