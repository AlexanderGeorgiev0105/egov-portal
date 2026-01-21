package com.example.demo.web;

import java.util.UUID;

import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import static org.springframework.http.HttpStatus.NOT_FOUND;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.example.demo.domain.AppFile;
import com.example.demo.domain.FileLink;
import com.example.demo.domain.TransportVehicle;
import com.example.demo.domain.TransportVehicleRequest;
import com.example.demo.repository.FileLinkRepository;
import com.example.demo.repository.FileRepository;
import com.example.demo.repository.TransportVehicleRepository;
import com.example.demo.repository.TransportVehicleRequestRepository;
import com.example.demo.security.UserPrincipal;
import com.example.demo.service.FileStorageService;
import com.example.demo.service.TransportVehicleRequestService;

@RestController
public class TransportFilesController {

    private final TransportVehicleRepository vehicleRepo;
    private final TransportVehicleRequestRepository requestRepo;
    private final FileLinkRepository fileLinkRepo;
    private final FileRepository fileRepo;
    private final FileStorageService storage;

    public TransportFilesController(TransportVehicleRepository vehicleRepo,
                                    TransportVehicleRequestRepository requestRepo,
                                    FileLinkRepository fileLinkRepo,
                                    FileRepository fileRepo,
                                    FileStorageService storage) {
        this.vehicleRepo = vehicleRepo;
        this.requestRepo = requestRepo;
        this.fileLinkRepo = fileLinkRepo;
        this.fileRepo = fileRepo;
        this.storage = storage;
    }

    // ----- USER: VEHICLE FILES -----

    @GetMapping("/api/transport-vehicles/{id}/registration-doc")
    public ResponseEntity<Resource> vehicleRegDoc(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        TransportVehicle v = vehicleRepo.findByIdAndUserId(id, principal.getUserId())
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "VEHICLE_NOT_FOUND"));

        return serveLinked(TransportVehicleRequestService.ENTITY_TYPE_TRANSPORT_VEHICLE, v.getId(),
                TransportVehicleRequestService.TAG_REGISTRATION_DOC);
    }

    @GetMapping("/api/transport-vehicles/{id}/tech-inspection-doc")
    public ResponseEntity<Resource> vehicleInspectionDoc(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        TransportVehicle v = vehicleRepo.findByIdAndUserId(id, principal.getUserId())
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "VEHICLE_NOT_FOUND"));

        return serveLinked(TransportVehicleRequestService.ENTITY_TYPE_TRANSPORT_VEHICLE, v.getId(),
                TransportVehicleRequestService.TAG_TECH_INSPECTION_DOC);
    }

    // ----- USER: REQUEST FILES -----

    @GetMapping("/api/transport-requests/{id}/registration-doc")
    public ResponseEntity<Resource> requestRegDoc(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        TransportVehicleRequest r = requestRepo.findByIdAndUserId(id, principal.getUserId())
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "REQUEST_NOT_FOUND"));

        return serveLinked(TransportVehicleRequestService.ENTITY_TYPE_TRANSPORT_VEHICLE_REQUEST, r.getId(),
                TransportVehicleRequestService.TAG_REGISTRATION_DOC);
    }

    @GetMapping("/api/transport-requests/{id}/tech-inspection-doc")
    public ResponseEntity<Resource> requestInspectionDoc(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        TransportVehicleRequest r = requestRepo.findByIdAndUserId(id, principal.getUserId())
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "REQUEST_NOT_FOUND"));

        return serveLinked(TransportVehicleRequestService.ENTITY_TYPE_TRANSPORT_VEHICLE_REQUEST, r.getId(),
                TransportVehicleRequestService.TAG_TECH_INSPECTION_DOC);
    }

    // ----- ADMIN: REQUEST FILES -----

    @GetMapping("/api/admin/transport-requests/{id}/registration-doc")
    public ResponseEntity<Resource> adminRequestRegDoc(@PathVariable UUID id) {
        return serveLinked(TransportVehicleRequestService.ENTITY_TYPE_TRANSPORT_VEHICLE_REQUEST, id,
                TransportVehicleRequestService.TAG_REGISTRATION_DOC);
    }

    @GetMapping("/api/admin/transport-requests/{id}/tech-inspection-doc")
    public ResponseEntity<Resource> adminRequestInspectionDoc(@PathVariable UUID id) {
        return serveLinked(TransportVehicleRequestService.ENTITY_TYPE_TRANSPORT_VEHICLE_REQUEST, id,
                TransportVehicleRequestService.TAG_TECH_INSPECTION_DOC);
    }

    private ResponseEntity<Resource> serveLinked(String entityType, UUID entityId, String tag) {
        FileLink link = fileLinkRepo.findByEntityTypeAndEntityIdAndTag(entityType, entityId, tag)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "FILE_LINK_NOT_FOUND"));

        AppFile f = fileRepo.findById(link.getFileId())
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "FILE_NOT_FOUND"));

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
}
