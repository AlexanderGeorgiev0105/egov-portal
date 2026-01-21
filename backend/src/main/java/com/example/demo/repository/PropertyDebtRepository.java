package com.example.demo.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.domain.PropertyDebt;

public interface PropertyDebtRepository extends JpaRepository<PropertyDebt, UUID> {
    List<PropertyDebt> findAllByPropertyIdOrderByYearDesc(UUID propertyId);
    Optional<PropertyDebt> findByPropertyIdAndYear(UUID propertyId, int year);
}
