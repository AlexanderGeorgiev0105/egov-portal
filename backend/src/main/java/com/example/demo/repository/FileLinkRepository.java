package com.example.demo.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.domain.FileLink;

public interface FileLinkRepository extends JpaRepository<FileLink, UUID> {
    Optional<FileLink> findByEntityTypeAndEntityIdAndTag(String entityType, UUID entityId, String tag);

    @Transactional
    void deleteByEntityTypeAndEntityIdAndTag(String entityType, UUID entityId, String tag);
}
