package com.example.demo.web;

import java.util.List;
import java.util.UUID;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.domain.Property;
import com.example.demo.domain.PropertyDebt;
import com.example.demo.domain.PropertySketch;
import com.example.demo.domain.PropertyTaxAssessment;
import com.example.demo.dto.PropertyDebtResponse;
import com.example.demo.dto.PropertyResponse;
import com.example.demo.dto.PropertySketchResponse;
import com.example.demo.dto.PropertyTaxAssessmentResponse;
import com.example.demo.security.UserPrincipal;
import com.example.demo.service.PropertyService;

@RestController
@RequestMapping("/api/properties")
public class PropertyController {

    private final PropertyService propertyService;

    public PropertyController(PropertyService propertyService) {
        this.propertyService = propertyService;
    }

    @GetMapping
    public List<PropertyResponse> listMine(@AuthenticationPrincipal UserPrincipal principal) {
        UUID userId = principal.getUserId();
        return propertyService.listMyActive(userId).stream().map(PropertyController::toDto).toList();
    }

    @GetMapping("/{id}")
    public PropertyResponse getMine(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        Property p = propertyService.getMyProperty(principal.getUserId(), id);
        return toDto(p);
    }

    @GetMapping("/{id}/tax-assessment")
    public PropertyTaxAssessmentResponse getTax(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        PropertyTaxAssessment t = propertyService.getMyTax(principal.getUserId(), id);
        return toDto(t);
    }

    @GetMapping("/{id}/sketch")
    public PropertySketchResponse getSketch(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        PropertySketch s = propertyService.getMySketch(principal.getUserId(), id);
        return toDto(s);
    }

    @GetMapping("/{id}/debts")
    public List<PropertyDebtResponse> debts(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        List<PropertyDebt> list = propertyService.getOrCreateDebts(principal.getUserId(), id);
        return list.stream().map(PropertyController::toDto).toList();
    }

    @PatchMapping("/{id}/debts/{year}/pay")
    public PropertyDebtResponse pay(@PathVariable UUID id,
                                   @PathVariable int year,
                                   @RequestParam String kind,
                                   @AuthenticationPrincipal UserPrincipal principal) {
        PropertyDebt d = propertyService.pay(principal.getUserId(), id, year, kind);
        return toDto(d);
    }

    private static PropertyResponse toDto(Property p) {
        PropertyResponse r = new PropertyResponse();
        r.id = p.getId();
        r.type = p.getType();
        r.oblast = p.getOblast();
        r.place = p.getPlace();
        r.address = p.getAddress();
        r.areaSqm = p.getAreaSqm();
        r.purchaseYear = p.getPurchaseYear();
        r.isActive = p.isActive();
        r.deactivatedAt = p.getDeactivatedAt();
        r.createdAt = p.getCreatedAt();
        r.updatedAt = p.getUpdatedAt();
        return r;
    }

    private static PropertyTaxAssessmentResponse toDto(PropertyTaxAssessment t) {
        PropertyTaxAssessmentResponse r = new PropertyTaxAssessmentResponse();
        r.id = t.getId();
        r.propertyId = t.getPropertyId();
        r.requestId = t.getRequestId();
        r.neighborhood = t.getNeighborhood();
        r.purpose = t.getPurpose();
        r.purposeOther = t.getPurposeOther();
        r.hasAdjoiningParts = t.isHasAdjoiningParts();
        r.price = t.getPrice();
        r.yearlyTax = t.getYearlyTax();
        r.trashFee = t.getTrashFee();
        r.approvedAt = t.getApprovedAt();
        r.approvedByAdminId = t.getApprovedByAdminId();
        r.createdAt = t.getCreatedAt();
        return r;
    }

    private static PropertySketchResponse toDto(PropertySketch s) {
        PropertySketchResponse r = new PropertySketchResponse();
        r.id = s.getId();
        r.propertyId = s.getPropertyId();
        r.requestId = s.getRequestId();
        r.docType = s.getDocType();
        r.termDays = s.getTermDays();
        r.approvedAt = s.getApprovedAt();
        r.approvedByAdminId = s.getApprovedByAdminId();
        r.createdAt = s.getCreatedAt();
        return r;
    }

    private static PropertyDebtResponse toDto(PropertyDebt d) {
        PropertyDebtResponse r = new PropertyDebtResponse();
        r.id = d.getId();
        r.propertyId = d.getPropertyId();
        r.year = d.getYear();
        r.dueDate = d.getDueDate();

        r.yearlyTaxAmount = d.getYearlyTaxAmount();
        r.yearlyTaxIsPaid = d.isYearlyTaxPaid();
        r.yearlyTaxPaidAt = d.getYearlyTaxPaidAt();

        r.trashFeeAmount = d.getTrashFeeAmount();
        r.trashFeeIsPaid = d.isTrashFeePaid();
        r.trashFeePaidAt = d.getTrashFeePaidAt();

        r.createdAt = d.getCreatedAt();
        r.updatedAt = d.getUpdatedAt();
        return r;
    }
}
