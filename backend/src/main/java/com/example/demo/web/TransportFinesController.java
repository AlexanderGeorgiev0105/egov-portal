package com.example.demo.web;

import java.util.List;
import java.util.UUID;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.domain.TransportFine;
import com.example.demo.dto.TransportFineResponse;
import com.example.demo.security.UserPrincipal;
import com.example.demo.service.TransportFineService;

@RestController
@RequestMapping("/api/transport-fines")
public class TransportFinesController {

    private final TransportFineService fineService;

    public TransportFinesController(TransportFineService fineService) {
        this.fineService = fineService;
    }

    @GetMapping
    public List<TransportFineResponse> my(@AuthenticationPrincipal UserPrincipal principal) {
        String egn = principal.getUsername();
        return fineService.listMy(egn).stream().map(TransportFinesController::toDto).toList();
    }

    @PatchMapping("/{id}/pay")
    public TransportFineResponse pay(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        TransportFine f = fineService.pay(principal.getUsername(), id);
        return toDto(f);
    }

    private static TransportFineResponse toDto(TransportFine f) {
        TransportFineResponse dto = new TransportFineResponse();
        dto.id = f.getId();
        dto.userId = f.getUserId();
        dto.egn = f.getEgn();
        dto.type = f.getType();
        dto.amount = f.getAmount();
        dto.issuedAt = f.getIssuedAt();
        dto.paid = f.isPaid();
        dto.paidAt = f.getPaidAt();
        dto.createdAt = f.getCreatedAt();
        dto.updatedAt = f.getUpdatedAt();
        return dto;
    }
}
