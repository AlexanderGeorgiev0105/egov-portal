package com.example.demo.service;

import java.time.LocalDate;
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
import com.example.demo.domain.TransportVehicle;
import com.example.demo.domain.TransportVehicleRequest;
import com.example.demo.domain.TransportVehicleRequestKind;
import com.example.demo.domain.TransportVehicleRequestStatus;
import com.example.demo.dto.TransportAddVehicleRequestData;
import com.example.demo.dto.TransportTechInspectionRequestData;
import com.example.demo.repository.FileLinkRepository;
import com.example.demo.repository.TransportVehicleRepository;
import com.example.demo.repository.TransportVehicleRequestRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

@Service
public class TransportVehicleRequestService {

    public static final String ENTITY_TYPE_TRANSPORT_VEHICLE = "TRANSPORT_VEHICLE";
    public static final String ENTITY_TYPE_TRANSPORT_VEHICLE_REQUEST = "TRANSPORT_VEHICLE_REQUEST";

    public static final String TAG_REGISTRATION_DOC = "REGISTRATION_DOC";
    public static final String TAG_TECH_INSPECTION_DOC = "TECH_INSPECTION_DOC";

    private final TransportVehicleRequestRepository requestRepo;
    private final TransportVehicleRepository vehicleRepo;
    private final FileStorageService fileStorage;
    private final FileLinkRepository fileLinkRepo;
    private final ObjectMapper objectMapper;

    public TransportVehicleRequestService(TransportVehicleRequestRepository requestRepo,
                                         TransportVehicleRepository vehicleRepo,
                                         FileStorageService fileStorage,
                                         FileLinkRepository fileLinkRepo,
                                         ObjectMapper objectMapper) {
        this.requestRepo = requestRepo;
        this.vehicleRepo = vehicleRepo;
        this.fileStorage = fileStorage;
        this.fileLinkRepo = fileLinkRepo;
        this.objectMapper = objectMapper;
    }

    public List<TransportVehicleRequest> listMy(UUID userId) {
        return requestRepo.findAllByUserIdOrderByCreatedAtDesc(userId);
    }

    public TransportVehicleRequest getMine(UUID userId, UUID requestId) {
        return requestRepo.findByIdAndUserId(requestId, userId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "REQUEST_NOT_FOUND"));
    }

    @Transactional
    public TransportVehicleRequest createAddVehicle(UUID userId, String ownerEgn, TransportAddVehicleRequestData data, MultipartFile registrationDocPdf) {
        if (data == null) throw new ResponseStatusException(BAD_REQUEST, "DATA_REQUIRED");

        String reg = normalizeReg(data.regNumber);
        if (reg.isBlank()) throw new ResponseStatusException(BAD_REQUEST, "REG_NUMBER_REQUIRED");
        if (data.brand == null || data.brand.trim().isBlank()) throw new ResponseStatusException(BAD_REQUEST, "BRAND_REQUIRED");
        if (data.model == null || data.model.trim().isBlank()) throw new ResponseStatusException(BAD_REQUEST, "MODEL_REQUIRED");
        if (data.manufactureYear == null || data.manufactureYear < 1900 || data.manufactureYear > 2100)
            throw new ResponseStatusException(BAD_REQUEST, "MANUFACTURE_YEAR_INVALID");
        if (data.powerKw == null || data.powerKw <= 0 || data.powerKw > 2000)
            throw new ResponseStatusException(BAD_REQUEST, "POWER_KW_INVALID");
        if (data.euroCategory == null || data.euroCategory.trim().isBlank())
            throw new ResponseStatusException(BAD_REQUEST, "EURO_CATEGORY_REQUIRED");

        // pdf required
        PropertyRequestService.requirePdf(registrationDocPdf);

        // already approved vehicle?
        if (vehicleRepo.existsByRegNumberIgnoreCase(reg)) {
            throw new ResponseStatusException(CONFLICT, "VEHICLE_WITH_REG_ALREADY_EXISTS");
        }

        // already pending request?
        if (requestRepo.existsByKindAndStatusAndRegNumberIgnoreCase(
                TransportVehicleRequestKind.ADD_VEHICLE, TransportVehicleRequestStatus.PENDING, reg)) {
            throw new ResponseStatusException(CONFLICT, "PENDING_ADD_ALREADY_EXISTS");
        }

        // store pdf
        AppFile stored = fileStorage.storeUserPdf(userId, registrationDocPdf);
        OffsetDateTime now = OffsetDateTime.now();

        ObjectNode payload = objectMapper.createObjectNode();
        payload.put("regNumber", reg);
        payload.put("brand", data.brand.trim());
        payload.put("model", data.model.trim());
        payload.put("manufactureYear", data.manufactureYear);
        payload.put("powerKw", data.powerKw);
        payload.put("euroCategory", data.euroCategory.trim());

        // admin UI convenience
        payload.putObject("registrationDoc").put("name", "Документ (PDF)");

        TransportVehicleRequest req = new TransportVehicleRequest();
        req.setId(UUID.randomUUID());
        req.setUserId(userId);
        req.setOwnerEgn(ownerEgn);
        req.setKind(TransportVehicleRequestKind.ADD_VEHICLE);
        req.setStatus(TransportVehicleRequestStatus.PENDING);
        req.setRegNumber(reg);
        req.setVehicleId(null);
        req.setPayload(payload);
        req.setCreatedAt(now);
        req.setUpdatedAt(now);

        req = requestRepo.save(req);

        FileLink link = new FileLink();
        link.setId(UUID.randomUUID());
        link.setEntityType(ENTITY_TYPE_TRANSPORT_VEHICLE_REQUEST);
        link.setEntityId(req.getId());
        link.setTag(TAG_REGISTRATION_DOC);
        link.setFileId(stored.getId());
        link.setCreatedAt(now);

        fileLinkRepo.save(link);

        return req;
    }

    @Transactional
    public TransportVehicleRequest createTechInspection(UUID userId, String ownerEgn, TransportTechInspectionRequestData data, MultipartFile inspectionDocPdf) {
        if (data == null) throw new ResponseStatusException(BAD_REQUEST, "DATA_REQUIRED");
        if (data.vehicleId == null) throw new ResponseStatusException(BAD_REQUEST, "VEHICLE_ID_REQUIRED");
        if (data.inspectionDate == null) throw new ResponseStatusException(BAD_REQUEST, "INSPECTION_DATE_REQUIRED");

        PropertyRequestService.requirePdf(inspectionDocPdf);

        TransportVehicle v = vehicleRepo.findByIdAndUserId(data.vehicleId, userId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "VEHICLE_NOT_FOUND"));

        // only one pending inspection request per vehicle
        if (requestRepo.existsByKindAndStatusAndVehicleId(
                TransportVehicleRequestKind.TECH_INSPECTION, TransportVehicleRequestStatus.PENDING, v.getId())) {
            throw new ResponseStatusException(CONFLICT, "PENDING_TECH_ALREADY_EXISTS");
        }

        AppFile stored = fileStorage.storeUserPdf(userId, inspectionDocPdf);
        OffsetDateTime now = OffsetDateTime.now();

        LocalDate inspection = data.inspectionDate;
        LocalDate validUntil = inspection.plusYears(1);

        ObjectNode payload = objectMapper.createObjectNode();
        payload.put("vehicleId", v.getId().toString());
        payload.put("inspectionDate", inspection.toString());
        payload.put("validUntil", validUntil.toString());

        // snapshot fields for admin table/details
        payload.put("regNumber", v.getRegNumber());
        payload.put("brand", v.getBrand());
        payload.put("model", v.getModel());
        payload.putObject("inspectionDoc").put("name", "Документ (PDF)");

        TransportVehicleRequest req = new TransportVehicleRequest();
        req.setId(UUID.randomUUID());
        req.setUserId(userId);
        req.setOwnerEgn(ownerEgn);
        req.setKind(TransportVehicleRequestKind.TECH_INSPECTION);
        req.setStatus(TransportVehicleRequestStatus.PENDING);
        req.setVehicleId(v.getId());
        req.setRegNumber(null);
        req.setPayload(payload);
        req.setCreatedAt(now);
        req.setUpdatedAt(now);

        req = requestRepo.save(req);

        FileLink link = new FileLink();
        link.setId(UUID.randomUUID());
        link.setEntityType(ENTITY_TYPE_TRANSPORT_VEHICLE_REQUEST);
        link.setEntityId(req.getId());
        link.setTag(TAG_TECH_INSPECTION_DOC);
        link.setFileId(stored.getId());
        link.setCreatedAt(now);

        fileLinkRepo.save(link);

        return req;
    }

    private static String normalizeReg(String in) {
        if (in == null) return "";
        // FE expects uppercase, no spaces
        return in.trim().replaceAll("\\s+", "").toUpperCase();
    }
}
