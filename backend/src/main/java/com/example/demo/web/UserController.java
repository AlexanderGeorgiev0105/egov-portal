package com.example.demo.web;

import java.util.UUID;

import static org.springframework.http.HttpStatus.NOT_FOUND;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.example.demo.domain.User;
import com.example.demo.dto.UserProfileResponse;
import com.example.demo.repository.UserRepository;
import com.example.demo.security.UserPrincipal;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepository;

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/me")
    public UserProfileResponse me(@AuthenticationPrincipal UserPrincipal principal) {
        UUID userId = principal.getUserId();

        User u = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "User not found"));

        UserProfileResponse r = new UserProfileResponse();
        r.id = u.getId();
        r.fullName = u.getFullName();
        r.egn = u.getEgn();
        r.gender = u.getGender();
        r.dob = u.getDob();
        r.birthPlace = u.getBirthPlace();
        r.address = u.getAddress();
        r.phone = u.getPhone();
        r.email = u.getEmail();
        r.accountStatus = u.getAccountStatus();
        return r;
    }
}
