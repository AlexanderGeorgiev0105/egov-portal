package com.example.demo.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.domain.AppFile;

public interface FileRepository extends JpaRepository<AppFile, UUID> {
    List<AppFile> findAllByOwnerUserId(UUID ownerUserId);
}
