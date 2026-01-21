package com.example.demo.service;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.CONFLICT;
import static org.springframework.http.HttpStatus.NOT_FOUND;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.example.demo.domain.AppFile;
import com.example.demo.domain.DocumentRequest;
import com.example.demo.domain.DocumentRequestKind;
import com.example.demo.domain.DocumentRequestStatus;
import com.example.demo.domain.DocumentType;
import com.example.demo.domain.FileLink;
import com.example.demo.dto.CreateDocumentAddRequestData;
import com.example.demo.dto.CreateDocumentRemoveRequest;
import com.example.demo.repository.DocumentRepository;
import com.example.demo.repository.DocumentRequestRepository;
import com.example.demo.repository.FileLinkRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

@Service
public class DocumentRequestService {

    public static final String ENTITY_TYPE_DOCUMENT = "DOCUMENT";
    public static final String ENTITY_TYPE_DOCUMENT_REQUEST = "DOCUMENT_REQUEST";

    public static final String TAG_PHOTO_1 = "PHOTO_1";
    public static final String TAG_PHOTO_2 = "PHOTO_2";

    private final DocumentRepository documentRepo;
    private final DocumentRequestRepository requestRepo;
    private final FileStorageService fileStorage;
    private final FileLinkRepository fileLinkRepo;
    private final ObjectMapper objectMapper;

    public DocumentRequestService(DocumentRepository documentRepo,
                                  DocumentRequestRepository requestRepo,
                                  FileStorageService fileStorage,
                                  FileLinkRepository fileLinkRepo,
                                  ObjectMapper objectMapper) {
        this.documentRepo = documentRepo;
        this.requestRepo = requestRepo;
        this.fileStorage = fileStorage;
        this.fileLinkRepo = fileLinkRepo;
        this.objectMapper = objectMapper;
    }

    public List<DocumentRequest> listMy(UUID userId) {
        return requestRepo.findAllByUserIdOrderByCreatedAtDesc(userId);
    }

    public DocumentRequest getMine(UUID userId, UUID requestId) {
        return requestRepo.findByIdAndUserId(requestId, userId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "REQUEST_NOT_FOUND"));
    }

    @Transactional
    public DocumentRequest createAdd(UUID userId,
                                    String userEgnFromAuth,
                                    CreateDocumentAddRequestData data,
                                    MultipartFile photo1,
                                    MultipartFile photo2) {

        if (data == null) throw new ResponseStatusException(BAD_REQUEST, "DATA_REQUIRED");
        if (data.type == null) throw new ResponseStatusException(BAD_REQUEST, "DOC_TYPE_REQUIRED");

        requireText(data.firstName, "FIRST_NAME_REQUIRED");
        requireText(data.middleName, "MIDDLE_NAME_REQUIRED");
        requireText(data.lastName, "LAST_NAME_REQUIRED");

        if (data.egn == null || !data.egn.trim().matches("^\\d{10}$")) {
            throw new ResponseStatusException(BAD_REQUEST, "EGN_INVALID");
        }

        // ✅ Пол: само male/female (без other)
        requireText(data.gender, "GENDER_REQUIRED");
        String g = data.gender.trim().toLowerCase();
        if (!(g.equals("male") || g.equals("female"))) {
            throw new ResponseStatusException(BAD_REQUEST, "GENDER_INVALID");
        }

        if (data.dob == null) throw new ResponseStatusException(BAD_REQUEST, "DOB_REQUIRED");
        if (data.validUntil == null) throw new ResponseStatusException(BAD_REQUEST, "VALID_UNTIL_REQUIRED");

        // ✅ 18+ (DOB <= today - 18y)
        LocalDate today = LocalDate.now();
        if (data.dob.isAfter(today.minusYears(18))) {
            throw new ResponseStatusException(BAD_REQUEST, "DOB_UNDER_18");
        }

        // ✅ validUntil не може да е преди днес
        if (data.validUntil.isBefore(today)) {
            throw new ResponseStatusException(BAD_REQUEST, "VALID_UNTIL_PAST");
        }

        if (data.docNumber == null || !data.docNumber.trim().matches("^\\d{9}$")) {
            throw new ResponseStatusException(BAD_REQUEST, "DOC_NUMBER_INVALID");
        }

        requireText(data.birthPlace, "BIRTH_PLACE_REQUIRED");
        requireText(data.address, "ADDRESS_REQUIRED");
        requireText(data.issuedAt, "ISSUED_AT_REQUIRED");

        // ✅ Driver license: поне 1 категория
        if (data.type == DocumentType.DRIVER_LICENSE) {
            long cnt = 0;
            if (data.categories != null) {
                cnt = data.categories.stream().filter(c -> c != null && !c.trim().isBlank()).count();
            }
            if (cnt == 0) {
                throw new ResponseStatusException(BAD_REQUEST, "CATEGORIES_REQUIRED");
            }
        }

        requireImage(photo1);
        requireImage(photo2);

        // already has approved document of type?
        if (documentRepo.existsByUserIdAndType(userId, data.type)) {
            throw new ResponseStatusException(CONFLICT, "DOCUMENT_OF_TYPE_ALREADY_EXISTS");
        }

        // already pending add of type?
        if (requestRepo.existsByUserIdAndKindAndStatusAndDocumentType(
                userId, DocumentRequestKind.ADD_DOCUMENT, DocumentRequestStatus.PENDING, data.type)) {
            throw new ResponseStatusException(CONFLICT, "PENDING_ADD_ALREADY_EXISTS");
        }

        // store images
        AppFile stored1 = fileStorage.storeUserImage(userId, photo1);
        AppFile stored2 = fileStorage.storeUserImage(userId, photo2);

        OffsetDateTime now = OffsetDateTime.now();

        ObjectNode payload = objectMapper.createObjectNode();
        payload.put("type", data.type.name());

        payload.put("firstName", data.firstName.trim());
        payload.put("middleName", data.middleName.trim());
        payload.put("lastName", data.lastName.trim());

        payload.put("egn", data.egn.trim());
        payload.put("gender", g);
        payload.put("dob", data.dob.toString());

        payload.put("validUntil", data.validUntil.toString());
        payload.put("docNumber", data.docNumber.trim());

        payload.put("birthPlace", data.birthPlace.trim());
        payload.put("address", data.address.trim());
        payload.put("issuedAt", data.issuedAt.trim());

        ArrayNode cats = objectMapper.createArrayNode();
        if (data.type == DocumentType.DRIVER_LICENSE && data.categories != null) {
            for (String c : data.categories) {
                if (c != null && !c.trim().isBlank()) cats.add(c.trim());
            }
        }
        payload.set("categories", cats);

        // UI helper labels
        payload.putObject("photo1").put("name", "Снимка 1");
        payload.putObject("photo2").put("name", "Снимка 2");

        // snapshot for admin UI
        String fullName = (data.firstName + " " + data.middleName + " " + data.lastName).trim().replaceAll("\\s+", " ");
        payload.put("userFullName", fullName);
        payload.put("userEgn", userEgnFromAuth != null ? userEgnFromAuth : data.egn.trim());

        DocumentRequest req = new DocumentRequest();
        req.setId(UUID.randomUUID());
        req.setUserId(userId);
        req.setKind(DocumentRequestKind.ADD_DOCUMENT);
        req.setStatus(DocumentRequestStatus.PENDING);
        req.setDocumentType(data.type);
        req.setDocumentId(null);
        req.setPayload(payload);
        req.setAdminNote("");
        req.setCreatedAt(now);
        req.setUpdatedAt(now);

        req = requestRepo.save(req);

        // link photos to request (важно: тези TAG/ENTITY константи ги ползват и controllers/services)
        FileLink l1 = new FileLink();
        l1.setId(UUID.randomUUID());
        l1.setEntityType(ENTITY_TYPE_DOCUMENT_REQUEST);
        l1.setEntityId(req.getId());
        l1.setTag(TAG_PHOTO_1);
        l1.setFileId(stored1.getId());
        l1.setCreatedAt(now);
        fileLinkRepo.save(l1);

        FileLink l2 = new FileLink();
        l2.setId(UUID.randomUUID());
        l2.setEntityType(ENTITY_TYPE_DOCUMENT_REQUEST);
        l2.setEntityId(req.getId());
        l2.setTag(TAG_PHOTO_2);
        l2.setFileId(stored2.getId());
        l2.setCreatedAt(now);
        fileLinkRepo.save(l2);

        return req;
    }

    @Transactional
    public DocumentRequest createRemove(UUID userId, CreateDocumentRemoveRequest body) {
        if (body == null) throw new ResponseStatusException(BAD_REQUEST, "DATA_REQUIRED");
        if (body.documentId == null) throw new ResponseStatusException(BAD_REQUEST, "DOCUMENT_ID_REQUIRED");

        var doc = documentRepo.findByIdAndUserId(body.documentId, userId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "DOCUMENT_NOT_FOUND"));

        if (requestRepo.existsByUserIdAndKindAndStatusAndDocumentId(
                userId, DocumentRequestKind.REMOVE_DOCUMENT, DocumentRequestStatus.PENDING, doc.getId())) {
            throw new ResponseStatusException(CONFLICT, "PENDING_REMOVE_ALREADY_EXISTS");
        }

        OffsetDateTime now = OffsetDateTime.now();

        ObjectNode payload = objectMapper.createObjectNode();
        payload.put("documentId", doc.getId().toString());
        payload.put("reason", body.reason == null ? "" : body.reason.trim());

        payload.put("type", doc.getType().name());
        payload.put("docNumber", doc.getDocNumber());
        payload.put("validUntil", doc.getValidUntil().toString());

        DocumentRequest req = new DocumentRequest();
        req.setId(UUID.randomUUID());
        req.setUserId(userId);
        req.setKind(DocumentRequestKind.REMOVE_DOCUMENT);
        req.setStatus(DocumentRequestStatus.PENDING);
        req.setDocumentType(null);
        req.setDocumentId(doc.getId());
        req.setPayload(payload);
        req.setAdminNote("");
        req.setCreatedAt(now);
        req.setUpdatedAt(now);

        return requestRepo.save(req);
    }

    private static void requireText(String v, String code) {
        if (v == null || v.trim().isBlank()) throw new ResponseStatusException(BAD_REQUEST, code);
    }

    private static void requireImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(BAD_REQUEST, "IMAGE_REQUIRED");
        }
        String ct = file.getContentType();
        boolean isImg = (ct != null && ct.toLowerCase().startsWith("image/"));
        if (!isImg) {
            throw new ResponseStatusException(BAD_REQUEST, "ONLY_IMAGE_ALLOWED");
        }
        boolean ok = ct.equalsIgnoreCase(MediaType.IMAGE_PNG_VALUE) || ct.equalsIgnoreCase(MediaType.IMAGE_JPEG_VALUE);
        if (!ok) {
            throw new ResponseStatusException(BAD_REQUEST, "ONLY_PNG_OR_JPG_ALLOWED");
        }
    }
}
