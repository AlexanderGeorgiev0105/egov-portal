package com.example.demo.service;

import java.time.OffsetDateTime;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.domain.HealthUserProfile;
import com.example.demo.repository.HealthUserProfileRepository;

@Service
public class HealthProfileService {

    private final HealthUserProfileRepository profileRepo;

    public HealthProfileService(HealthUserProfileRepository profileRepo) {
        this.profileRepo = profileRepo;
    }

    public HealthUserProfile getOrNull(UUID userId) {
        return profileRepo.findById(userId).orElse(null);
    }

    @Transactional
    public HealthUserProfile ensureExists(UUID userId) {
        return profileRepo.findById(userId).orElseGet(() -> {
            HealthUserProfile p = new HealthUserProfile();
            OffsetDateTime now = OffsetDateTime.now();
            p.setUserId(userId);
            p.setCreatedAt(now);
            p.setUpdatedAt(now);
            return profileRepo.save(p);
        });
    }
}
