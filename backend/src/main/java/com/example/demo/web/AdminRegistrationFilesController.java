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
import com.example.demo.service.FileStorageService;

@RestController
@RequestMapping("/api/admin/registrations")
public class AdminRegistrationFilesController {

    public static final String ENTITY_TYPE_USER = "USER";
    public static final String TAG_ID_CARD_FRONT = "ID_CARD_FRONT";
    public static final String TAG_ID_CARD_BACK = "ID_CARD_BACK";

    private final FileLinkRepository fileLinkRepository;
    private final FileRepository fileRepository;
    private final FileStorageService fileStorageService;

    public AdminRegistrationFilesController(FileLinkRepository fileLinkRepository,
                                           FileRepository fileRepository,
                                           FileStorageService fileStorageService) {
        this.fileLinkRepository = fileLinkRepository;
        this.fileRepository = fileRepository;
        this.fileStorageService = fileStorageService;
    }

    @GetMapping("/{userId}/id-card/front")
    public ResponseEntity<Resource> getIdCardFront(@PathVariable UUID userId) {
        return serveLinkedFile(userId, TAG_ID_CARD_FRONT);
    }

    @GetMapping("/{userId}/id-card/back")
    public ResponseEntity<Resource> getIdCardBack(@PathVariable UUID userId) {
        return serveLinkedFile(userId, TAG_ID_CARD_BACK);
    }

    private ResponseEntity<Resource> serveLinkedFile(UUID userId, String tag) {
        FileLink link = fileLinkRepository
                .findByEntityTypeAndEntityIdAndTag(ENTITY_TYPE_USER, userId, tag)
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
        if (name == null || name.isBlank()) return "image";
        return name.replace('"', '_');
    }
}
