package com.example.demo.web;

import java.util.List;
import java.util.UUID;

import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.example.demo.domain.TransportVehicleRequest;
import com.example.demo.dto.TransportAddVehicleRequestData;
import com.example.demo.dto.TransportTechInspectionRequestData;
import com.example.demo.dto.TransportVehicleRequestResponse;
import com.example.demo.security.UserPrincipal;
import com.example.demo.service.TransportVehicleRequestService;

@RestController
@RequestMapping("/api/transport-requests")
public class TransportVehicleRequestsController {

    private final TransportVehicleRequestService requestService;

    public TransportVehicleRequestsController(TransportVehicleRequestService requestService) {
        this.requestService = requestService;
    }

    @GetMapping
    public List<TransportVehicleRequestResponse> my(@AuthenticationPrincipal UserPrincipal principal) {
        UUID userId = principal.getUserId();
        return requestService.listMy(userId).stream().map(TransportVehicleRequestsController::toDto).toList();
    }

    @GetMapping("/{id}")
    public TransportVehicleRequestResponse get(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        TransportVehicleRequest r = requestService.getMine(principal.getUserId(), id);
        return toDto(r);
    }

    @PostMapping(value = "/add-vehicle", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public TransportVehicleRequestResponse addVehicle(@AuthenticationPrincipal UserPrincipal principal,
                                                      @RequestPart("data") TransportAddVehicleRequestData data,
                                                      @RequestPart("registrationDoc") MultipartFile registrationDoc) {
        String egn = principal.getUsername();
        TransportVehicleRequest r = requestService.createAddVehicle(principal.getUserId(), egn, data, registrationDoc);
        return toDto(r);
    }

    @PostMapping(value = "/tech-inspection", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public TransportVehicleRequestResponse techInspection(@AuthenticationPrincipal UserPrincipal principal,
                                                          @RequestPart("data") TransportTechInspectionRequestData data,
                                                          @RequestPart("inspectionDoc") MultipartFile inspectionDoc) {
        String egn = principal.getUsername();
        TransportVehicleRequest r = requestService.createTechInspection(principal.getUserId(), egn, data, inspectionDoc);
        return toDto(r);
    }

    private static TransportVehicleRequestResponse toDto(TransportVehicleRequest r) {
        TransportVehicleRequestResponse dto = new TransportVehicleRequestResponse();
        dto.id = r.getId();
        dto.userId = r.getUserId();
        dto.ownerEgn = r.getOwnerEgn();
        dto.kind = r.getKind();
        dto.status = r.getStatus();
        dto.regNumber = r.getRegNumber();
        dto.vehicleId = r.getVehicleId();
        dto.payload = r.getPayload();
        dto.adminNote = r.getAdminNote();
        dto.decidedAt = r.getDecidedAt();
        dto.decidedByAdminId = r.getDecidedByAdminId();
        dto.createdAt = r.getCreatedAt();
        dto.updatedAt = r.getUpdatedAt();
        return dto;
    }
}
