package com.example.demo.service;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import static org.springframework.http.HttpStatus.NOT_FOUND;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.example.demo.domain.AccountStatus;
import com.example.demo.domain.AppFile;
import com.example.demo.domain.Document;
import com.example.demo.domain.DocumentType;
import com.example.demo.domain.FileLink;
import com.example.demo.domain.User;
import com.example.demo.dto.AdminUserSummaryResponse;
import com.example.demo.repository.DocumentRepository;
import com.example.demo.repository.FileLinkRepository;
import com.example.demo.repository.FileRepository;
import com.example.demo.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class AdminRegistrationService {

    public static final String ENTITY_TYPE_USER = "USER";
    public static final String TAG_ID_CARD_FRONT = "ID_CARD_FRONT";
    public static final String TAG_ID_CARD_BACK = "ID_CARD_BACK";

    // Documents module integration:
    public static final String ENTITY_TYPE_DOCUMENT = "DOCUMENT";
    public static final String TAG_DOC_PHOTO_1 = "PHOTO_1";
    public static final String TAG_DOC_PHOTO_2 = "PHOTO_2";

    private final UserRepository userRepository;
    private final FileRepository fileRepository;
    private final FileLinkRepository fileLinkRepository;
    private final FileStorageService fileStorageService;

    private final DocumentRepository documentRepository;
    private final ObjectMapper objectMapper;

    public AdminRegistrationService(UserRepository userRepository,
                                    FileRepository fileRepository,
                                    FileLinkRepository fileLinkRepository,
                                    FileStorageService fileStorageService,
                                    DocumentRepository documentRepository,
                                    ObjectMapper objectMapper) {
        this.userRepository = userRepository;
        this.fileRepository = fileRepository;
        this.fileLinkRepository = fileLinkRepository;
        this.fileStorageService = fileStorageService;
        this.documentRepository = documentRepository;
        this.objectMapper = objectMapper;
    }

    public List<AdminUserSummaryResponse> list(AccountStatus status) {
        return userRepository.findByAccountStatusOrderByCreatedAtDesc(status).stream()
                .map(this::toSummary)
                .toList();
    }

    /**
     * Approves user registration AND auto-creates an ID_CARD document (Documents module parity with FE demo),
     * linking the registration ID card images to the newly created document.
     */
    @Transactional
    public void approve(UUID userId, UUID adminId) {
        User u = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "User not found"));

        u.setAccountStatus(AccountStatus.ACTIVE);
        u.setApprovedAt(OffsetDateTime.now());
        u.setApprovedByAdminId(adminId);

        userRepository.save(u);

        ensureIdCardDocumentForApprovedUser(u);
    }

    public void rejectAndDelete(UUID userId) {
        if (!userRepository.existsById(userId)) {
            throw new ResponseStatusException(NOT_FOUND, "User not found");
        }

        // Clean up physical files first (DB rows are removed via ON DELETE CASCADE)
        for (AppFile f : fileRepository.findAllByOwnerUserId(userId)) {
            fileStorageService.deletePhysicalIfExists(f);
        }

        userRepository.deleteById(userId);
    }

    private void ensureIdCardDocumentForApprovedUser(User u) {
        // FE behavior: when a real user (with EGN) logs in, an ID_CARD document is auto-populated from registration data.
        // Backend behavior: create it here, once, when admin approves the registration.

        if (documentRepository.existsByUserIdAndType(u.getId(), DocumentType.ID_CARD)) {
            return;
        }

        OffsetDateTime now = OffsetDateTime.now();

        NameParts np = splitFullName(u.getFullName());

        Document d = new Document();
        d.setId(UUID.randomUUID());
        d.setUserId(u.getId());
        d.setType(DocumentType.ID_CARD);

        d.setFirstName(np.firstName);
        d.setMiddleName(np.middleName);
        d.setLastName(np.lastName);

        d.setEgn(u.getEgn());
        d.setGender(u.getGender());
        d.setDob(u.getDob());

        d.setDocNumber(u.getDocNumber());
        d.setValidUntil(u.getDocValidUntil());

        d.setIssuedAt(u.getIssuedAt());
        d.setBirthPlace(u.getBirthPlace());
        d.setAddress(u.getAddress());

        // ID card has no categories
        d.setCategories(objectMapper.createArrayNode());

        d.setCreatedAt(now);
        d.setUpdatedAt(now);

        documentRepository.save(d);

        // Link the two registration photos to the document as PHOTO_1 / PHOTO_2
        UUID frontFileId = fileLinkRepository
                .findByEntityTypeAndEntityIdAndTag(ENTITY_TYPE_USER, u.getId(), TAG_ID_CARD_FRONT)
                .map(FileLink::getFileId)
                .orElse(null);

        UUID backFileId = fileLinkRepository
                .findByEntityTypeAndEntityIdAndTag(ENTITY_TYPE_USER, u.getId(), TAG_ID_CARD_BACK)
                .map(FileLink::getFileId)
                .orElse(null);

        if (frontFileId != null) {
            fileLinkRepository.deleteByEntityTypeAndEntityIdAndTag(ENTITY_TYPE_DOCUMENT, d.getId(), TAG_DOC_PHOTO_1);

            FileLink l1 = new FileLink();
            l1.setId(UUID.randomUUID());
            l1.setEntityType(ENTITY_TYPE_DOCUMENT);
            l1.setEntityId(d.getId());
            l1.setTag(TAG_DOC_PHOTO_1);
            l1.setFileId(frontFileId);
            l1.setCreatedAt(now);
            fileLinkRepository.save(l1);
        }

        if (backFileId != null) {
            fileLinkRepository.deleteByEntityTypeAndEntityIdAndTag(ENTITY_TYPE_DOCUMENT, d.getId(), TAG_DOC_PHOTO_2);

            FileLink l2 = new FileLink();
            l2.setId(UUID.randomUUID());
            l2.setEntityType(ENTITY_TYPE_DOCUMENT);
            l2.setEntityId(d.getId());
            l2.setTag(TAG_DOC_PHOTO_2);
            l2.setFileId(backFileId);
            l2.setCreatedAt(now);
            fileLinkRepository.save(l2);
        }
    }

    private static final class NameParts {
        final String firstName;
        final String middleName;
        final String lastName;

        NameParts(String firstName, String middleName, String lastName) {
            this.firstName = firstName;
            this.middleName = middleName;
            this.lastName = lastName;
        }
    }

    private static NameParts splitFullName(String fullName) {
        String raw = String.valueOf(fullName == null ? "" : fullName).trim().replaceAll("\\s+", " ");
        if (raw.isBlank()) return new NameParts("", "", "");
        String[] parts = raw.split(" ");
        String first = parts.length > 0 ? parts[0] : "";
        String middle = parts.length > 1 ? parts[1] : "";
        String last = parts.length > 2 ? String.join(" ", java.util.Arrays.copyOfRange(parts, 2, parts.length)) : "";
        return new NameParts(first, middle, last);
    }

    private AdminUserSummaryResponse toSummary(User u) {
        AdminUserSummaryResponse r = new AdminUserSummaryResponse();
        r.id = u.getId();
        r.fullName = u.getFullName();
        r.egn = u.getEgn();
        r.email = u.getEmail();

        r.gender = u.getGender();
        r.dob = u.getDob();

        r.docNumber = u.getDocNumber();
        r.docValidUntil = u.getDocValidUntil();
        r.issuedAt = u.getIssuedAt();

        r.birthPlace = u.getBirthPlace();
        r.address = u.getAddress();
        r.phone = u.getPhone();

        r.idCardFrontFileId = fileLinkRepository
                .findByEntityTypeAndEntityIdAndTag(ENTITY_TYPE_USER, u.getId(), TAG_ID_CARD_FRONT)
                .map(FileLink::getFileId)
                .orElse(null);

        r.idCardBackFileId = fileLinkRepository
                .findByEntityTypeAndEntityIdAndTag(ENTITY_TYPE_USER, u.getId(), TAG_ID_CARD_BACK)
                .map(FileLink::getFileId)
                .orElse(null);

        r.accountStatus = u.getAccountStatus();
        r.createdAt = u.getCreatedAt();
        return r;
    }
}
