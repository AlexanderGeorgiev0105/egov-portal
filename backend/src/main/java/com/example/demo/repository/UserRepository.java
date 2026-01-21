package com.example.demo.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.domain.AccountStatus;
import com.example.demo.domain.User;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEgn(String egn);
    boolean existsByEgn(String egn);
    boolean existsByEmail(String email);
    boolean existsByDocNumber(String docNumber);
    boolean existsByPhone(String phone);


    List<User> findByAccountStatusOrderByCreatedAtDesc(AccountStatus status);
}
