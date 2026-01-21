package com.example.demo.web;

import java.util.UUID;

import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import static org.springframework.http.HttpStatus.NOT_FOUND;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.example.demo.domain.AppFile;
import com.example.demo.domain.FileLink;
import com.example.demo.repository.FileLinkRepository;
import com.example.demo.repository.FileRepository;
import com.example.demo.service.AdminPropertyRequestService;
import com.example.demo.service.FileStorageService;

/**
 * Admin-only endpoints for previewing/downloading files attached to Property Requests.
 *
 * Note: We serve the file with Content-Disposition: inline, so the browser can preview it.
 */
@RestController
@RequestMapping("/api/admin/property-requests")
public class AdminPropertyRequestFilesController {

    private final FileLinkRepository fileLinkRepository;
    private final FileRepository fileRepository;
    private final FileStorageService fileStorageService;

    public AdminPropertyRequestFilesController(FileLinkRepository fileLinkRepository,
                                              FileRepository fileRepository,
                                              FileStorageService fileStorageService) {
        this.fileLinkRepository = fileLinkRepository;
        this.fileRepository = fileRepository;
        this.fileStorageService = fileStorageService;
    }

    /**
     * Ownership document uploaded by the user for ADD_PROPERTY request.
     */
    @GetMapping("/{requestId}/ownership-doc")
    public ResponseEntity<Resource> getOwnershipDoc(@PathVariable UUID requestId) {
        return serveLinkedFile(AdminPropertyRequestService.ENTITY_TYPE_PROPERTY_REQUEST,
                requestId,
                AdminPropertyRequestService.TAG_OWNERSHIP_DOC);
    }

    private ResponseEntity<Resource> serveLinkedFile(String entityType, UUID entityId, String tag) {
        FileLink link = fileLinkRepository
                .findByEntityTypeAndEntityIdAndTag(entityType, entityId, tag)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "FILE_LINK_NOT_FOUND"));

        AppFile file = fileRepository.findById(link.getFileId())
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "FILE_NOT_FOUND"));

        Resource resource = fileStorageService.loadAsResource(file);

        MediaType mt;
        try {
            mt = MediaType.parseMediaType(file.getMimeType());
        } catch (Exception e) {
            mt = MediaType.APPLICATION_OCTET_STREAM;
        }

        return ResponseEntity.ok()
                .contentType(mt)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "inline; filename=\"" + safeFilename(file.getOriginalName()) + "\"")
                .contentLength(file.getSizeBytes())
                .body(resource);
    }

    private static String safeFilename(String name) {
        if (name == null || name.isBlank()) return "file";
        return name.replace('"', '_');
    }
}
