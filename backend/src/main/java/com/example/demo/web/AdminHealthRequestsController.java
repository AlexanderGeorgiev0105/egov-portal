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
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.example.demo.domain.AppFile;
import com.example.demo.domain.HealthRequest;
import com.example.demo.domain.HealthRequestStatus;
import com.example.demo.domain.User;
import com.example.demo.dto.HealthRequestResponse;
import com.example.demo.repository.UserRepository;
import com.example.demo.security.AdminPrincipal;
import com.example.demo.service.AdminHealthRequestService;
import com.example.demo.service.FileStorageService;
import com.example.demo.service.HealthReferralService;

@RestController
@RequestMapping("/api/admin/health-requests")
public class AdminHealthRequestsController {

    private final AdminHealthRequestService adminService;
    private final UserRepository userRepository;
    private final FileStorageService storage;
    private final HealthReferralService referralService;

    public AdminHealthRequestsController(AdminHealthRequestService adminService,
                                         UserRepository userRepository,
                                         FileStorageService storage,
                                         HealthReferralService referralService) {
        this.adminService = adminService;
        this.userRepository = userRepository;
        this.storage = storage;
        this.referralService = referralService;
    }

    @GetMapping
    public List<HealthRequestResponse> list(@RequestParam(required = false) HealthRequestStatus status,
                                           @AuthenticationPrincipal AdminPrincipal admin) {
        List<HealthRequest> list = adminService.listAll(status == null ? null : status.name());
        return list.stream().map(this::toDto).toList();
    }

    @GetMapping("/{id}")
    public HealthRequestResponse get(@PathVariable UUID id, @AuthenticationPrincipal AdminPrincipal admin) {
        return toDto(adminService.get(id));
    }

    public static class NoteBody {
        public String adminNote;
        public String note; // allow both names
    }

    @PatchMapping("/{id}/approve")
    public HealthRequestResponse approve(@PathVariable UUID id,
                                         @AuthenticationPrincipal AdminPrincipal admin,
                                         @RequestParam(defaultValue = "") String note,
                                         @RequestBody(required = false) NoteBody body) {
        String finalNote = pickNote(note, body);
        HealthRequest r = adminService.approve(id, admin.getAdminId(), finalNote);
        return toDto(r);
    }

    @PatchMapping("/{id}/reject")
    public HealthRequestResponse reject(@PathVariable UUID id,
                                        @AuthenticationPrincipal AdminPrincipal admin,
                                        @RequestParam(defaultValue = "") String note,
                                        @RequestBody(required = false) NoteBody body) {
        String finalNote = pickNote(note, body);
        HealthRequest r = adminService.reject(id, admin.getAdminId(), finalNote);
        return toDto(r);
    }

    // Files (Admin) for request
    @GetMapping("/{id}/booklet-image")
    public ResponseEntity<Resource> bookletImage(@PathVariable UUID id, @AuthenticationPrincipal AdminPrincipal admin) {
        AppFile f = adminService.getRequestFile(id, AdminHealthRequestService.TAG_BOOKLET_IMAGE);
        return serveFileInline(f);
    }

    @GetMapping("/{id}/referral/pdf")
    public ResponseEntity<Resource> referralPdf(@PathVariable UUID id, @AuthenticationPrincipal AdminPrincipal admin) {
        AppFile f = adminService.getRequestFile(id, AdminHealthRequestService.TAG_REFERRAL_PDF);
        return serveFileInline(f);
    }

    // Optional: direct referral PDF by referralId (Admin)
    @GetMapping("/referrals/{referralId}/pdf")
    public ResponseEntity<Resource> referralPdfByReferralId(@PathVariable UUID referralId,
                                                            @AuthenticationPrincipal AdminPrincipal admin) {
        AppFile f = referralService.getReferralPdf(referralId);
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

    private static String pickNote(String noteParam, NoteBody body) {
        if (body == null) return noteParam == null ? "" : noteParam;
        if (body.adminNote != null) return body.adminNote;
        if (body.note != null) return body.note;
        return noteParam == null ? "" : noteParam;
    }

    private HealthRequestResponse toDto(HealthRequest r) {
        HealthRequestResponse dto = HealthRequestController.toDto(r);

        User u = userRepository.findById(r.getUserId()).orElse(null);
        if (u != null) {
            dto.userEgn = u.getEgn();
            dto.userFullName = u.getFullName();
        }
        return dto;
    }
}
