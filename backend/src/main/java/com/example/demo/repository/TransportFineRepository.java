package com.example.demo.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.domain.TransportFine;

public interface TransportFineRepository extends JpaRepository<TransportFine, UUID> {
    List<TransportFine> findAllByEgnOrderByIssuedAtDesc(String egn);
    Optional<TransportFine> findByIdAndEgn(UUID id, String egn);
}
