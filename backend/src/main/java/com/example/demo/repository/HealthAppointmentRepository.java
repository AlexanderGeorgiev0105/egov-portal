package com.example.demo.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.domain.HealthAppointment;

public interface HealthAppointmentRepository extends JpaRepository<HealthAppointment, UUID> {

    List<HealthAppointment> findAllByUserIdOrderByApptDateDescApptTimeDesc(UUID userId);

    List<HealthAppointment> findAllByDoctorPracticeNumberAndApptDateOrderByApptTimeAsc(String doctorPracticeNumber, LocalDate apptDate);

    Optional<HealthAppointment> findByIdAndUserId(UUID id, UUID userId);
}
