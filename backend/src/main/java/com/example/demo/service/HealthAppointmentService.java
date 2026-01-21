package com.example.demo.service;

import java.time.LocalDate;
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

import com.example.demo.domain.HealthAppointment;
import com.example.demo.dto.CreateHealthAppointmentRequest;
import com.example.demo.repository.HealthAppointmentRepository;

@Service
public class HealthAppointmentService {

    private final HealthAppointmentRepository apptRepo;

    public HealthAppointmentService(HealthAppointmentRepository apptRepo) {
        this.apptRepo = apptRepo;
    }

    public List<HealthAppointment> listMy(UUID userId) {
        return apptRepo.findAllByUserIdOrderByApptDateDescApptTimeDesc(userId);
    }

    public List<HealthAppointment> listBusySlots(String practiceNumber, LocalDate date) {
        return apptRepo.findAllByDoctorPracticeNumberAndApptDateOrderByApptTimeAsc(practiceNumber, date);
    }

    @Transactional
    public HealthAppointment book(UUID userId, CreateHealthAppointmentRequest req) {
        if (req == null) throw new ResponseStatusException(BAD_REQUEST, "BODY_REQUIRED");

        String pn = safeTrim(req.doctorPracticeNumber);
        if (pn == null || !pn.matches("^[0-9]{10}$")) throw new ResponseStatusException(BAD_REQUEST, "PRACTICE_NUMBER_INVALID");

        String doctorName = safeReq(req.doctorName, "DOCTOR_NAME_REQUIRED");
        String time = safeReq(req.time, "TIME_REQUIRED");
        String dateStr = safeReq(req.date, "DATE_REQUIRED");

        LocalDate date;
        try {
            date = LocalDate.parse(dateStr);
        } catch (Exception e) {
            throw new ResponseStatusException(BAD_REQUEST, "DATE_INVALID");
        }

        OffsetDateTime now = OffsetDateTime.now();

        HealthAppointment a = new HealthAppointment();
        a.setId(UUID.randomUUID());
        a.setUserId(userId);
        a.setDoctorPracticeNumber(pn);
        a.setDoctorName(doctorName);
        a.setApptDate(date);
        a.setApptTime(time);
        a.setCreatedAt(now);
        a.setUpdatedAt(now);

        try {
            return apptRepo.save(a);
        } catch (DataIntegrityViolationException e) {
            // covers uq doctor slot + uq user slot
            throw new ResponseStatusException(CONFLICT, "APPOINTMENT_SLOT_TAKEN");
        }
    }

    @Transactional
    public void cancel(UUID userId, UUID appointmentId) {
        HealthAppointment a = apptRepo.findByIdAndUserId(appointmentId, userId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "APPOINTMENT_NOT_FOUND"));
        apptRepo.delete(a);
    }

    private static String safeTrim(String s) { return s == null ? null : s.trim(); }

    private static String safeReq(String s, String err) {
        String v = safeTrim(s);
        if (v == null || v.isBlank()) throw new ResponseStatusException(BAD_REQUEST, err);
        return v;
    }
}
