package com.example.demo.service;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.dao.DataIntegrityViolationException;
import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.CONFLICT;
import static org.springframework.http.HttpStatus.NOT_FOUND;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.example.demo.domain.HealthDoctor;
import com.example.demo.dto.CreateHealthDoctorRequest;
import com.example.demo.repository.HealthDoctorRepository;

@Service
public class HealthDoctorService {

    private final HealthDoctorRepository doctorRepo;

    public HealthDoctorService(HealthDoctorRepository doctorRepo) {
        this.doctorRepo = doctorRepo;
    }

    public List<HealthDoctor> listAll() {
        return doctorRepo.findAllByOrderByCreatedAtDesc();
    }

    public HealthDoctor getByPracticeNumber(String practiceNumber) {
        String pn = safeTrim(practiceNumber);
        if (pn == null || pn.isBlank()) {
            throw new ResponseStatusException(BAD_REQUEST, "PRACTICE_NUMBER_REQUIRED");
        }
        return doctorRepo.findByPracticeNumber(pn)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "DOCTOR_NOT_FOUND"));
    }

    @Transactional
    public HealthDoctor create(CreateHealthDoctorRequest req) {
        if (req == null) throw new ResponseStatusException(BAD_REQUEST, "BODY_REQUIRED");

        String pn = safeTrim(req.practiceNumber);
        if (pn == null || !pn.matches("^[0-9]{10}$")) {
            throw new ResponseStatusException(BAD_REQUEST, "PRACTICE_NUMBER_INVALID");
        }

        if (doctorRepo.existsByPracticeNumber(pn)) {
            throw new ResponseStatusException(CONFLICT, "PRACTICE_NUMBER_ALREADY_EXISTS");
        }

        short shift = 1;
        if (req.shift != null) {
            shift = req.shift.shortValue();
        }
        if (shift != 1 && shift != 2) {
            throw new ResponseStatusException(BAD_REQUEST, "SHIFT_INVALID");
        }

        OffsetDateTime now = OffsetDateTime.now();

        HealthDoctor d = new HealthDoctor();
        d.setId(UUID.randomUUID());
        d.setFirstName(safeReq(req.firstName, "FIRST_NAME_REQUIRED"));
        d.setLastName(safeReq(req.lastName, "LAST_NAME_REQUIRED"));
        d.setPracticeNumber(pn);
        d.setRzokNo(safeReq(req.rzokNo, "RZOK_NO_REQUIRED"));
        d.setHealthRegion(safeReq(req.healthRegion, "HEALTH_REGION_REQUIRED"));
        d.setShift(shift);
        d.setMobile(safeReq(req.mobile, "MOBILE_REQUIRED"));
        d.setOblast(safeReq(req.oblast, "OBLAST_REQUIRED"));
        d.setCity(safeReq(req.city, "CITY_REQUIRED"));
        d.setStreet(safeReq(req.street, "STREET_REQUIRED"));
        d.setCreatedAt(now);
        d.setUpdatedAt(now);

        try {
            return doctorRepo.save(d);
        } catch (DataIntegrityViolationException e) {
            // covers unique constraint too
            throw new ResponseStatusException(CONFLICT, "DOCTOR_ALREADY_EXISTS");
        }
    }

    @Transactional
    public void delete(UUID id) {
        if (id == null) throw new ResponseStatusException(BAD_REQUEST, "ID_REQUIRED");
        if (!doctorRepo.existsById(id)) throw new ResponseStatusException(NOT_FOUND, "DOCTOR_NOT_FOUND");
        doctorRepo.deleteById(id);
    }

    private static String safeTrim(String s) {
        return s == null ? null : s.trim();
    }

    private static String safeReq(String s, String err) {
        String v = safeTrim(s);
        if (v == null || v.isBlank()) throw new ResponseStatusException(BAD_REQUEST, err);
        return v;
    }
}
