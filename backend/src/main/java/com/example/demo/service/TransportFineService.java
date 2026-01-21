package com.example.demo.service;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import static org.springframework.http.HttpStatus.CONFLICT;
import static org.springframework.http.HttpStatus.NOT_FOUND;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.example.demo.domain.TransportFine;
import com.example.demo.repository.TransportFineRepository;

@Service
public class TransportFineService {

    private final TransportFineRepository fineRepo;

    public TransportFineService(TransportFineRepository fineRepo) {
        this.fineRepo = fineRepo;
    }

    public List<TransportFine> listMy(String egn) {
        return fineRepo.findAllByEgnOrderByIssuedAtDesc(egn);
    }

    @Transactional
    public TransportFine pay(String egn, UUID fineId) {
        TransportFine f = fineRepo.findByIdAndEgn(fineId, egn)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "FINE_NOT_FOUND"));

        if (f.isPaid()) {
            throw new ResponseStatusException(CONFLICT, "FINE_ALREADY_PAID");
        }

        OffsetDateTime now = OffsetDateTime.now();
        f.setPaid(true);
        f.setPaidAt(now);
        f.setUpdatedAt(now);

        return fineRepo.save(f);
    }
}
