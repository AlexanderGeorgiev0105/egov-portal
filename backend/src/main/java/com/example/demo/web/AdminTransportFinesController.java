package com.example.demo.web;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.domain.TransportFine;
import com.example.demo.dto.AdminCreateTransportFineRequest;
import com.example.demo.dto.TransportFineResponse;
import com.example.demo.service.AdminTransportFineService;

@RestController
@RequestMapping("/api/admin/transport-fines")
public class AdminTransportFinesController {

    private final AdminTransportFineService adminFineService;

    public AdminTransportFinesController(AdminTransportFineService adminFineService) {
        this.adminFineService = adminFineService;
    }

    @PostMapping
    public TransportFineResponse create(@RequestBody AdminCreateTransportFineRequest body) {
        TransportFine f = adminFineService.createFine(body.egn, body.type, body.amount);
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
