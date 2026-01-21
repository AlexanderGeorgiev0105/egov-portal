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
import com.example.demo.domain.Document;
import com.example.demo.domain.DocumentRequest;
import com.example.demo.domain.FileLink;
import com.example.demo.repository.DocumentRepository;
import com.example.demo.repository.DocumentRequestRepository;
import com.example.demo.repository.FileLinkRepository;
import com.example.demo.repository.FileRepository;
import com.example.demo.security.UserPrincipal;
import com.example.demo.service.DocumentRequestService;
import com.example.demo.service.FileStorageService;

@RestController
@RequestMapping("/api")
public class DocumentFilesController {

    private final DocumentRepository documentRepo;
    private final DocumentRequestRepository requestRepo;

    private final FileLinkRepository fileLinkRepo;
    private final FileRepository fileRepo;
    private final FileStorageService storage;

    public DocumentFilesController(DocumentRepository documentRepo,
                                   DocumentRequestRepository requestRepo,
                                   FileLinkRepository fileLinkRepo,
                                   FileRepository fileRepo,
                                   FileStorageService storage) {
        this.documentRepo = documentRepo;
        this.requestRepo = requestRepo;
        this.fileLinkRepo = fileLinkRepo;
        this.fileRepo = fileRepo;
        this.storage = storage;
    }

    // ---- approved documents ----

    @GetMapping("/documents/{id}/photo-1")
    public ResponseEntity<Resource> docPhoto1(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        Document d = documentRepo.findByIdAndUserId(id, principal.getUserId())
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "DOCUMENT_NOT_FOUND"));
        return serveLinked(DocumentRequestService.ENTITY_TYPE_DOCUMENT, d.getId(), DocumentRequestService.TAG_PHOTO_1);
    }

    @GetMapping("/documents/{id}/photo-2")
    public ResponseEntity<Resource> docPhoto2(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        Document d = documentRepo.findByIdAndUserId(id, principal.getUserId())
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "DOCUMENT_NOT_FOUND"));
        return serveLinked(DocumentRequestService.ENTITY_TYPE_DOCUMENT, d.getId(), DocumentRequestService.TAG_PHOTO_2);
    }

    // ---- requests ----

    @GetMapping("/document-requests/{id}/photo-1")
    public ResponseEntity<Resource> reqPhoto1(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        DocumentRequest r = requestRepo.findByIdAndUserId(id, principal.getUserId())
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "REQUEST_NOT_FOUND"));
        return serveLinked(DocumentRequestService.ENTITY_TYPE_DOCUMENT_REQUEST, r.getId(), DocumentRequestService.TAG_PHOTO_1);
    }

    @GetMapping("/document-requests/{id}/photo-2")
    public ResponseEntity<Resource> reqPhoto2(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        DocumentRequest r = requestRepo.findByIdAndUserId(id, principal.getUserId())
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "REQUEST_NOT_FOUND"));
        return serveLinked(DocumentRequestService.ENTITY_TYPE_DOCUMENT_REQUEST, r.getId(), DocumentRequestService.TAG_PHOTO_2);
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
