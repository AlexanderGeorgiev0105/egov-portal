package com.example.demo.web;

import java.util.List;
import java.util.UUID;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.domain.TransportVehicleRequest;
import com.example.demo.domain.TransportVehicleRequestStatus;
import com.example.demo.domain.User;
import com.example.demo.dto.TransportVehicleRequestResponse;
import com.example.demo.repository.UserRepository;
import com.example.demo.security.AdminPrincipal;
import com.example.demo.service.AdminTransportRequestService;

@RestController
@RequestMapping("/api/admin/transport-requests")
public class AdminTransportRequestsController {

    private final AdminTransportRequestService adminService;
    private final UserRepository userRepo;

    public AdminTransportRequestsController(AdminTransportRequestService adminService, UserRepository userRepo) {
        this.adminService = adminService;
        this.userRepo = userRepo;
    }

    @GetMapping
    public List<TransportVehicleRequestResponse> list(@RequestParam(required = false) TransportVehicleRequestStatus status) {
        List<TransportVehicleRequest> list = adminService.listAllNonRejected();
        if (status != null) {
            list = list.stream().filter(r -> r.getStatus() == status).toList();
        }
        return list.stream().map(this::toDto).toList();
    }

    @GetMapping("/{id}")
    public TransportVehicleRequestResponse get(@PathVariable UUID id) {
        return toDto(adminService.get(id));
    }

    @PatchMapping("/{id}/approve")
    public TransportVehicleRequestResponse approve(@PathVariable UUID id,
                                                   @AuthenticationPrincipal AdminPrincipal admin,
                                                   @RequestParam(defaultValue = "") String note) {
        TransportVehicleRequest r = adminService.approve(id, admin.getAdminId(), note);
        return toDto(r);
    }

    public static class NoteBody { public String note; }

    @PatchMapping("/{id}/reject")
    public TransportVehicleRequestResponse reject(@PathVariable UUID id,
                                                  @AuthenticationPrincipal AdminPrincipal admin,
                                                  @RequestParam(defaultValue = "") String note,
                                                  @RequestBody(required = false) NoteBody body) {
        String finalNote = (body != null && body.note != null) ? body.note : note;
        TransportVehicleRequest r = adminService.reject(id, admin.getAdminId(), finalNote == null ? "" : finalNote);
        return toDto(r);
    }

    private TransportVehicleRequestResponse toDto(TransportVehicleRequest r) {
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

        User u = userRepo.findById(r.getUserId()).orElse(null);
        if (u != null) {
            dto.userEgn = u.getEgn();
            dto.userFullName = u.getFullName();
        }

        return dto;
    }
}
