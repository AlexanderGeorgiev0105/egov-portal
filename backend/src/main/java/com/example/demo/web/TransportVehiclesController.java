package com.example.demo.web;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.domain.TransportVehicle;
import com.example.demo.domain.TransportVehicleTaxPayment;
import com.example.demo.dto.PayVehicleTaxRequest;
import com.example.demo.dto.TransportVehicleResponse;
import com.example.demo.security.UserPrincipal;
import com.example.demo.service.TransportVehicleService;

@RestController
@RequestMapping("/api/transport-vehicles")
public class TransportVehiclesController {

    private final TransportVehicleService vehicleService;

    public TransportVehiclesController(TransportVehicleService vehicleService) {
        this.vehicleService = vehicleService;
    }

    @GetMapping
    public List<TransportVehicleResponse> my(@AuthenticationPrincipal UserPrincipal principal) {
        UUID userId = principal.getUserId();
        return vehicleService.listMy(userId).stream().map(v -> toDto(v, vehicleService.listTaxPayments(v.getId()))).toList();
    }

    @GetMapping("/{id}")
    public TransportVehicleResponse get(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        TransportVehicle v = vehicleService.getMine(principal.getUserId(), id);
        List<TransportVehicleTaxPayment> payments = vehicleService.listTaxPayments(v.getId());
        return toDto(v, payments);
    }

    @PostMapping("/{id}/tax-payments")
    public TransportVehicleResponse payTax(@PathVariable UUID id,
                                          @AuthenticationPrincipal UserPrincipal principal,
                                          @RequestBody(required = false) PayVehicleTaxRequest body) {
        Integer year = body != null ? body.taxYear : null;
        vehicleService.payAnnualTax(principal.getUserId(), id, year);

        TransportVehicle v = vehicleService.getMine(principal.getUserId(), id);
        return toDto(v, vehicleService.listTaxPayments(v.getId()));
    }

    private static TransportVehicleResponse toDto(TransportVehicle v, List<TransportVehicleTaxPayment> payments) {
        TransportVehicleResponse dto = new TransportVehicleResponse();
        dto.id = v.getId();
        dto.userId = v.getUserId();
        dto.ownerEgn = v.getOwnerEgn();

        dto.regNumber = v.getRegNumber();
        dto.brand = v.getBrand();
        dto.model = v.getModel();
        dto.manufactureYear = v.getManufactureYear();
        dto.powerKw = v.getPowerKw();
        dto.euroCategory = v.getEuroCategory();

        if (v.getTechInspectionDate() != null || v.getTechInspectionValidUntil() != null) {
            TransportVehicleResponse.TechInspection ti = new TransportVehicleResponse.TechInspection();
            ti.inspectionDate = v.getTechInspectionDate();
            ti.validUntil = v.getTechInspectionValidUntil();
            ti.approvedAt = v.getTechInspectionApprovedAt();
            dto.techInspection = ti;
        } else {
            dto.techInspection = null;
        }

        Map<String, TransportVehicleResponse.VehicleTaxPayment> map = new LinkedHashMap<>();
        for (TransportVehicleTaxPayment p : payments) {
            TransportVehicleResponse.VehicleTaxPayment t = new TransportVehicleResponse.VehicleTaxPayment();
            t.year = p.getTaxYear();
            t.amount = p.getAmount() != null ? p.getAmount().doubleValue() : 0.0;
            t.paid = true;
            t.paidAt = p.getPaidAt();
            map.put(String.valueOf(p.getTaxYear()), t);
        }
        dto.taxPayments = map;

        dto.createdAt = v.getCreatedAt();
        dto.updatedAt = v.getUpdatedAt();

        return dto;
    }
}
