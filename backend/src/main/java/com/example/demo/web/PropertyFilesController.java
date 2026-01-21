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
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.example.demo.domain.AppFile;
import com.example.demo.domain.FileLink;
import com.example.demo.domain.Property;
import com.example.demo.repository.FileLinkRepository;
import com.example.demo.repository.FileRepository;
import com.example.demo.repository.PropertyRepository;
import com.example.demo.security.UserPrincipal;
import com.example.demo.service.AdminPropertyRequestService;
import com.example.demo.service.FileStorageService;

@RestController
@RequestMapping("/api/properties")
public class PropertyFilesController {

    private final PropertyRepository propertyRepo;
    private final FileLinkRepository fileLinkRepo;
    private final FileRepository fileRepo;
    private final FileStorageService storage;

    public PropertyFilesController(PropertyRepository propertyRepo,
                                   FileLinkRepository fileLinkRepo,
                                   FileRepository fileRepo,
                                   FileStorageService storage) {
        this.propertyRepo = propertyRepo;
        this.fileLinkRepo = fileLinkRepo;
        this.fileRepo = fileRepo;
        this.storage = storage;
    }

    @GetMapping("/{id}/ownership-doc")
    public ResponseEntity<Resource> ownershipDoc(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        Property p = propertyRepo.findByIdAndOwnerUserId(id, principal.getUserId())
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "PROPERTY_NOT_FOUND"));

        return serveLinked(AdminPropertyRequestService.ENTITY_TYPE_PROPERTY, p.getId(), AdminPropertyRequestService.TAG_OWNERSHIP_DOC);
    }

    @GetMapping("/{id}/sketch/pdf")
    public ResponseEntity<Resource> sketchPdf(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        Property p = propertyRepo.findByIdAndOwnerUserId(id, principal.getUserId())
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "PROPERTY_NOT_FOUND"));

        return serveLinked(AdminPropertyRequestService.ENTITY_TYPE_PROPERTY, p.getId(), AdminPropertyRequestService.TAG_SKETCH_PDF);
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
