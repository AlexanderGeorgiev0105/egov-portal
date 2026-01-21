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
import org.springframework.web.server.ResponseStatusException;

import com.example.demo.domain.FileLink;
import com.example.demo.domain.TransportVehicle;
import com.example.demo.domain.TransportVehicleRequest;
import com.example.demo.domain.TransportVehicleRequestStatus;
import com.example.demo.repository.FileLinkRepository;
import com.example.demo.repository.TransportVehicleRepository;
import com.example.demo.repository.TransportVehicleRequestRepository;
import com.fasterxml.jackson.databind.JsonNode;

@Service
public class AdminTransportRequestService {

    public static final String ENTITY_TYPE_TRANSPORT_VEHICLE = TransportVehicleRequestService.ENTITY_TYPE_TRANSPORT_VEHICLE;
    public static final String ENTITY_TYPE_TRANSPORT_VEHICLE_REQUEST = TransportVehicleRequestService.ENTITY_TYPE_TRANSPORT_VEHICLE_REQUEST;

    public static final String TAG_REGISTRATION_DOC = TransportVehicleRequestService.TAG_REGISTRATION_DOC;
    public static final String TAG_TECH_INSPECTION_DOC = TransportVehicleRequestService.TAG_TECH_INSPECTION_DOC;

    private final TransportVehicleRequestRepository requestRepo;
    private final TransportVehicleRepository vehicleRepo;
    private final FileLinkRepository fileLinkRepo;

    public AdminTransportRequestService(TransportVehicleRequestRepository requestRepo,
                                       TransportVehicleRepository vehicleRepo,
                                       FileLinkRepository fileLinkRepo) {
        this.requestRepo = requestRepo;
        this.vehicleRepo = vehicleRepo;
        this.fileLinkRepo = fileLinkRepo;
    }

    public List<TransportVehicleRequest> listAllNonRejected() {
        return requestRepo.findAllByStatusNotOrderByCreatedAtDesc(TransportVehicleRequestStatus.REJECTED);
    }

    public TransportVehicleRequest get(UUID id) {
        return requestRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "REQUEST_NOT_FOUND"));
    }

    @Transactional
    public TransportVehicleRequest reject(UUID requestId, UUID adminId, String note) {
        TransportVehicleRequest req = get(requestId);

        if (req.getStatus() != TransportVehicleRequestStatus.PENDING) {
            throw new ResponseStatusException(CONFLICT, "REQUEST_ALREADY_DECIDED");
        }

        req.setStatus(TransportVehicleRequestStatus.REJECTED);
        req.setAdminNote(note == null ? "" : note);
        req.setDecidedAt(OffsetDateTime.now());
        req.setDecidedByAdminId(adminId);
        req.setUpdatedAt(OffsetDateTime.now());

        return requestRepo.save(req);
    }

    @Transactional
    public TransportVehicleRequest approve(UUID requestId, UUID adminId, String note) {
        TransportVehicleRequest req = get(requestId);

        if (req.getStatus() != TransportVehicleRequestStatus.PENDING) {
            throw new ResponseStatusException(CONFLICT, "REQUEST_ALREADY_DECIDED");
        }

        switch (req.getKind()) {
            case ADD_VEHICLE -> approveAddVehicle(req);
            case TECH_INSPECTION -> approveTechInspection(req);
            default -> throw new ResponseStatusException(BAD_REQUEST, "UNSUPPORTED_KIND");
        }

        req.setStatus(TransportVehicleRequestStatus.APPROVED);
        req.setAdminNote(note == null ? "" : note);
        req.setDecidedAt(OffsetDateTime.now());
        req.setDecidedByAdminId(adminId);
        req.setUpdatedAt(OffsetDateTime.now());

        return requestRepo.save(req);
    }

    private void approveAddVehicle(TransportVehicleRequest req) {
        JsonNode p = req.getPayload();

        String reg = req.getRegNumber();
        if (reg == null || reg.isBlank()) {
            reg = p.path("regNumber").asText("");
        }
        if (reg.isBlank()) throw new ResponseStatusException(BAD_REQUEST, "REG_NUMBER_REQUIRED");

        TransportVehicle v = new TransportVehicle();
        v.setId(UUID.randomUUID());
        v.setUserId(req.getUserId());
        v.setOwnerEgn(req.getOwnerEgn());
        v.setRegNumber(reg);

        v.setBrand(p.path("brand").asText(""));
        v.setModel(p.path("model").asText(""));
        v.setManufactureYear(p.path("manufactureYear").asInt(0));
        v.setPowerKw(p.path("powerKw").asInt(0));
        v.setEuroCategory(p.path("euroCategory").asText(""));

        OffsetDateTime now = OffsetDateTime.now();
        v.setCreatedAt(now);
        v.setUpdatedAt(now);

        vehicleRepo.save(v);

        // copy registration doc link from request -> vehicle
        FileLink reqLink = fileLinkRepo
                .findByEntityTypeAndEntityIdAndTag(ENTITY_TYPE_TRANSPORT_VEHICLE_REQUEST, req.getId(), TAG_REGISTRATION_DOC)
                .orElse(null);

        if (reqLink != null) {
            fileLinkRepo.deleteByEntityTypeAndEntityIdAndTag(ENTITY_TYPE_TRANSPORT_VEHICLE, v.getId(), TAG_REGISTRATION_DOC);

            FileLink newLink = new FileLink();
            newLink.setId(UUID.randomUUID());
            newLink.setFileId(reqLink.getFileId());
            newLink.setEntityType(ENTITY_TYPE_TRANSPORT_VEHICLE);
            newLink.setEntityId(v.getId());
            newLink.setTag(TAG_REGISTRATION_DOC);
            newLink.setCreatedAt(OffsetDateTime.now());

            fileLinkRepo.save(newLink);
        }

        // set vehicle_id on request for traceability
        req.setVehicleId(v.getId());
    }

    private void approveTechInspection(TransportVehicleRequest req) {
        UUID vehicleId = req.getVehicleId();
        if (vehicleId == null) {
            String vid = req.getPayload().path("vehicleId").asText(null);
            if (vid != null && !vid.isBlank()) vehicleId = UUID.fromString(vid);
        }
        if (vehicleId == null) throw new ResponseStatusException(BAD_REQUEST, "VEHICLE_ID_REQUIRED");

        TransportVehicle v = vehicleRepo.findById(vehicleId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "VEHICLE_NOT_FOUND"));

        JsonNode p = req.getPayload();
        LocalDate inspectionDate = LocalDate.parse(p.path("inspectionDate").asText(LocalDate.now().toString()));
        LocalDate validUntil = LocalDate.parse(p.path("validUntil").asText(inspectionDate.plusYears(1).toString()));

        v.setTechInspectionDate(inspectionDate);
        v.setTechInspectionValidUntil(validUntil);
        v.setTechInspectionApprovedAt(OffsetDateTime.now());
        v.setUpdatedAt(OffsetDateTime.now());
        vehicleRepo.save(v);

        // copy inspection doc link from request -> vehicle
        FileLink reqLink = fileLinkRepo
                .findByEntityTypeAndEntityIdAndTag(ENTITY_TYPE_TRANSPORT_VEHICLE_REQUEST, req.getId(), TAG_TECH_INSPECTION_DOC)
                .orElse(null);

        if (reqLink != null) {
            fileLinkRepo.deleteByEntityTypeAndEntityIdAndTag(ENTITY_TYPE_TRANSPORT_VEHICLE, v.getId(), TAG_TECH_INSPECTION_DOC);

            FileLink newLink = new FileLink();
            newLink.setId(UUID.randomUUID());
            newLink.setFileId(reqLink.getFileId());
            newLink.setEntityType(ENTITY_TYPE_TRANSPORT_VEHICLE);
            newLink.setEntityId(v.getId());
            newLink.setTag(TAG_TECH_INSPECTION_DOC);
            newLink.setCreatedAt(OffsetDateTime.now());

            fileLinkRepo.save(newLink);
        }
    }
}
