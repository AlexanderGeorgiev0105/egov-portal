package com.example.demo.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.domain.Admin;

public interface AdminRepository extends JpaRepository<Admin, UUID> {
    Optional<Admin> findByUsername(String username);
}
