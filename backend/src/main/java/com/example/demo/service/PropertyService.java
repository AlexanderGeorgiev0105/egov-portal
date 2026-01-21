package com.example.demo.service;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.NOT_FOUND;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.example.demo.domain.Property;
import com.example.demo.domain.PropertyDebt;
import com.example.demo.domain.PropertySketch;
import com.example.demo.domain.PropertyTaxAssessment;
import com.example.demo.repository.PropertyDebtRepository;
import com.example.demo.repository.PropertyRepository;
import com.example.demo.repository.PropertySketchRepository;
import com.example.demo.repository.PropertyTaxAssessmentRepository;

@Service
public class PropertyService {

    public static final int DEBTS_START_YEAR = 2026;

    private final PropertyRepository propertyRepository;
    private final PropertyTaxAssessmentRepository taxRepo;
    private final PropertyDebtRepository debtRepo;
    private final PropertySketchRepository sketchRepo;

    public PropertyService(PropertyRepository propertyRepository,
                           PropertyTaxAssessmentRepository taxRepo,
                           PropertyDebtRepository debtRepo,
                           PropertySketchRepository sketchRepo) {
        this.propertyRepository = propertyRepository;
        this.taxRepo = taxRepo;
        this.debtRepo = debtRepo;
        this.sketchRepo = sketchRepo;
    }

    public List<Property> listMyActive(UUID userId) {
        return propertyRepository.findAllByOwnerUserIdAndActiveOrderByCreatedAtDesc(userId, true);
    }

    public Property getMyProperty(UUID userId, UUID propertyId) {
        return propertyRepository.findByIdAndOwnerUserId(propertyId, userId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "PROPERTY_NOT_FOUND"));
    }

    public PropertyTaxAssessment getMyTax(UUID userId, UUID propertyId) {
        Property p = getMyProperty(userId, propertyId);
        return taxRepo.findByPropertyId(p.getId())
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "TAX_ASSESSMENT_NOT_FOUND"));
    }

    public PropertySketch getMySketch(UUID userId, UUID propertyId) {
        Property p = getMyProperty(userId, propertyId);
        return sketchRepo.findByPropertyId(p.getId())
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "SKETCH_NOT_FOUND"));
    }

    /**
     * Ensures debts exist from 2026..currentYear, using latest tax assessment amounts.
     */
    @Transactional
    public List<PropertyDebt> getOrCreateDebts(UUID userId, UUID propertyId) {
        Property p = getMyProperty(userId, propertyId);

        PropertyTaxAssessment tax = taxRepo.findByPropertyId(p.getId())
                .orElseThrow(() -> new ResponseStatusException(BAD_REQUEST, "TAX_ASSESSMENT_REQUIRED_FOR_DEBTS"));

        int currentYear = LocalDate.now().getYear();
        OffsetDateTime now = OffsetDateTime.now();

        for (int year = DEBTS_START_YEAR; year <= currentYear; year++) {
            var existing = debtRepo.findByPropertyIdAndYear(p.getId(), year);
            if (existing.isPresent()) continue;

            PropertyDebt d = new PropertyDebt();
            d.setId(UUID.randomUUID());
            d.setPropertyId(p.getId());
            d.setYear(year);
            d.setDueDate(LocalDate.of(year, 1, 5));
            d.setYearlyTaxAmount(tax.getYearlyTax());
            d.setTrashFeeAmount(tax.getTrashFee());
            d.setCreatedAt(now);
            d.setUpdatedAt(now);

            debtRepo.save(d);
        }

        return debtRepo.findAllByPropertyIdOrderByYearDesc(p.getId());
    }

    @Transactional
    public PropertyDebt pay(UUID userId, UUID propertyId, int year, String kind) {
        Property p = getMyProperty(userId, propertyId);

        PropertyDebt d = debtRepo.findByPropertyIdAndYear(p.getId(), year)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "DEBT_NOT_FOUND"));

        OffsetDateTime now = OffsetDateTime.now();

        if ("YEARLY_TAX".equalsIgnoreCase(kind)) {
            if (!d.isYearlyTaxPaid()) {
                d.setYearlyTaxPaid(true);
                d.setYearlyTaxPaidAt(now);
            }
        } else if ("TRASH_FEE".equalsIgnoreCase(kind)) {
            if (!d.isTrashFeePaid()) {
                d.setTrashFeePaid(true);
                d.setTrashFeePaidAt(now);
            }
        } else {
            throw new ResponseStatusException(BAD_REQUEST, "UNKNOWN_PAYMENT_KIND");
        }

        d.setUpdatedAt(now);
        return debtRepo.save(d);
    }
}
