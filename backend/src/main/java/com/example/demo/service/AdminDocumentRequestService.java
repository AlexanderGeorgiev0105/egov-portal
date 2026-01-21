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

import com.example.demo.domain.Document;
import com.example.demo.domain.DocumentRequest;
import com.example.demo.domain.DocumentRequestKind;
import com.example.demo.domain.DocumentRequestStatus;
import com.example.demo.domain.DocumentType;
import com.example.demo.domain.FileLink;
import com.example.demo.repository.DocumentRepository;
import com.example.demo.repository.DocumentRequestRepository;
import com.example.demo.repository.FileLinkRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;

@Service
public class AdminDocumentRequestService {

    public static final String ENTITY_TYPE_DOCUMENT = DocumentRequestService.ENTITY_TYPE_DOCUMENT;
    public static final String ENTITY_TYPE_DOCUMENT_REQUEST = DocumentRequestService.ENTITY_TYPE_DOCUMENT_REQUEST;

    public static final String TAG_PHOTO_1 = DocumentRequestService.TAG_PHOTO_1;
    public static final String TAG_PHOTO_2 = DocumentRequestService.TAG_PHOTO_2;

    private final DocumentRequestRepository requestRepo;
    private final DocumentRepository documentRepo;
    private final FileLinkRepository fileLinkRepo;
    private final ObjectMapper objectMapper;

    public AdminDocumentRequestService(DocumentRequestRepository requestRepo,
                                       DocumentRepository documentRepo,
                                       FileLinkRepository fileLinkRepo,
                                       ObjectMapper objectMapper) {
        this.requestRepo = requestRepo;
        this.documentRepo = documentRepo;
        this.fileLinkRepo = fileLinkRepo;
        this.objectMapper = objectMapper;
    }

    public List<DocumentRequest> listAllNonRejected() {
        return requestRepo.findAllByStatusNotOrderByCreatedAtDesc(DocumentRequestStatus.REJECTED);
    }

    public DocumentRequest get(UUID id) {
        return requestRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "REQUEST_NOT_FOUND"));
    }

    @Transactional
    public DocumentRequest reject(UUID requestId, UUID adminId, String note) {
        DocumentRequest req = get(requestId);

        if (req.getStatus() != DocumentRequestStatus.PENDING) {
            throw new ResponseStatusException(CONFLICT, "REQUEST_ALREADY_DECIDED");
        }

        req.setStatus(DocumentRequestStatus.REJECTED);
        req.setAdminNote(note == null ? "" : note);
        req.setDecidedAt(OffsetDateTime.now());
        req.setDecidedByAdminId(adminId);
        req.setUpdatedAt(OffsetDateTime.now());

        return requestRepo.save(req);
    }

    @Transactional
    public DocumentRequest approve(UUID requestId, UUID adminId, String note) {
        DocumentRequest req = get(requestId);

        if (req.getStatus() != DocumentRequestStatus.PENDING) {
            throw new ResponseStatusException(CONFLICT, "REQUEST_ALREADY_DECIDED");
        }

        UUID removeDocId = null;

        if (req.getKind() == DocumentRequestKind.ADD_DOCUMENT) {
            approveAdd(req);
        } else if (req.getKind() == DocumentRequestKind.REMOVE_DOCUMENT) {
            // 1) resolve docId now (but DO NOT delete yet)
            removeDocId = resolveRemoveDocumentId(req);
            if (removeDocId == null) {
                throw new ResponseStatusException(BAD_REQUEST, "DOCUMENT_ID_REQUIRED");
            }
            // keep it on the entity so the row is consistent before save
            req.setDocumentId(removeDocId);
        } else {
            throw new ResponseStatusException(BAD_REQUEST, "UNSUPPORTED_KIND");
        }

        // 2) mark request as APPROVED and persist FIRST (important for FK ON DELETE SET NULL)
        req.setStatus(DocumentRequestStatus.APPROVED);
        req.setAdminNote(note == null ? "" : note);
        req.setDecidedAt(OffsetDateTime.now());
        req.setDecidedByAdminId(adminId);
        req.setUpdatedAt(OffsetDateTime.now());

        req = requestRepo.save(req);
        requestRepo.flush(); // ensure DB row status is not PENDING before deleting the document

        // 3) now perform deletion for REMOVE_DOCUMENT
        if (req.getKind() == DocumentRequestKind.REMOVE_DOCUMENT) {
            performRemove(removeDocId, req.getUserId());

            // FK will set document_id to NULL; keep entity consistent too
            req.setDocumentId(null);
            req = requestRepo.save(req);
        }

        return req;
    }

    private void approveAdd(DocumentRequest req) {
        if (req.getDocumentType() == null) {
            throw new ResponseStatusException(BAD_REQUEST, "DOCUMENT_TYPE_REQUIRED");
        }

        if (documentRepo.existsByUserIdAndType(req.getUserId(), req.getDocumentType())) {
            throw new ResponseStatusException(CONFLICT, "DOCUMENT_OF_TYPE_ALREADY_EXISTS");
        }

        JsonNode p = req.getPayload();

        Document d = new Document();
        d.setId(UUID.randomUUID());
        d.setUserId(req.getUserId());
        d.setType(req.getDocumentType());

        d.setFirstName(p.path("firstName").asText(""));
        d.setMiddleName(p.path("middleName").asText(""));
        d.setLastName(p.path("lastName").asText(""));

        d.setEgn(p.path("egn").asText(""));
        d.setGender(p.path("gender").asText(""));

        try { d.setDob(java.time.LocalDate.parse(p.path("dob").asText())); }
        catch (Exception e) { throw new ResponseStatusException(BAD_REQUEST, "DOB_INVALID"); }

        try { d.setValidUntil(java.time.LocalDate.parse(p.path("validUntil").asText())); }
        catch (Exception e) { throw new ResponseStatusException(BAD_REQUEST, "VALID_UNTIL_INVALID"); }

        d.setDocNumber(p.path("docNumber").asText(""));
        d.setBirthPlace(p.path("birthPlace").asText(""));
        d.setAddress(p.path("address").asText(""));
        d.setIssuedAt(p.path("issuedAt").asText(""));

        ArrayNode cats = objectMapper.createArrayNode();
        JsonNode c = p.get("categories");
        if (c != null && c.isArray()) {
            for (JsonNode n : c) {
                if (n != null && n.isTextual()) cats.add(n.asText());
            }
        }
        d.setCategories(cats);

        OffsetDateTime now = OffsetDateTime.now();
        d.setCreatedAt(now);
        d.setUpdatedAt(now);

        documentRepo.save(d);

        FileLink req1 = fileLinkRepo.findByEntityTypeAndEntityIdAndTag(
                ENTITY_TYPE_DOCUMENT_REQUEST, req.getId(), TAG_PHOTO_1).orElse(null);
        FileLink req2 = fileLinkRepo.findByEntityTypeAndEntityIdAndTag(
                ENTITY_TYPE_DOCUMENT_REQUEST, req.getId(), TAG_PHOTO_2).orElse(null);

        if (req1 != null) {
            fileLinkRepo.deleteByEntityTypeAndEntityIdAndTag(ENTITY_TYPE_DOCUMENT, d.getId(), TAG_PHOTO_1);

            FileLink l1 = new FileLink();
            l1.setId(UUID.randomUUID());
            l1.setEntityType(ENTITY_TYPE_DOCUMENT);
            l1.setEntityId(d.getId());
            l1.setTag(TAG_PHOTO_1);
            l1.setFileId(req1.getFileId());
            l1.setCreatedAt(now);
            fileLinkRepo.save(l1);
        }

        if (req2 != null) {
            fileLinkRepo.deleteByEntityTypeAndEntityIdAndTag(ENTITY_TYPE_DOCUMENT, d.getId(), TAG_PHOTO_2);

            FileLink l2 = new FileLink();
            l2.setId(UUID.randomUUID());
            l2.setEntityType(ENTITY_TYPE_DOCUMENT);
            l2.setEntityId(d.getId());
            l2.setTag(TAG_PHOTO_2);
            l2.setFileId(req2.getFileId());
            l2.setCreatedAt(now);
            fileLinkRepo.save(l2);
        }
    }

    private UUID resolveRemoveDocumentId(DocumentRequest req) {
        // 1) from column
        UUID docId = req.getDocumentId();
        if (docId != null) return docId;

        // 2) from payload.documentId
        String fromPayload = req.getPayload().path("documentId").asText(null);
        if (fromPayload != null && !fromPayload.isBlank()) {
            try { return UUID.fromString(fromPayload); } catch (Exception ignored) {}
        }

        // 3) fallback: since FE enforces 1 doc per type per user, we can resolve by type
        String typeStr = req.getPayload().path("type").asText(null);
        if (typeStr != null && !typeStr.isBlank()) {
            try {
                DocumentType dt = DocumentType.valueOf(typeStr);
                Document d = documentRepo.findByUserIdAndType(req.getUserId(), dt)
                        .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "DOCUMENT_NOT_FOUND"));

                // optional extra safety check against docNumber snapshot
                String snapshotDocNumber = req.getPayload().path("docNumber").asText(null);
                if (snapshotDocNumber != null && !snapshotDocNumber.isBlank()
                        && d.getDocNumber() != null
                        && !snapshotDocNumber.equals(d.getDocNumber())) {
                    throw new ResponseStatusException(CONFLICT, "DOCUMENT_SNAPSHOT_MISMATCH");
                }

                return d.getId();
            } catch (IllegalArgumentException ignored) {
                // invalid type string in payload
            }
        }

        return null;
    }

    private void performRemove(UUID docId, UUID requestUserId) {
        if (docId == null) throw new ResponseStatusException(BAD_REQUEST, "DOCUMENT_ID_REQUIRED");

        Document d = documentRepo.findById(docId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "DOCUMENT_NOT_FOUND"));

        if (!d.getUserId().equals(requestUserId)) {
            throw new ResponseStatusException(CONFLICT, "DOCUMENT_OWNER_MISMATCH");
        }

        fileLinkRepo.deleteByEntityTypeAndEntityIdAndTag(ENTITY_TYPE_DOCUMENT, d.getId(), TAG_PHOTO_1);
        fileLinkRepo.deleteByEntityTypeAndEntityIdAndTag(ENTITY_TYPE_DOCUMENT, d.getId(), TAG_PHOTO_2);

        documentRepo.deleteById(d.getId());
    }
}
