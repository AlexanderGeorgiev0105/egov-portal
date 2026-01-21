package com.example.demo.service;

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
import com.example.demo.domain.FileLink;
import com.example.demo.domain.Property;
import com.example.demo.domain.PropertyRequest;
import com.example.demo.domain.PropertyRequestKind;
import com.example.demo.domain.PropertyRequestStatus;
import com.example.demo.dto.AddPropertyRequestData;
import com.example.demo.dto.CreateRemovePropertyRequest;
import com.example.demo.dto.CreateSketchRequest;
import com.example.demo.dto.CreateTaxAssessmentRequest;
import com.example.demo.repository.FileLinkRepository;
import com.example.demo.repository.PropertyRepository;
import com.example.demo.repository.PropertyRequestRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

@Service
public class PropertyRequestService {

    public static final String ENTITY_TYPE_PROPERTY_REQUEST = "PROPERTY_REQUEST";
    public static final String TAG_OWNERSHIP_DOC = "OWNERSHIP_DOC";

    private final PropertyRequestRepository propertyRequestRepository;
    private final PropertyRepository propertyRepository;
    private final FileLinkRepository fileLinkRepository;
    private final FileStorageService fileStorageService;
    private final ObjectMapper objectMapper;

    public PropertyRequestService(PropertyRequestRepository propertyRequestRepository,
                                  PropertyRepository propertyRepository,
                                  FileLinkRepository fileLinkRepository,
                                  FileStorageService fileStorageService,
                                  ObjectMapper objectMapper) {
        this.propertyRequestRepository = propertyRequestRepository;
        this.propertyRepository = propertyRepository;
        this.fileLinkRepository = fileLinkRepository;
        this.fileStorageService = fileStorageService;
        this.objectMapper = objectMapper;
    }

    public List<PropertyRequest> listMy(UUID userId) {
        return propertyRequestRepository.findAllByUserIdOrderByCreatedAtDesc(userId);
    }

    public PropertyRequest getMine(UUID userId, UUID requestId) {
        return propertyRequestRepository.findByIdAndUserId(requestId, userId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "REQUEST_NOT_FOUND"));
    }

    @Transactional
    public PropertyRequest createAddProperty(UUID userId, AddPropertyRequestData data, MultipartFile ownershipDocPdf) {
        if (ownershipDocPdf == null || ownershipDocPdf.isEmpty()) {
            throw new ResponseStatusException(BAD_REQUEST, "OWNERSHIP_DOC_REQUIRED");
        }
        requirePdf(ownershipDocPdf);

        if (data == null) {
            throw new ResponseStatusException(BAD_REQUEST, "DATA_REQUIRED");
        }
        if (data.type == null || data.type.isBlank()) {
            throw new ResponseStatusException(BAD_REQUEST, "TYPE_REQUIRED");
        }
        if (data.oblast == null || data.oblast.isBlank()) {
            throw new ResponseStatusException(BAD_REQUEST, "OBLAST_REQUIRED");
        }
        if (data.place == null || data.place.isBlank()) {
            throw new ResponseStatusException(BAD_REQUEST, "PLACE_REQUIRED");
        }
        if (data.address == null || data.address.isBlank()) {
            throw new ResponseStatusException(BAD_REQUEST, "ADDRESS_REQUIRED");
        }
        if (data.areaSqm == null || data.areaSqm <= 0) {
            throw new ResponseStatusException(BAD_REQUEST, "AREA_REQUIRED");
        }
        if (data.purchaseYear == null || data.purchaseYear < 1900 || data.purchaseYear > 2100) {
            throw new ResponseStatusException(BAD_REQUEST, "PURCHASE_YEAR_INVALID");
        }

        if (propertyRequestRepository.existsByUserIdAndKindAndStatus(userId, PropertyRequestKind.ADD_PROPERTY, PropertyRequestStatus.PENDING)) {
            throw new ResponseStatusException(CONFLICT, "PENDING_ADD_ALREADY_EXISTS");
        }

        // Store ownership doc as PDF
        AppFile pdf = fileStorageService.storeUserPdf(userId, ownershipDocPdf);

        ObjectNode payload = objectMapper.createObjectNode();
        payload.put("type", data.type);
        payload.put("oblast", data.oblast);
        payload.put("place", data.place);
        payload.put("address", data.address);
        payload.put("areaSqm", data.areaSqm);
        payload.put("purchaseYear", data.purchaseYear);

        PropertyRequest req = new PropertyRequest();
        req.setId(UUID.randomUUID());
        req.setUserId(userId);
        req.setPropertyId(null);
        req.setKind(PropertyRequestKind.ADD_PROPERTY);
        req.setStatus(PropertyRequestStatus.PENDING);
        req.setPayload(payload);

        OffsetDateTime now = OffsetDateTime.now();
        req.setCreatedAt(now);
        req.setUpdatedAt(now);

        req = propertyRequestRepository.save(req);

        // Link the PDF to request
        FileLink link = new FileLink();
        link.setId(UUID.randomUUID());
        link.setEntityType(ENTITY_TYPE_PROPERTY_REQUEST);
        link.setEntityId(req.getId());
        link.setTag(TAG_OWNERSHIP_DOC);
        link.setFileId(pdf.getId());
        link.setCreatedAt(now);

        fileLinkRepository.save(link);

        return req;
    }

    @Transactional
    public PropertyRequest createRemoveProperty(UUID userId, CreateRemovePropertyRequest body) {
        Property p = propertyRepository.findByIdAndOwnerUserId(body.propertyId, userId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "PROPERTY_NOT_FOUND"));

        if (!p.isActive()) {
            throw new ResponseStatusException(BAD_REQUEST, "PROPERTY_ALREADY_INACTIVE");
        }

        if (propertyRequestRepository.existsByPropertyIdAndKindAndStatus(p.getId(), PropertyRequestKind.REMOVE_PROPERTY, PropertyRequestStatus.PENDING)) {
            throw new ResponseStatusException(CONFLICT, "PENDING_REMOVE_ALREADY_EXISTS");
        }

        ObjectNode payload = objectMapper.createObjectNode();
        payload.put("propertyId", p.getId().toString());

        // snapshot fields for admin UI
        payload.put("type", p.getType());
        payload.put("oblast", p.getOblast());
        payload.put("place", p.getPlace());
        payload.put("address", p.getAddress());
        payload.put("areaSqm", p.getAreaSqm());
        payload.put("purchaseYear", p.getPurchaseYear());
        // show document column for all kinds
        payload.putObject("ownershipDoc").put("name", "Документ (PDF)");
        // optional reason (shown in admin details)
        payload.put("reason", body.reason == null ? "" : body.reason);

        PropertyRequest req = new PropertyRequest();
        req.setId(UUID.randomUUID());
        req.setUserId(userId);
        req.setPropertyId(p.getId());
        req.setKind(PropertyRequestKind.REMOVE_PROPERTY);
        req.setStatus(PropertyRequestStatus.PENDING);
        req.setPayload(payload);

        OffsetDateTime now = OffsetDateTime.now();
        req.setCreatedAt(now);
        req.setUpdatedAt(now);

        return propertyRequestRepository.save(req);
    }

    @Transactional
    public PropertyRequest createTaxAssessment(UUID userId, CreateTaxAssessmentRequest body) {
        Property p = propertyRepository.findByIdAndOwnerUserId(body.propertyId, userId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "PROPERTY_NOT_FOUND"));

        if (!p.isActive()) {
            throw new ResponseStatusException(BAD_REQUEST, "PROPERTY_INACTIVE");
        }

        if (propertyRequestRepository.existsByPropertyIdAndKindAndStatus(p.getId(), PropertyRequestKind.TAX_ASSESSMENT, PropertyRequestStatus.PENDING)) {
            throw new ResponseStatusException(CONFLICT, "PENDING_TAX_ALREADY_EXISTS");
        }

        ObjectNode payload = objectMapper.createObjectNode();
        payload.put("propertyId", p.getId().toString());

        // normalize neighborhood/district naming mismatch from FE
        payload.put("neighborhood", body.neighborhood);
        payload.put("district", body.neighborhood);

        payload.put("purpose", body.purpose);
        if (body.purposeOther != null) payload.put("purposeOther", body.purposeOther);

        payload.put("hasAdjParts", body.hasAdjParts);

        // snapshot fields for admin UI
        payload.put("type", p.getType());
        payload.put("oblast", p.getOblast());
        payload.put("place", p.getPlace());
        payload.put("address", p.getAddress());
        payload.put("purchaseYear", p.getPurchaseYear());
        payload.put("areaSqm", p.getAreaSqm());
        payload.putObject("ownershipDoc").put("name", "Документ (PDF)");

        PropertyRequest req = new PropertyRequest();
        req.setId(UUID.randomUUID());
        req.setUserId(userId);
        req.setPropertyId(p.getId());
        req.setKind(PropertyRequestKind.TAX_ASSESSMENT);
        req.setStatus(PropertyRequestStatus.PENDING);
        req.setPayload(payload);

        OffsetDateTime now = OffsetDateTime.now();
        req.setCreatedAt(now);
        req.setUpdatedAt(now);

        return propertyRequestRepository.save(req);
    }

    @Transactional
    public PropertyRequest createSketch(UUID userId, CreateSketchRequest body) {
        Property p = propertyRepository.findByIdAndOwnerUserId(body.propertyId, userId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "PROPERTY_NOT_FOUND"));

        if (!p.isActive()) {
            throw new ResponseStatusException(BAD_REQUEST, "PROPERTY_INACTIVE");
        }

        if (propertyRequestRepository.existsByPropertyIdAndKindAndStatus(p.getId(), PropertyRequestKind.SKETCH, PropertyRequestStatus.PENDING)) {
            throw new ResponseStatusException(CONFLICT, "PENDING_SKETCH_ALREADY_EXISTS");
        }

        ObjectNode payload = objectMapper.createObjectNode();
        payload.put("propertyId", p.getId().toString());
        payload.put("docType", body.docType);

        int termDays = body.termDays != null ? body.termDays : 7;
        if (termDays != 3 && termDays != 7) {
            throw new ResponseStatusException(BAD_REQUEST, "TERM_DAYS_MUST_BE_3_OR_7");
        }

        payload.put("termDays", termDays);
        payload.put("term", termDays == 3 ? "fast" : "standard");

        // snapshot fields for admin UI
        payload.put("type", p.getType());
        payload.put("oblast", p.getOblast());
        payload.put("place", p.getPlace());
        payload.put("address", p.getAddress());
        payload.put("areaSqm", p.getAreaSqm());
        payload.put("purchaseYear", p.getPurchaseYear());
        payload.putObject("ownershipDoc").put("name", "Документ (PDF)");

        PropertyRequest req = new PropertyRequest();
        req.setId(UUID.randomUUID());
        req.setUserId(userId);
        req.setPropertyId(p.getId());
        req.setKind(PropertyRequestKind.SKETCH);
        req.setStatus(PropertyRequestStatus.PENDING);
        req.setPayload(payload);

        OffsetDateTime now = OffsetDateTime.now();
        req.setCreatedAt(now);
        req.setUpdatedAt(now);

        return propertyRequestRepository.save(req);
    }

    public static void requirePdf(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(BAD_REQUEST, "PDF_REQUIRED");
        }
        String ct = file.getContentType();
        boolean isPdf = (ct != null && ct.equalsIgnoreCase(MediaType.APPLICATION_PDF_VALUE))
                || (file.getOriginalFilename() != null && file.getOriginalFilename().toLowerCase().endsWith(".pdf"));
        if (!isPdf) {
            throw new ResponseStatusException(BAD_REQUEST, "ONLY_PDF_ALLOWED");
        }
    }
}
