package com.example.demo.service;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.NOT_FOUND;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.example.demo.domain.ProblemReport;
import com.example.demo.domain.ProblemReportStatus;
import com.example.demo.repository.ProblemReportRepository;

@Service
public class AdminProblemReportService {

    private final ProblemReportRepository reportRepo;

    public AdminProblemReportService(ProblemReportRepository reportRepo) {
        this.reportRepo = reportRepo;
    }

    public List<ProblemReport> listAll(ProblemReportStatus status) {
        if (status == null) return reportRepo.findAllByOrderByCreatedAtDesc();
        return reportRepo.findAllByStatusOrderByCreatedAtDesc(status);
    }

    public ProblemReport get(UUID id) {
        return reportRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "REPORT_NOT_FOUND"));
    }

    @Transactional
    public ProblemReport resolve(UUID id, UUID adminId, String note) {
        ProblemReport r = get(id);

        if (r.getStatus() != ProblemReportStatus.IN_REVIEW) {
            throw new ResponseStatusException(BAD_REQUEST, "REPORT_ALREADY_DECIDED");
        }

        r.setStatus(ProblemReportStatus.RESOLVED);
        r.setAdminNote(note == null ? "" : note.trim());

        OffsetDateTime now = OffsetDateTime.now();
        r.setDecidedAt(now);
        r.setDecidedByAdminId(adminId);
        r.setUpdatedAt(now);

        return reportRepo.save(r);
    }

    @Transactional
    public ProblemReport reject(UUID id, UUID adminId, String note) {
        ProblemReport r = get(id);

        if (r.getStatus() != ProblemReportStatus.IN_REVIEW) {
            throw new ResponseStatusException(BAD_REQUEST, "REPORT_ALREADY_DECIDED");
        }

        r.setStatus(ProblemReportStatus.REJECTED);
        r.setAdminNote(note == null ? "" : note.trim());

        OffsetDateTime now = OffsetDateTime.now();
        r.setDecidedAt(now);
        r.setDecidedByAdminId(adminId);
        r.setUpdatedAt(now);

        return reportRepo.save(r);
    }
}
