package com.example.demo.web;

import java.util.List;
import java.util.UUID;

import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import static org.springframework.http.HttpStatus.NOT_FOUND;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.example.demo.domain.AppFile;
import com.example.demo.domain.HealthRequest;
import com.example.demo.dto.AddPersonalDoctorRequestData;
import com.example.demo.dto.AddReferralRequestData;
import com.example.demo.dto.HealthRequestResponse;
import com.example.demo.security.UserPrincipal;
import com.example.demo.service.FileStorageService;
import com.example.demo.service.HealthRequestService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/health-requests")
public class HealthRequestController {

    private final HealthRequestService requestService;
    private final FileStorageService storage;

    public HealthRequestController(HealthRequestService requestService, FileStorageService storage) {
        this.requestService = requestService;
        this.storage = storage;
    }

    // Like property: GET /api/health-requests => my list
    @GetMapping
    public List<HealthRequestResponse> my(@AuthenticationPrincipal UserPrincipal principal) {
        UUID userId = principal.getUserId();
        return requestService.listMy(userId).stream().map(HealthRequestController::toDto).toList();
    }

    @PostMapping(value = "/add-personal-doctor", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public HealthRequestResponse addPersonalDoctor(@AuthenticationPrincipal UserPrincipal principal,
                                                   @Valid @RequestPart("data") AddPersonalDoctorRequestData data,
                                                   @RequestPart("bookletImage") MultipartFile bookletImage) {
        HealthRequest r = requestService.createAddPersonalDoctor(principal.getUserId(), data, bookletImage);
        return toDto(r);
    }

    @PostMapping("/remove-personal-doctor")
    public HealthRequestResponse removePersonalDoctor(@AuthenticationPrincipal UserPrincipal principal,
                                                      @RequestBody(required = false) Object ignoredBody) {
        HealthRequest r = requestService.createRemovePersonalDoctor(principal.getUserId());
        return toDto(r);
    }

    @PostMapping(value = "/add-referral", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public HealthRequestResponse addReferral(@AuthenticationPrincipal UserPrincipal principal,
                                             @Valid @RequestPart("data") AddReferralRequestData data,
                                             @RequestPart("referralPdf") MultipartFile referralPdf) {
        HealthRequest r = requestService.createAddReferral(principal.getUserId(), data, referralPdf);
        return toDto(r);
    }

    // Files (User)
    @GetMapping("/{id}/booklet-image")
    public ResponseEntity<Resource> bookletImage(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        AppFile f = requestService.getMyRequestFile(principal.getUserId(), id, HealthRequestService.TAG_BOOKLET_IMAGE);
        return serveFileInline(f);
    }

    @GetMapping("/{id}/referral/pdf")
    public ResponseEntity<Resource> referralPdf(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        AppFile f = requestService.getMyRequestFile(principal.getUserId(), id, HealthRequestService.TAG_REFERRAL_PDF);
        return serveFileInline(f);
    }

    private ResponseEntity<Resource> serveFileInline(AppFile f) {
        if (f == null) throw new ResponseStatusException(NOT_FOUND, "FILE_NOT_FOUND");

        Resource res = storage.loadAsResource(f);

        MediaType mt;
        try { mt = MediaType.parseMediaType(f.getMimeType()); }
        catch (Exception e) { mt = MediaType.APPLICATION_OCTET_STREAM; }

        return ResponseEntity.ok()
                .contentType(mt)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + safeFilename(f.getOriginalName()) + "\"")
                .contentLength(f.getSizeBytes())
                .body(res);
    }

    private static String safeFilename(String name) {
        if (name == null || name.isBlank()) return "file";
        return name.replace('"', '_');
    }

    public static HealthRequestResponse toDto(HealthRequest r) {
        HealthRequestResponse dto = new HealthRequestResponse();
        dto.id = r.getId();
        dto.userId = r.getUserId();
        dto.kind = r.getKind();
        dto.status = r.getStatus();
        dto.payload = r.getPayload();
        dto.adminNote = r.getAdminNote();
        dto.decidedAt = r.getDecidedAt();
        dto.decidedByAdminId = r.getDecidedByAdminId();
        dto.createdAt = r.getCreatedAt();
        dto.updatedAt = r.getUpdatedAt();
        // userEgn/userFullName are admin-only; remain null here
        return dto;
    }
}
