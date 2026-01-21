package com.example.demo.web;

import java.util.List;
import java.util.UUID;

import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.example.demo.domain.PropertyRequest;
import com.example.demo.dto.AddPropertyRequestData;
import com.example.demo.dto.CreateRemovePropertyRequest;
import com.example.demo.dto.CreateSketchRequest;
import com.example.demo.dto.CreateTaxAssessmentRequest;
import com.example.demo.dto.PropertyRequestResponse;
import com.example.demo.security.UserPrincipal;
import com.example.demo.service.PropertyRequestService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/property-requests")
public class PropertyRequestController {

    private final PropertyRequestService propertyRequestService;

    public PropertyRequestController(PropertyRequestService propertyRequestService) {
        this.propertyRequestService = propertyRequestService;
    }

    @GetMapping
    public List<PropertyRequestResponse> my(@AuthenticationPrincipal UserPrincipal principal) {
        UUID userId = principal.getUserId();
        return propertyRequestService.listMy(userId).stream().map(PropertyRequestController::toDto).toList();
    }

    @PostMapping(value = "/add", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public PropertyRequestResponse add(@AuthenticationPrincipal UserPrincipal principal,
                                       @Valid @RequestPart("data") AddPropertyRequestData data,
                                       @RequestPart("ownershipDoc") MultipartFile ownershipDoc) {
        PropertyRequest req = propertyRequestService.createAddProperty(principal.getUserId(), data, ownershipDoc);
        return toDto(req);
    }

    @PostMapping("/remove")
    public PropertyRequestResponse remove(@AuthenticationPrincipal UserPrincipal principal,
                                          @Valid @RequestBody CreateRemovePropertyRequest body) {
        PropertyRequest req = propertyRequestService.createRemoveProperty(principal.getUserId(), body);
        return toDto(req);
    }

    @PostMapping("/tax-assessment")
    public PropertyRequestResponse tax(@AuthenticationPrincipal UserPrincipal principal,
                                       @Valid @RequestBody CreateTaxAssessmentRequest body) {
        PropertyRequest req = propertyRequestService.createTaxAssessment(principal.getUserId(), body);
        return toDto(req);
    }

    @PostMapping("/sketch")
    public PropertyRequestResponse sketch(@AuthenticationPrincipal UserPrincipal principal,
                                          @Valid @RequestBody CreateSketchRequest body) {
        PropertyRequest req = propertyRequestService.createSketch(principal.getUserId(), body);
        return toDto(req);
    }

    private static PropertyRequestResponse toDto(PropertyRequest r) {
        PropertyRequestResponse dto = new PropertyRequestResponse();
        dto.id = r.getId();
        dto.userId = r.getUserId();
        dto.propertyId = r.getPropertyId();
        dto.kind = r.getKind();
        dto.status = r.getStatus();
        dto.payload = r.getPayload();
        dto.adminNote = r.getAdminNote();
        dto.decidedAt = r.getDecidedAt();
        dto.decidedByAdminId = r.getDecidedByAdminId();
        dto.createdAt = r.getCreatedAt();
        dto.updatedAt = r.getUpdatedAt();
        return dto;
    }
}
