package com.example.demo.service;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.CONFLICT;
import static org.springframework.http.HttpStatus.NOT_FOUND;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.example.demo.domain.AppFile;
import com.example.demo.domain.FileLink;
import com.example.demo.domain.HealthDoctor;
import com.example.demo.domain.HealthReferral;
import com.example.demo.domain.HealthRequest;
import com.example.demo.domain.HealthRequestKind;
import com.example.demo.domain.HealthRequestStatus;
import com.example.demo.domain.HealthUserProfile;
import com.example.demo.repository.FileLinkRepository;
import com.example.demo.repository.FileRepository;
import com.example.demo.repository.HealthDoctorRepository;
import com.example.demo.repository.HealthReferralRepository;
import com.example.demo.repository.HealthRequestRepository;
import com.example.demo.repository.HealthUserProfileRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

@Service
public class AdminHealthRequestService {

    public static final String ENTITY_TYPE_HEALTH_REQUEST = HealthRequestService.ENTITY_TYPE_HEALTH_REQUEST;
    public static final String TAG_BOOKLET_IMAGE = HealthRequestService.TAG_BOOKLET_IMAGE;
    public static final String TAG_REFERRAL_PDF = HealthRequestService.TAG_REFERRAL_PDF;

    public static final String ENTITY_TYPE_HEALTH_REFERRAL = "HEALTH_REFERRAL";

    private final HealthRequestRepository requestRepo;
    private final HealthDoctorRepository doctorRepo;
    private final HealthUserProfileRepository profileRepo;
    private final HealthReferralRepository referralRepo;

    private final FileRepository fileRepo;
    private final FileLinkRepository fileLinkRepo;

    private final ObjectMapper objectMapper;

    public AdminHealthRequestService(HealthRequestRepository requestRepo,
                                     HealthDoctorRepository doctorRepo,
                                     HealthUserProfileRepository profileRepo,
                                     HealthReferralRepository referralRepo,
                                     FileRepository fileRepo,
                                     FileLinkRepository fileLinkRepo,
                                     ObjectMapper objectMapper) {
        this.requestRepo = requestRepo;
        this.doctorRepo = doctorRepo;
        this.profileRepo = profileRepo;
        this.referralRepo = referralRepo;
        this.fileRepo = fileRepo;
        this.fileLinkRepo = fileLinkRepo;
        this.objectMapper = objectMapper;
    }

    public List<HealthRequest> listAll(String status) {
        if (status == null || status.isBlank()) {
            return requestRepo.findAllByOrderByCreatedAtDesc();
        }
        HealthRequestStatus st;
        try {
            st = HealthRequestStatus.valueOf(status.trim().toUpperCase());
        } catch (Exception e) {
            throw new ResponseStatusException(BAD_REQUEST, "STATUS_INVALID");
        }
        return requestRepo.findAllByStatusOrderByCreatedAtDesc(st);
    }

    public HealthRequest get(UUID id) {
        return requestRepo.findById(id).orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "REQUEST_NOT_FOUND"));
    }

    @Transactional
    public HealthRequest approve(UUID requestId, UUID adminId, String adminNote) {
        HealthRequest r = requestRepo.findById(requestId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "REQUEST_NOT_FOUND"));

        if (r.getStatus() != HealthRequestStatus.PENDING) {
            throw new ResponseStatusException(CONFLICT, "REQUEST_NOT_PENDING");
        }

        OffsetDateTime now = OffsetDateTime.now();

        if (r.getKind() == HealthRequestKind.ADD_PERSONAL_DOCTOR) {
            applyApproveAddDoctor(r, now);
        } else if (r.getKind() == HealthRequestKind.REMOVE_PERSONAL_DOCTOR) {
            applyApproveRemoveDoctor(r, now);
        } else if (r.getKind() == HealthRequestKind.ADD_REFERRAL) {
            applyApproveReferral(r, now);
        } else {
            throw new ResponseStatusException(BAD_REQUEST, "UNKNOWN_KIND");
        }

        r.setStatus(HealthRequestStatus.APPROVED);
        r.setAdminNote(adminNote == null ? "" : adminNote);
        r.setDecidedAt(now);
        r.setDecidedByAdminId(adminId);
        r.setUpdatedAt(now);

        return requestRepo.save(r);
    }

    @Transactional
    public HealthRequest reject(UUID requestId, UUID adminId, String adminNote) {
        HealthRequest r = requestRepo.findById(requestId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "REQUEST_NOT_FOUND"));

        if (r.getStatus() != HealthRequestStatus.PENDING) {
            throw new ResponseStatusException(CONFLICT, "REQUEST_NOT_PENDING");
        }

        OffsetDateTime now = OffsetDateTime.now();

        r.setStatus(HealthRequestStatus.REJECTED);
        r.setAdminNote(adminNote == null ? "" : adminNote);
        r.setDecidedAt(now);
        r.setDecidedByAdminId(adminId);
        r.setUpdatedAt(now);

        return requestRepo.save(r);
    }

    public AppFile getRequestFile(UUID requestId, String tag) {
        HealthRequest r = requestRepo.findById(requestId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "REQUEST_NOT_FOUND"));

        FileLink link = fileLinkRepo.findByEntityTypeAndEntityIdAndTag(ENTITY_TYPE_HEALTH_REQUEST, r.getId(), tag)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "FILE_NOT_FOUND"));

        return fileRepo.findById(link.getFileId())
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "FILE_NOT_FOUND"));
    }

    private void applyApproveAddDoctor(HealthRequest r, OffsetDateTime now) {
        JsonNode payload = r.getPayload();
        if (payload == null || payload.isNull()) throw new ResponseStatusException(BAD_REQUEST, "PAYLOAD_INVALID");

        String pn = payload.path("practiceNumber").asText(null);
        if (pn == null || !pn.matches("^[0-9]{10}$")) throw new ResponseStatusException(BAD_REQUEST, "PRACTICE_NUMBER_INVALID");

        HealthDoctor doctor = doctorRepo.findByPracticeNumber(pn)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "DOCTOR_NOT_FOUND"));

        JsonNode snapshot = payload.get("doctor");
        if (snapshot == null || snapshot.isNull()) {
            ObjectNode s = objectMapper.createObjectNode();
            s.put("id", doctor.getId().toString());
            s.put("firstName", doctor.getFirstName());
            s.put("lastName", doctor.getLastName());
            s.put("practiceNumber", doctor.getPracticeNumber());
            s.put("rzokNo", doctor.getRzokNo());
            s.put("healthRegion", doctor.getHealthRegion());
            s.put("shift", doctor.getShift());
            s.put("mobile", doctor.getMobile());
            s.put("oblast", doctor.getOblast());
            s.put("city", doctor.getCity());
            s.put("street", doctor.getStreet());
            snapshot = s;
        }

        HealthUserProfile profile = profileRepo.findById(r.getUserId()).orElse(null);
        if (profile == null) {
            profile = new HealthUserProfile();
            profile.setUserId(r.getUserId());
            profile.setCreatedAt(now);
        }
        profile.setPersonalDoctorPracticeNumber(pn);
        profile.setPersonalDoctorSnapshot(snapshot);
        profile.setUpdatedAt(now);

        profileRepo.save(profile);
    }

    private void applyApproveRemoveDoctor(HealthRequest r, OffsetDateTime now) {
        HealthUserProfile profile = profileRepo.findById(r.getUserId()).orElse(null);
        if (profile == null) {
            // still create empty profile to keep consistent
            profile = new HealthUserProfile();
            profile.setUserId(r.getUserId());
            profile.setCreatedAt(now);
        }
        profile.setPersonalDoctorPracticeNumber(null);
        profile.setPersonalDoctorSnapshot(null);
        profile.setUpdatedAt(now);

        profileRepo.save(profile);
    }

    private void applyApproveReferral(HealthRequest r, OffsetDateTime now) {
        JsonNode payload = r.getPayload();
        if (payload == null || payload.isNull()) throw new ResponseStatusException(BAD_REQUEST, "PAYLOAD_INVALID");

        String title = payload.path("title").asText(null);
        if (title == null || title.trim().isBlank()) {
            throw new ResponseStatusException(BAD_REQUEST, "TITLE_REQUIRED");
        }

        HealthReferral ref = new HealthReferral();
        ref.setId(UUID.randomUUID());
        ref.setUserId(r.getUserId());
        ref.setTitle(title.trim());
        ref.setSourceRequestId(r.getId());
        ref.setCreatedAt(now);
        ref.setUpdatedAt(now);

        referralRepo.save(ref);

        // Copy PDF link from request -> referral (so user can open it from referrals too)
        FileLink reqPdf = fileLinkRepo.findByEntityTypeAndEntityIdAndTag(ENTITY_TYPE_HEALTH_REQUEST, r.getId(), TAG_REFERRAL_PDF)
                .orElse(null);

        if (reqPdf != null) {
            FileLink refPdf = new FileLink();
            refPdf.setId(UUID.randomUUID());
            refPdf.setEntityType(ENTITY_TYPE_HEALTH_REFERRAL);
            refPdf.setEntityId(ref.getId());
            refPdf.setTag(TAG_REFERRAL_PDF);
            refPdf.setFileId(reqPdf.getFileId());
            refPdf.setCreatedAt(now);

            fileLinkRepo.save(refPdf);
        }
    }
}
