package com.example.demo.service;

import java.util.List;
import java.util.UUID;

import static org.springframework.http.HttpStatus.NOT_FOUND;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.example.demo.domain.AppFile;
import com.example.demo.domain.FileLink;
import com.example.demo.domain.HealthReferral;
import com.example.demo.repository.FileLinkRepository;
import com.example.demo.repository.FileRepository;
import com.example.demo.repository.HealthReferralRepository;

@Service
public class HealthReferralService {

    public static final String ENTITY_TYPE_HEALTH_REFERRAL = "HEALTH_REFERRAL";
    public static final String TAG_REFERRAL_PDF = HealthRequestService.TAG_REFERRAL_PDF;

    private final HealthReferralRepository referralRepo;
    private final FileLinkRepository fileLinkRepo;
    private final FileRepository fileRepo;

    public HealthReferralService(HealthReferralRepository referralRepo,
                                 FileLinkRepository fileLinkRepo,
                                 FileRepository fileRepo) {
        this.referralRepo = referralRepo;
        this.fileLinkRepo = fileLinkRepo;
        this.fileRepo = fileRepo;
    }

    public List<HealthReferral> listMy(UUID userId) {
        return referralRepo.findAllByUserIdOrderByCreatedAtDesc(userId);
    }

    public HealthReferral getMy(UUID userId, UUID id) {
        return referralRepo.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "REFERRAL_NOT_FOUND"));
    }

    public AppFile getReferralPdf(UUID referralId) {
        FileLink link = fileLinkRepo.findByEntityTypeAndEntityIdAndTag(ENTITY_TYPE_HEALTH_REFERRAL, referralId, TAG_REFERRAL_PDF)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "FILE_NOT_FOUND"));
        return fileRepo.findById(link.getFileId())
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "FILE_NOT_FOUND"));
    }
}
