package com.example.demo.web;

import java.util.List;
import java.util.UUID;

import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.example.demo.domain.PropertyRequest;
import com.example.demo.domain.PropertyRequestStatus;
import com.example.demo.domain.User;
import com.example.demo.dto.PropertyRequestResponse;
import com.example.demo.repository.UserRepository;
import com.example.demo.security.AdminPrincipal;
import com.example.demo.service.AdminPropertyRequestService;

@RestController
@RequestMapping("/api/admin/property-requests")
public class AdminPropertyRequestsController {

    private final AdminPropertyRequestService adminService;
    private final UserRepository userRepository;

    public AdminPropertyRequestsController(AdminPropertyRequestService adminService, UserRepository userRepository) {
        this.adminService = adminService;
        this.userRepository = userRepository;
    }

    @GetMapping
    public List<PropertyRequestResponse> list(@RequestParam(required = false) PropertyRequestStatus status) {
        List<PropertyRequest> list = adminService.listAllNonRejected();
        if (status != null) {
            list = list.stream().filter(r -> r.getStatus() == status).toList();
        }
        return list.stream().map(this::toDto).toList();
    }

    @GetMapping("/{id}")
    public PropertyRequestResponse get(@PathVariable UUID id) {
        return toDto(adminService.get(id));
    }

    @PatchMapping("/{id}/approve")
    public PropertyRequestResponse approve(@PathVariable UUID id,
                                           @AuthenticationPrincipal AdminPrincipal admin,
                                           @RequestParam(defaultValue = "") String note) {
        PropertyRequest r = adminService.approve(id, admin.getAdminId(), note);
        return toDto(r);
    }

    public static class NoteBody {
        public String note;
    }

    @PatchMapping("/{id}/reject")
    public PropertyRequestResponse reject(@PathVariable UUID id,
                                          @AuthenticationPrincipal AdminPrincipal admin,
                                          @RequestParam(defaultValue = "") String note,
                                          @RequestBody(required = false) NoteBody body) {
        String finalNote = (body != null && body.note != null) ? body.note : note;
        PropertyRequest r = adminService.reject(id, admin.getAdminId(), finalNote == null ? "" : finalNote);
        return toDto(r);
    }

    // Frontend uses POST multipart. Keep PATCH too for compatibility.
    @PostMapping(value = "/{id}/approve-sketch", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public PropertyRequestResponse approveSketchPost(@PathVariable UUID id,
                                                     @AuthenticationPrincipal AdminPrincipal admin,
                                                     @RequestParam(defaultValue = "") String note,
                                                     @RequestPart("pdf") MultipartFile pdf) {
        PropertyRequest r = adminService.approveSketch(id, admin.getAdminId(), note, pdf);
        return toDto(r);
    }

    @PatchMapping(value = "/{id}/approve-sketch", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public PropertyRequestResponse approveSketchPatch(@PathVariable UUID id,
                                                      @AuthenticationPrincipal AdminPrincipal admin,
                                                      @RequestParam(defaultValue = "") String note,
                                                      @RequestPart("pdf") MultipartFile pdf) {
        return approveSketchPost(id, admin, note, pdf);
    }

    private PropertyRequestResponse toDto(PropertyRequest r) {
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

        User u = userRepository.findById(r.getUserId()).orElse(null);
        if (u != null) {
            dto.userEgn = u.getEgn();
            dto.userFullName = u.getFullName();
        }

        return dto;
    }
}
