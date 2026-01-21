package com.example.demo.service;

import java.math.BigDecimal;
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
import com.example.demo.domain.Property;
import com.example.demo.domain.PropertyRequest;
import com.example.demo.domain.PropertyRequestKind;
import com.example.demo.domain.PropertyRequestStatus;
import com.example.demo.domain.PropertySketch;
import com.example.demo.domain.PropertySketchDocType;
import com.example.demo.domain.PropertyTaxAssessment;
import com.example.demo.repository.FileLinkRepository;
import com.example.demo.repository.PropertyRepository;
import com.example.demo.repository.PropertyRequestRepository;
import com.example.demo.repository.PropertySketchRepository;
import com.example.demo.repository.PropertyTaxAssessmentRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class AdminPropertyRequestService {

    public static final String ENTITY_TYPE_PROPERTY = "PROPERTY";
    public static final String ENTITY_TYPE_PROPERTY_REQUEST = "PROPERTY_REQUEST";

    public static final String TAG_OWNERSHIP_DOC = "OWNERSHIP_DOC";
    public static final String TAG_SKETCH_PDF = "SKETCH_PDF";

    private final PropertyRequestRepository requestRepo;
    private final PropertyRepository propertyRepo;
    private final PropertyTaxAssessmentRepository taxRepo;
    private final PropertySketchRepository sketchRepo;

    private final FileStorageService fileStorageService;
    private final FileLinkRepository fileLinkRepo;

    private final ObjectMapper objectMapper;

    public AdminPropertyRequestService(PropertyRequestRepository requestRepo,
                                      PropertyRepository propertyRepo,
                                      PropertyTaxAssessmentRepository taxRepo,
                                      PropertySketchRepository sketchRepo,
                                      FileStorageService fileStorageService,
                                      FileLinkRepository fileLinkRepo,
                                      ObjectMapper objectMapper) {
        this.requestRepo = requestRepo;
        this.propertyRepo = propertyRepo;
        this.taxRepo = taxRepo;
        this.sketchRepo = sketchRepo;
        this.fileStorageService = fileStorageService;
        this.fileLinkRepo = fileLinkRepo;
        this.objectMapper = objectMapper;
    }

    public List<PropertyRequest> listAllNonRejected() {
        return requestRepo.findAllByStatusNotOrderByCreatedAtDesc(PropertyRequestStatus.REJECTED);
    }

    public PropertyRequest get(UUID id) {
        return requestRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "REQUEST_NOT_FOUND"));
    }

    @Transactional
    public PropertyRequest reject(UUID requestId, UUID adminId, String note) {
        PropertyRequest req = get(requestId);

        if (req.getStatus() != PropertyRequestStatus.PENDING) {
            throw new ResponseStatusException(CONFLICT, "REQUEST_ALREADY_DECIDED");
        }

        req.setStatus(PropertyRequestStatus.REJECTED);
        req.setAdminNote(note);
        req.setDecidedAt(OffsetDateTime.now());
        req.setDecidedByAdminId(adminId);
        req.setUpdatedAt(OffsetDateTime.now());

        return requestRepo.save(req);
    }

    @Transactional
    public PropertyRequest approve(UUID requestId, UUID adminId, String note) {
        PropertyRequest req = get(requestId);

        if (req.getStatus() != PropertyRequestStatus.PENDING) {
            throw new ResponseStatusException(CONFLICT, "REQUEST_ALREADY_DECIDED");
        }

        // For SKETCH we enforce approveSketch(...) with pdf
        if (req.getKind() == PropertyRequestKind.SKETCH) {
            throw new ResponseStatusException(BAD_REQUEST, "USE_APPROVE_SKETCH_ENDPOINT_WITH_PDF");
        }

        switch (req.getKind()) {
            case ADD_PROPERTY -> approveAdd(req, adminId);
            case REMOVE_PROPERTY -> approveRemove(req, adminId);
            case TAX_ASSESSMENT -> approveTax(req, adminId);
            default -> throw new ResponseStatusException(BAD_REQUEST, "UNSUPPORTED_KIND");
        }

        req.setStatus(PropertyRequestStatus.APPROVED);
        req.setAdminNote(note);
        req.setDecidedAt(OffsetDateTime.now());
        req.setDecidedByAdminId(adminId);
        req.setUpdatedAt(OffsetDateTime.now());

        return requestRepo.save(req);
    }

    @Transactional
    public PropertyRequest approveSketch(UUID requestId, UUID adminId, String note, MultipartFile pdf) {
        PropertyRequest req = get(requestId);

        if (req.getKind() != PropertyRequestKind.SKETCH) {
            throw new ResponseStatusException(BAD_REQUEST, "REQUEST_KIND_NOT_SKETCH");
        }
        if (req.getStatus() != PropertyRequestStatus.PENDING) {
            throw new ResponseStatusException(CONFLICT, "REQUEST_ALREADY_DECIDED");
        }

        PropertyRequestService.requirePdf(pdf);

        UUID propertyId = req.getPropertyId();
        if (propertyId == null) {
            throw new ResponseStatusException(BAD_REQUEST, "PROPERTY_ID_REQUIRED");
        }

        Property p = propertyRepo.findById(propertyId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "PROPERTY_NOT_FOUND"));

        JsonNode payload = req.getPayload();
        PropertySketchDocType docType = parseDocType(payload.path("docType").asText("SKICA"));
        int termDays = parseTermDays(payload);

        // create sketch row (unique per property)
        PropertySketch sketch = sketchRepo.findByPropertyId(propertyId).orElse(null);
        if (sketch == null) {
            sketch = new PropertySketch();
            sketch.setId(UUID.randomUUID());
            sketch.setPropertyId(propertyId);
            sketch.setRequestId(req.getId());
            sketch.setCreatedAt(OffsetDateTime.now());
        }
        sketch.setRequestId(req.getId());
        sketch.setDocType(docType);
        sketch.setTermDays(termDays);
        sketch.setApprovedAt(OffsetDateTime.now());
        sketch.setApprovedByAdminId(adminId);

        sketchRepo.save(sketch);

        // store pdf under owner's folder
        AppFile stored = fileStorageService.storeUserPdf(p.getOwnerUserId(), pdf);

        // overwrite property sketch link
        fileLinkRepo.deleteByEntityTypeAndEntityIdAndTag(ENTITY_TYPE_PROPERTY, propertyId, TAG_SKETCH_PDF);

        FileLink link = new FileLink();
        link.setId(UUID.randomUUID());
        link.setFileId(stored.getId());
        link.setEntityType(ENTITY_TYPE_PROPERTY);
        link.setEntityId(propertyId);
        link.setTag(TAG_SKETCH_PDF);
        link.setCreatedAt(OffsetDateTime.now());
        fileLinkRepo.save(link);

        req.setStatus(PropertyRequestStatus.APPROVED);
        req.setAdminNote(note);
        req.setDecidedAt(OffsetDateTime.now());
        req.setDecidedByAdminId(adminId);
        req.setUpdatedAt(OffsetDateTime.now());

        return requestRepo.save(req);
    }

    private void approveAdd(PropertyRequest req, UUID adminId) {
        JsonNode p = req.getPayload();

        Property prop = new Property();
        prop.setId(UUID.randomUUID());
        prop.setOwnerUserId(req.getUserId());
        prop.setType(p.path("type").asText(""));
        prop.setOblast(p.path("oblast").asText(""));
        prop.setPlace(p.path("place").asText(""));
        prop.setAddress(p.path("address").asText(""));
        prop.setAreaSqm(p.path("areaSqm").asInt(0));
        prop.setPurchaseYear(p.path("purchaseYear").asInt(0));
        prop.setActive(true);

        OffsetDateTime now = OffsetDateTime.now();
        prop.setCreatedAt(now);
        prop.setUpdatedAt(now);

        propertyRepo.save(prop);

        // attach ownership doc (copy link from request -> property)
        FileLink reqLink = fileLinkRepo
                .findByEntityTypeAndEntityIdAndTag(ENTITY_TYPE_PROPERTY_REQUEST, req.getId(), TAG_OWNERSHIP_DOC)
                .orElse(null);

        if (reqLink != null) {
            fileLinkRepo.deleteByEntityTypeAndEntityIdAndTag(ENTITY_TYPE_PROPERTY, prop.getId(), TAG_OWNERSHIP_DOC);

            FileLink propertyLink = new FileLink();
            propertyLink.setId(UUID.randomUUID());
            propertyLink.setFileId(reqLink.getFileId());
            propertyLink.setEntityType(ENTITY_TYPE_PROPERTY);
            propertyLink.setEntityId(prop.getId());
            propertyLink.setTag(TAG_OWNERSHIP_DOC);
            propertyLink.setCreatedAt(OffsetDateTime.now());
            fileLinkRepo.save(propertyLink);
        }

        // set property_id on request for traceability
        req.setPropertyId(prop.getId());
    }

    private void approveRemove(PropertyRequest req, UUID adminId) {
        UUID propertyId = req.getPropertyId();
        if (propertyId == null) throw new ResponseStatusException(BAD_REQUEST, "PROPERTY_ID_REQUIRED");

        Property p = propertyRepo.findById(propertyId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "PROPERTY_NOT_FOUND"));

        if (!p.isActive()) {
            throw new ResponseStatusException(BAD_REQUEST, "PROPERTY_ALREADY_INACTIVE");
        }

        p.setActive(false);
        p.setDeactivatedAt(OffsetDateTime.now());
        p.setUpdatedAt(OffsetDateTime.now());
        propertyRepo.save(p);
    }

    private void approveTax(PropertyRequest req, UUID adminId) {
        UUID propertyId = req.getPropertyId();
        if (propertyId == null) throw new ResponseStatusException(BAD_REQUEST, "PROPERTY_ID_REQUIRED");

        Property prop = propertyRepo.findById(propertyId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "PROPERTY_NOT_FOUND"));

        JsonNode payload = req.getPayload();

        String neighborhood = payload.path("neighborhood").asText(null);
        if (neighborhood == null || neighborhood.isBlank()) {
            neighborhood = payload.path("district").asText("");
        }

        String purpose = payload.path("purpose").asText("");
        String purposeOther = payload.path("purposeOther").asText(null);

        boolean hasParts = "Да".equalsIgnoreCase(payload.path("hasAdjParts").asText("Не"));

        // FE demo formula consistency:
        BigDecimal price = BigDecimal.valueOf(calculatePriceFromPayload(prop, payload));
        BigDecimal yearlyTax = BigDecimal.valueOf(calcYearlyTax(price.doubleValue(), purpose));
        BigDecimal trashFee = BigDecimal.valueOf(calcTrashFee(price.doubleValue(), hasParts));

        PropertyTaxAssessment tax = taxRepo.findByPropertyId(propertyId).orElse(null);
        if (tax == null) {
            tax = new PropertyTaxAssessment();
            tax.setId(UUID.randomUUID());
            tax.setPropertyId(propertyId);
            tax.setCreatedAt(OffsetDateTime.now());
        }

        tax.setRequestId(req.getId());
        tax.setNeighborhood(neighborhood);
        tax.setPurpose(purpose);
        tax.setPurposeOther(purposeOther);
        tax.setHasAdjoiningParts(hasParts);

        tax.setPrice(price.setScale(2));
        tax.setYearlyTax(yearlyTax.setScale(2));
        tax.setTrashFee(trashFee.setScale(2));

        tax.setApprovedAt(OffsetDateTime.now());
        tax.setApprovedByAdminId(adminId);

        taxRepo.save(tax);
    }

    // ---------- helpers: match FE demo calculations ----------

    private static PropertySketchDocType parseDocType(String raw) {
        try {
            return PropertySketchDocType.valueOf(raw.trim().toUpperCase());
        } catch (Exception e) {
            return PropertySketchDocType.SKICA;
        }
    }

    private static int parseTermDays(JsonNode payload) {
        int termDays = payload.path("termDays").asInt(0);
        if (termDays == 3 || termDays == 7) return termDays;

        String term = payload.path("term").asText("");
        if ("fast".equalsIgnoreCase(term)) return 3;
        return 7;
    }

    private static long calculatePriceFromPayload(Property prop, JsonNode payload) {
        int area = payload.path("areaSqm").asInt(prop.getAreaSqm());
        String type = payload.path("type").asText(prop.getType());
        String oblast = payload.path("oblast").asText(prop.getOblast());
        String district = payload.path("district").asText(payload.path("neighborhood").asText(""));

        long base = basePricePerSqmByType(type);
        double m1 = oblastMultiplier(oblast);
        double m2 = districtMultiplier(district);

        long price = Math.round(area * base * m1 * m2);
        return Math.max(1000L, price);
    }

    private static long basePricePerSqmByType(String type) {
        String t = (type == null ? "" : type).toLowerCase();
        return switch (t) {
            case "апартамент" -> 1200;
            case "къща" -> 1050;
            case "гараж" -> 520;
            case "земя" -> 180;
            default -> 900;
        };
    }

    private static double oblastMultiplier(String oblast) {
        String o = (oblast == null ? "" : oblast).toLowerCase();
        if (o.contains("софия")) return 1.6;
        if (o.contains("пловдив")) return 1.25;
        if (o.contains("варна")) return 1.25;
        if (o.contains("бургас")) return 1.2;
        return 1.0;
    }

    private static double districtMultiplier(String district) {
        String d = (district == null ? "" : district).toLowerCase();
        if (d.isBlank()) return 1.0;
        if (d.contains("цент")) return 1.2;
        if (d.contains("краен") || d.contains("край") || d.contains("кв.")) return 1.0;
        return 1.05;
    }

    private static long calcYearlyTax(double price, String purpose) {
        double mult =
                "Търговско".equalsIgnoreCase(purpose) ? 0.002 :
                "Офис".equalsIgnoreCase(purpose) ? 0.0018 :
                "Склад / Производствено".equalsIgnoreCase(purpose) ? 0.0016 :
                "Земеделско".equalsIgnoreCase(purpose) ? 0.0012 :
                "Парцел".equalsIgnoreCase(purpose) ? 0.0013 :
                "Гараж".equalsIgnoreCase(purpose) ? 0.0015 :
                "Паркомясто".equalsIgnoreCase(purpose) ? 0.0014 :
                0.0015;
        return Math.round(price * mult);
    }

    private static long calcTrashFee(double price, boolean hasParts) {
        // demo: 0.08%
        double base = price * 0.0008;
        double v = hasParts ? base * 1.1 : base;
        return Math.round(v);
    }
}
