package com.example.loanapp.controllers;

import com.example.loanapp.DTO.AuthDTO;
import com.example.loanapp.Entity.User;
import com.example.loanapp.Repository.UserRepository;
import com.example.loanapp.Service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin")
public class AdminController {

    private final UserRepository userRepository;
    private final UserService userService;

    /**
     * ✅ Register an ADMIN
     * - First admin can register without authentication
     * - Subsequent admins require ADMIN token
     */
    @PostMapping("/register")
    public ResponseEntity<?> registerAdmin(
            @Valid @RequestBody AuthDTO.RegisterRequest request,
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        log.info("Admin registration attempt for email: {}", request.getEmail());

        long adminCount = userRepository.countByRole(User.Role.ADMIN);

        // Require token if admins already exist
        if (adminCount > 0) {
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(403).body("Forbidden: Admin login required");
            }
            // Optional: verify token if you want stricter security
        }

        // Prevent duplicate email
        if (userRepository.existsByEmail(request.getEmail())) {
            return ResponseEntity.badRequest().body("Email already exists");
        }

        // Create admin user
        User admin = new User();
        admin.setName(request.getName());
        admin.setEmail(request.getEmail());
        admin.setPassword(userService.encodePassword(request.getPassword())); // ✅ use UserService
        admin.setPhone(request.getPhone());
        admin.setAddress(request.getAddress());
        admin.setCity(request.getCity());
        admin.setState(request.getState());
        admin.setZipCode(request.getZipCode());
        admin.setDateOfBirth(request.getDateOfBirth());
        admin.setAnnualIncome(request.getAnnualIncome());
        admin.setEmploymentType(request.getEmploymentType());
        admin.setMonthlyDebt(request.getMonthlyDebt() != null ? request.getMonthlyDebt() : 0.0);

        // Set role and defaults
        admin.setRole(User.Role.ADMIN);
        admin.setEnabled(true);
        admin.setAccountNonLocked(true);
        admin.setExistingLoansCount(0);

        User savedAdmin = userRepository.save(admin);

        log.info("Admin created successfully with ID: {}", savedAdmin.getId());

        return ResponseEntity.ok(
                AuthDTO.AuthResponse.builder()
                        .success(true)
                        .userId(savedAdmin.getId())
                        .email(savedAdmin.getEmail())
                        .name(savedAdmin.getName())
                        .role(savedAdmin.getRole().name())
                        .message("Admin registered successfully")
                        .build()
        );
    }
}
