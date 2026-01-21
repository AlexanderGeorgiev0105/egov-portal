package com.example.demo.web;

import java.util.List;
import java.util.UUID;

import org.springframework.core.io.Resource;
import org.springframework.http.*;
import static org.springframework.http.HttpStatus.NOT_FOUND;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import com.example.demo.domain.AppFile;
import com.example.demo.domain.HealthReferral;
import com.example.demo.dto.HealthReferralResponse;
import com.example.demo.security.UserPrincipal;
import com.example.demo.service.FileStorageService;
import com.example.demo.service.HealthReferralService;

@RestController
@RequestMapping("/api/health-referrals")
public class HealthReferralsController {

    private final HealthReferralService referralService;
    private final FileStorageService storage;

    public HealthReferralsController(HealthReferralService referralService, FileStorageService storage) {
        this.referralService = referralService;
        this.storage = storage;
    }

    @GetMapping
    public List<HealthReferralResponse> my(@AuthenticationPrincipal UserPrincipal principal) {
        return referralService.listMy(principal.getUserId()).stream().map(HealthReferralsController::toDto).toList();
    }

    @GetMapping("/{id}")
    public HealthReferralResponse get(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        HealthReferral r = referralService.getMy(principal.getUserId(), id);
        return toDto(r);
    }

    @GetMapping("/{id}/pdf")
    public ResponseEntity<Resource> pdf(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        // Ensure ownership
        referralService.getMy(principal.getUserId(), id);

        AppFile f = referralService.getReferralPdf(id);
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

    private static HealthReferralResponse toDto(HealthReferral r) {
        HealthReferralResponse dto = new HealthReferralResponse();
        dto.id = r.getId();
        dto.title = r.getTitle();
        dto.sourceRequestId = r.getSourceRequestId();
        dto.createdAt = r.getCreatedAt();
        dto.updatedAt = r.getUpdatedAt();
        return dto;
    }
}
