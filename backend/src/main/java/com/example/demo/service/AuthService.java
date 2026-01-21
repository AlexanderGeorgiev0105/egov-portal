package com.example.demo.service;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import static org.springframework.http.HttpStatus.CONFLICT;
import static org.springframework.http.HttpStatus.FORBIDDEN;
import static org.springframework.http.HttpStatus.UNAUTHORIZED;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.example.demo.domain.AccountStatus;
import com.example.demo.domain.AppFile;
import com.example.demo.domain.FileLink;
import com.example.demo.domain.User;
import com.example.demo.dto.AuthResponse;
import com.example.demo.dto.LoginRequest;
import com.example.demo.dto.RegisterRequest;
import com.example.demo.repository.FileLinkRepository;
import com.example.demo.repository.UserRepository;

@Service
public class AuthService {

    public static final String ENTITY_TYPE_USER = "USER";
    public static final String TAG_ID_CARD_FRONT = "ID_CARD_FRONT";
    public static final String TAG_ID_CARD_BACK = "ID_CARD_BACK";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final DaoAuthenticationProvider userAuthProvider; // остава, ако ти потрябва
    private final FileStorageService fileStorageService;
    private final FileLinkRepository fileLinkRepository;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       DaoAuthenticationProvider userAuthProvider,
                       FileStorageService fileStorageService,
                       FileLinkRepository fileLinkRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.userAuthProvider = userAuthProvider;
        this.fileStorageService = fileStorageService;
        this.fileLinkRepository = fileLinkRepository;
    }

    @Transactional
    public AuthResponse register(RegisterRequest req, MultipartFile idFront, MultipartFile idBack) {
        if (userRepository.existsByEgn(req.egn)) {
            throw new ResponseStatusException(CONFLICT, "EGN already exists");
        }
        if (userRepository.existsByEmail(req.email)) {
            throw new ResponseStatusException(CONFLICT, "Email already exists");
        }
        if (userRepository.existsByDocNumber(req.docNumber.trim())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "DOC_NUMBER_ALREADY_EXISTS");
        }
        if (userRepository.existsByPhone(req.phone.trim())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "PHONE_ALREADY_EXISTS");
        }

        // Require exactly two images
        if (idFront == null || idFront.isEmpty() || idBack == null || idBack.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ID_CARD_IMAGES_REQUIRED");
        }

        User u = new User();
        u.setId(UUID.randomUUID());
        u.setFullName(req.fullName.trim());
        u.setEgn(req.egn.trim());
        u.setGender(req.gender.trim());
        u.setDob(LocalDate.parse(req.dob));
        u.setDocNumber(req.docNumber.trim());
        u.setDocValidUntil(LocalDate.parse(req.docValidUntil));
        u.setIssuedAt(req.issuedAt.trim());
        u.setBirthPlace(req.birthPlace.trim());
        u.setAddress(req.address.trim());
        u.setPhone(req.phone.trim());
        u.setEmail(req.email.trim().toLowerCase());
        u.setPasswordHash(passwordEncoder.encode(req.password));
        u.setAccountStatus(AccountStatus.PENDING);

        OffsetDateTime now = OffsetDateTime.now();
        u.setCreatedAt(now);
        u.setUpdatedAt(now);

        userRepository.save(u);

        // Store files + create links
        AppFile frontFile = fileStorageService.storeUserImage(u.getId(), idFront);
        AppFile backFile = fileStorageService.storeUserImage(u.getId(), idBack);

        FileLink frontLink = new FileLink();
        frontLink.setId(UUID.randomUUID());
        frontLink.setFileId(frontFile.getId());
        frontLink.setEntityType(ENTITY_TYPE_USER);
        frontLink.setEntityId(u.getId());
        frontLink.setTag(TAG_ID_CARD_FRONT);
        frontLink.setCreatedAt(OffsetDateTime.now());
        fileLinkRepository.save(frontLink);

        FileLink backLink = new FileLink();
        backLink.setId(UUID.randomUUID());
        backLink.setFileId(backFile.getId());
        backLink.setEntityType(ENTITY_TYPE_USER);
        backLink.setEntityId(u.getId());
        backLink.setTag(TAG_ID_CARD_BACK);
        backLink.setCreatedAt(OffsetDateTime.now());
        fileLinkRepository.save(backLink);

        return AuthResponse.user(u.getId(), u.getAccountStatus(), u.getFullName());
    }

    public AuthResponse loginUser(LoginRequest req) {
        String egn = req.identifier.trim();

        User u = userRepository.findByEgn(egn)
                .orElseThrow(() -> new ResponseStatusException(UNAUTHORIZED, "Invalid credentials"));

        if (!passwordEncoder.matches(req.password, u.getPasswordHash())) {
            throw new ResponseStatusException(UNAUTHORIZED, "Invalid credentials");
        }

        if (u.getAccountStatus() != AccountStatus.ACTIVE) {
            throw new ResponseStatusException(FORBIDDEN, "Account pending approval");
        }

        return AuthResponse.user(u.getId(), u.getAccountStatus(), u.getFullName());
    }
}
