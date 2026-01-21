package com.example.demo.web;

import java.util.List;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.domain.TransportVignette;
import com.example.demo.dto.CreateVignettePurchaseRequest;
import com.example.demo.dto.TransportVignetteResponse;
import com.example.demo.security.UserPrincipal;
import com.example.demo.service.TransportVignetteService;

@RestController
@RequestMapping("/api/transport-vignettes")
public class TransportVignettesController {

    private final TransportVignetteService vignetteService;

    public TransportVignettesController(TransportVignetteService vignetteService) {
        this.vignetteService = vignetteService;
    }

    @GetMapping
    public List<TransportVignetteResponse> my(@AuthenticationPrincipal UserPrincipal principal) {
        return vignetteService.listMy(principal.getUserId()).stream().map(TransportVignettesController::toDto).toList();
    }

    @PostMapping("/purchase")
    public TransportVignetteResponse purchase(@AuthenticationPrincipal UserPrincipal principal,
                                              @RequestBody CreateVignettePurchaseRequest body) {
        TransportVignette v = vignetteService.purchase(
                principal.getUserId(),
                principal.getUsername(),
                body.vehicleId,
                body.type,
                body.validFrom
        );
        return toDto(v);
    }

    private static TransportVignetteResponse toDto(TransportVignette v) {
        TransportVignetteResponse dto = new TransportVignetteResponse();
        dto.id = v.getId();
        dto.userId = v.getUserId();
        dto.ownerEgn = v.getOwnerEgn();
        dto.vehicleId = v.getVehicleId();
        dto.type = v.getType();
        dto.price = v.getPrice();
        dto.validFrom = v.getValidFrom();
        dto.validUntil = v.getValidUntil();
        dto.paidAt = v.getPaidAt();
        dto.createdAt = v.getCreatedAt();
        return dto;
    }
}
