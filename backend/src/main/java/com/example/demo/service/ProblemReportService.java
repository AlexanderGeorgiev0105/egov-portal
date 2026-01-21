package com.example.demo.service;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.NOT_FOUND;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.example.demo.domain.ProblemReport;
import com.example.demo.domain.ProblemReportStatus;
import com.example.demo.domain.User;
import com.example.demo.dto.CreateProblemReportRequestData;
import com.example.demo.repository.ProblemReportRepository;
import com.example.demo.repository.UserRepository;

@Service
public class ProblemReportService {

    // Must match Frontend slugs (problemReportsModel.js)
    public static final Set<String> ALLOWED_CATEGORIES = Set.of(
            "road-infrastructure",
            "utilities",
            "public-order",
            "cleanliness-waste",
            "app-issue",
            "other"
    );

    private final ProblemReportRepository reportRepo;
    private final UserRepository userRepo;

    public ProblemReportService(ProblemReportRepository reportRepo, UserRepository userRepo) {
        this.reportRepo = reportRepo;
        this.userRepo = userRepo;
    }

    public List<ProblemReport> listMy(UUID userId) {
        return reportRepo.findAllByUserIdOrderByCreatedAtDesc(userId);
    }

    public ProblemReport getMine(UUID userId, UUID reportId) {
        return reportRepo.findByIdAndUserId(reportId, userId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "REPORT_NOT_FOUND"));
    }

    @Transactional
    public ProblemReport create(UUID userId, CreateProblemReportRequestData body) {
        if (body == null) throw new ResponseStatusException(BAD_REQUEST, "DATA_REQUIRED");

        String category = body.category == null ? "" : body.category.trim();
        String description = body.description == null ? "" : body.description.trim();

        if (category.isBlank()) throw new ResponseStatusException(BAD_REQUEST, "CATEGORY_REQUIRED");
        if (!ALLOWED_CATEGORIES.contains(category)) throw new ResponseStatusException(BAD_REQUEST, "CATEGORY_INVALID");

        if (description.isBlank() || description.length() < 10) {
            throw new ResponseStatusException(BAD_REQUEST, "DESCRIPTION_MIN_10");
        }

        User u = userRepo.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "USER_NOT_FOUND"));

        OffsetDateTime now = OffsetDateTime.now();

        ProblemReport r = new ProblemReport();
        r.setId(UUID.randomUUID());
        r.setUserId(userId);

        // Snapshot for admin UI
        r.setUserEgn(u.getEgn());
        r.setUserFullName(u.getFullName());

        r.setCategory(category);
        r.setDescription(description);

        r.setStatus(ProblemReportStatus.IN_REVIEW);
        r.setAdminNote("");

        r.setDecidedAt(null);
        r.setDecidedByAdminId(null);

        r.setCreatedAt(now);
        r.setUpdatedAt(now);

        return reportRepo.save(r);
    }
}
