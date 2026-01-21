package com.example.demo.service;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.CONFLICT;
import static org.springframework.http.HttpStatus.NOT_FOUND;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.example.demo.domain.AppFile;
import com.example.demo.domain.FileLink;
import com.example.demo.domain.HealthDoctor;
import com.example.demo.domain.HealthRequest;
import com.example.demo.domain.HealthRequestKind;
import com.example.demo.domain.HealthRequestStatus;
import com.example.demo.domain.HealthUserProfile;
import com.example.demo.dto.AddPersonalDoctorRequestData;
import com.example.demo.dto.AddReferralRequestData;
import com.example.demo.repository.FileLinkRepository;
import com.example.demo.repository.FileRepository;
import com.example.demo.repository.HealthDoctorRepository;
import com.example.demo.repository.HealthRequestRepository;
import com.example.demo.repository.HealthUserProfileRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

@Service
public class HealthRequestService {

    public static final String ENTITY_TYPE_HEALTH_REQUEST = "HEALTH_REQUEST";
    public static final String TAG_BOOKLET_IMAGE = "BOOKLET_IMAGE";
    public static final String TAG_REFERRAL_PDF = "REFERRAL_PDF";

    private final HealthRequestRepository requestRepo;
    private final HealthDoctorRepository doctorRepo;
    private final HealthUserProfileRepository profileRepo;

    private final FileRepository fileRepo;
    private final FileLinkRepository fileLinkRepo;
    private final FileStorageService fileStorage;

    private final ObjectMapper objectMapper;

    public HealthRequestService(HealthRequestRepository requestRepo,
                                HealthDoctorRepository doctorRepo,
                                HealthUserProfileRepository profileRepo,
                                FileRepository fileRepo,
                                FileLinkRepository fileLinkRepo,
                                FileStorageService fileStorage,
                                ObjectMapper objectMapper) {
        this.requestRepo = requestRepo;
        this.doctorRepo = doctorRepo;
        this.profileRepo = profileRepo;
        this.fileRepo = fileRepo;
        this.fileLinkRepo = fileLinkRepo;
        this.fileStorage = fileStorage;
        this.objectMapper = objectMapper;
    }

    public List<HealthRequest> listMy(UUID userId) {
        return requestRepo.findAllByUserIdOrderByCreatedAtDesc(userId);
    }

    @Transactional
    public HealthRequest createAddPersonalDoctor(UUID userId, AddPersonalDoctorRequestData data, MultipartFile bookletImage) {
        if (data == null) throw new ResponseStatusException(BAD_REQUEST, "DATA_REQUIRED");

        if (requestRepo.existsByUserIdAndKindAndStatus(userId, HealthRequestKind.ADD_PERSONAL_DOCTOR, HealthRequestStatus.PENDING)) {
            throw new ResponseStatusException(CONFLICT, "PENDING_ADD_DOCTOR_ALREADY_EXISTS");
        }

        String pn = safeTrim(data.practiceNumber);
        if (pn == null || !pn.matches("^[0-9]{10}$")) {
            throw new ResponseStatusException(BAD_REQUEST, "PRACTICE_NUMBER_INVALID");
        }

        HealthDoctor doctor = doctorRepo.findByPracticeNumber(pn)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "DOCTOR_NOT_FOUND"));

        // store image
        AppFile img = fileStorage.storeUserImage(userId, bookletImage);

        OffsetDateTime now = OffsetDateTime.now();

        ObjectNode doctorSnapshot = objectMapper.createObjectNode();
        doctorSnapshot.put("id", doctor.getId().toString());
        doctorSnapshot.put("firstName", doctor.getFirstName());
        doctorSnapshot.put("lastName", doctor.getLastName());
        doctorSnapshot.put("practiceNumber", doctor.getPracticeNumber());
        doctorSnapshot.put("rzokNo", doctor.getRzokNo());
        doctorSnapshot.put("healthRegion", doctor.getHealthRegion());
        doctorSnapshot.put("shift", doctor.getShift());
        doctorSnapshot.put("mobile", doctor.getMobile());
        doctorSnapshot.put("oblast", doctor.getOblast());
        doctorSnapshot.put("city", doctor.getCity());
        doctorSnapshot.put("street", doctor.getStreet());

        ObjectNode payload = objectMapper.createObjectNode();
        payload.put("practiceNumber", pn);

        // if FE sent doctor snapshot, keep it; else use DB snapshot
        JsonNode provided = data.doctor;
        payload.set("doctor", (provided != null && !provided.isNull()) ? provided : doctorSnapshot);

        HealthRequest req = new HealthRequest();
        req.setId(UUID.randomUUID());
        req.setUserId(userId);
        req.setKind(HealthRequestKind.ADD_PERSONAL_DOCTOR);
        req.setStatus(HealthRequestStatus.PENDING);
        req.setPayload(payload);
        req.setAdminNote(null);
        req.setDecidedAt(null);
        req.setDecidedByAdminId(null);
        req.setCreatedAt(now);
        req.setUpdatedAt(now);

        requestRepo.save(req);

        FileLink link = new FileLink();
        link.setId(UUID.randomUUID());
        link.setEntityType(ENTITY_TYPE_HEALTH_REQUEST);
        link.setEntityId(req.getId());
        link.setTag(TAG_BOOKLET_IMAGE);
        link.setFileId(img.getId());
        link.setCreatedAt(now);

        fileLinkRepo.save(link);

        return req;
    }

    @Transactional
    public HealthRequest createRemovePersonalDoctor(UUID userId) {
        if (requestRepo.existsByUserIdAndKindAndStatus(userId, HealthRequestKind.REMOVE_PERSONAL_DOCTOR, HealthRequestStatus.PENDING)) {
            throw new ResponseStatusException(CONFLICT, "PENDING_REMOVE_DOCTOR_ALREADY_EXISTS");
        }

        HealthUserProfile profile = profileRepo.findById(userId).orElse(null);
        if (profile == null || profile.getPersonalDoctorPracticeNumber() == null || profile.getPersonalDoctorPracticeNumber().isBlank()) {
            throw new ResponseStatusException(BAD_REQUEST, "NO_PERSONAL_DOCTOR_TO_REMOVE");
        }

        OffsetDateTime now = OffsetDateTime.now();

        ObjectNode payload = objectMapper.createObjectNode();

        HealthRequest req = new HealthRequest();
        req.setId(UUID.randomUUID());
        req.setUserId(userId);
        req.setKind(HealthRequestKind.REMOVE_PERSONAL_DOCTOR);
        req.setStatus(HealthRequestStatus.PENDING);
        req.setPayload(payload);
        req.setAdminNote(null);
        req.setDecidedAt(null);
        req.setDecidedByAdminId(null);
        req.setCreatedAt(now);
        req.setUpdatedAt(now);

        return requestRepo.save(req);
    }

    @Transactional
    public HealthRequest createAddReferral(UUID userId, AddReferralRequestData data, MultipartFile referralPdf) {
        if (data == null) throw new ResponseStatusException(BAD_REQUEST, "DATA_REQUIRED");

        if (requestRepo.existsByUserIdAndKindAndStatus(userId, HealthRequestKind.ADD_REFERRAL, HealthRequestStatus.PENDING)) {
            throw new ResponseStatusException(CONFLICT, "PENDING_REFERRAL_ALREADY_EXISTS");
        }

        String title = safeTrim(data.title);
        if (title == null || title.isBlank()) {
            throw new ResponseStatusException(BAD_REQUEST, "TITLE_REQUIRED");
        }

        AppFile pdf = fileStorage.storeUserPdf(userId, referralPdf);

        OffsetDateTime now = OffsetDateTime.now();

        ObjectNode payload = objectMapper.createObjectNode();
        payload.put("title", title);

        HealthRequest req = new HealthRequest();
        req.setId(UUID.randomUUID());
        req.setUserId(userId);
        req.setKind(HealthRequestKind.ADD_REFERRAL);
        req.setStatus(HealthRequestStatus.PENDING);
        req.setPayload(payload);
        req.setAdminNote(null);
        req.setDecidedAt(null);
        req.setDecidedByAdminId(null);
        req.setCreatedAt(now);
        req.setUpdatedAt(now);

        requestRepo.save(req);

        FileLink link = new FileLink();
        link.setId(UUID.randomUUID());
        link.setEntityType(ENTITY_TYPE_HEALTH_REQUEST);
        link.setEntityId(req.getId());
        link.setTag(TAG_REFERRAL_PDF);
        link.setFileId(pdf.getId());
        link.setCreatedAt(now);

        fileLinkRepo.save(link);

        return req;
    }

    // Helpers for controllers (download)
    public AppFile getMyRequestFile(UUID userId, UUID requestId, String tag) {
        HealthRequest r = requestRepo.findByIdAndUserId(requestId, userId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "REQUEST_NOT_FOUND"));

        FileLink link = fileLinkRepo.findByEntityTypeAndEntityIdAndTag(ENTITY_TYPE_HEALTH_REQUEST, r.getId(), tag)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "FILE_NOT_FOUND"));

        return fileRepo.findById(link.getFileId())
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "FILE_NOT_FOUND"));
    }

    private static String safeTrim(String s) {
        return s == null ? null : s.trim();
    }
}
