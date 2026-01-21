package com.example.demo.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.domain.HealthDoctor;

public interface HealthDoctorRepository extends JpaRepository<HealthDoctor, UUID> {
    Optional<HealthDoctor> findByPracticeNumber(String practiceNumber);
    boolean existsByPracticeNumber(String practiceNumber);

    List<HealthDoctor> findAllByOrderByCreatedAtDesc();
}
