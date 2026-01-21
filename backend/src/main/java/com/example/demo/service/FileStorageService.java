package com.example.demo.service;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.OffsetDateTime;
import java.util.HexFormat;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR;
import static org.springframework.http.HttpStatus.NOT_FOUND;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.example.demo.domain.AppFile;
import com.example.demo.repository.FileRepository;

@Service
public class FileStorageService {

    public static final long MAX_IMAGE_BYTES = 25L * 1024L * 1024L; // 25MB
    public static final long MAX_PDF_BYTES   = 25L * 1024L * 1024L; // 25MB

    private final FileRepository fileRepository;
    private final Path root;

    public FileStorageService(FileRepository fileRepository,
                              @Value("${app.storage.root:uploads}") String rootDir) {
        this.fileRepository = fileRepository;
        this.root = Paths.get(rootDir).toAbsolutePath().normalize();

        try {
            Files.createDirectories(this.root);
        } catch (IOException e) {
            throw new IllegalStateException("Cannot create storage directory: " + this.root, e);
        }
    }

    /**
     * Stores an uploaded image on disk and saves metadata in DB.
     * Returns the saved AppFile.
     */
    public AppFile storeUserImage(UUID ownerUserId, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(BAD_REQUEST, "IMAGE_FILE_REQUIRED");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.toLowerCase().startsWith("image/")) {
            throw new ResponseStatusException(BAD_REQUEST, "ONLY_IMAGE_FILES_ALLOWED");
        }

        long size = file.getSize();
        if (size > MAX_IMAGE_BYTES) {
            throw new ResponseStatusException(BAD_REQUEST, "IMAGE_TOO_LARGE_MAX_25MB");
        }

        UUID fileId = UUID.randomUUID();
        String originalName = safeOriginalName(file.getOriginalFilename());

        // Save to: <root>/users/<ownerUserId>/<fileId>
        Path userDir = root.resolve("users").resolve(ownerUserId.toString());
        Path dest = userDir.resolve(fileId.toString());

        try {
            Files.createDirectories(userDir);

            String sha256 = copyAndSha256(file.getInputStream(), dest);

            AppFile meta = new AppFile();
            meta.setId(fileId);
            meta.setOwnerUserId(ownerUserId);
            meta.setOriginalName(originalName);
            meta.setMimeType(contentType);
            meta.setSizeBytes(size);
            // store relative path as storageKey
            meta.setStorageKey(root.relativize(dest).toString().replace('\\', '/'));
            meta.setSha256(sha256);
            meta.setCreatedAt(OffsetDateTime.now());

            return fileRepository.save(meta);
        } catch (IOException e) {
            throw new ResponseStatusException(INTERNAL_SERVER_ERROR, "FAILED_TO_STORE_FILE");
        }
    }

    /**
     * Stores an uploaded PDF on disk and saves metadata in DB.
     * Returns the saved AppFile.
     */
    public AppFile storeUserPdf(UUID ownerUserId, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(BAD_REQUEST, "PDF_FILE_REQUIRED");
        }

        String contentType = file.getContentType();
        boolean isPdfByMime = contentType != null && contentType.equalsIgnoreCase(MediaType.APPLICATION_PDF_VALUE);
        boolean isPdfByName = file.getOriginalFilename() != null
                && file.getOriginalFilename().toLowerCase().endsWith(".pdf");

        if (!isPdfByMime && !isPdfByName) {
            throw new ResponseStatusException(BAD_REQUEST, "ONLY_PDF_FILES_ALLOWED");
        }

        long size = file.getSize();
        if (size > MAX_PDF_BYTES) {
            throw new ResponseStatusException(BAD_REQUEST, "PDF_TOO_LARGE_MAX_25MB");
        }

        UUID fileId = UUID.randomUUID();
        String originalName = safeOriginalName(file.getOriginalFilename());

        // Save to: <root>/users/<ownerUserId>/<fileId>
        Path userDir = root.resolve("users").resolve(ownerUserId.toString());
        Path dest = userDir.resolve(fileId.toString());

        try {
            Files.createDirectories(userDir);

            String sha256 = copyAndSha256(file.getInputStream(), dest);

            AppFile meta = new AppFile();
            meta.setId(fileId);
            meta.setOwnerUserId(ownerUserId);
            meta.setOriginalName(originalName);
            meta.setMimeType(MediaType.APPLICATION_PDF_VALUE);
            meta.setSizeBytes(size);
            // store relative path as storageKey
            meta.setStorageKey(root.relativize(dest).toString().replace('\\', '/'));
            meta.setSha256(sha256);
            meta.setCreatedAt(OffsetDateTime.now());

            return fileRepository.save(meta);
        } catch (IOException e) {
            throw new ResponseStatusException(INTERNAL_SERVER_ERROR, "FAILED_TO_STORE_FILE");
        }
    }

    public Resource loadAsResource(AppFile file) {
        try {
            Path path = root.resolve(file.getStorageKey()).normalize();
            if (!Files.exists(path) || !Files.isRegularFile(path)) {
                throw new ResponseStatusException(NOT_FOUND, "FILE_NOT_FOUND");
            }
            return new UrlResource(path.toUri());
        } catch (IOException e) {
            throw new ResponseStatusException(INTERNAL_SERVER_ERROR, "FAILED_TO_READ_FILE");
        }
    }

    public void deletePhysicalIfExists(AppFile file) {
        if (file == null || file.getStorageKey() == null) return;
        try {
            Path path = root.resolve(file.getStorageKey()).normalize();
            Files.deleteIfExists(path);
        } catch (IOException ignored) {
            // ignore physical delete errors on cleanup
        }
    }

    private static String safeOriginalName(String name) {
        if (name == null) return "upload";
        return name.replace('\u0000', '_').trim();
    }

    private static String copyAndSha256(InputStream in, Path dest) throws IOException {
        MessageDigest digest;
        try {
            digest = MessageDigest.getInstance("SHA-256");
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }

        Path temp = dest.resolveSibling(dest.getFileName().toString() + ".tmp");

        try (InputStream input = in; var out = Files.newOutputStream(temp)) {
            byte[] buf = new byte[8192];
            int r;
            while ((r = input.read(buf)) != -1) {
                digest.update(buf, 0, r);
                out.write(buf, 0, r);
            }
        }

        Files.move(temp, dest, StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE);
        return HexFormat.of().formatHex(digest.digest());
    }
}
