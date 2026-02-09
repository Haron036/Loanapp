package com.example.loanapp.controllers;

import com.example.loanapp.DTO.AuthDTO;
import com.example.loanapp.Entity.User;
import com.example.loanapp.Repository.UserRepository;
import com.example.loanapp.Service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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
     * - Logic: If 0 admins exist, allow open registration.
     * - If admins exist, only an existing ADMIN can create another ADMIN.
     */
    @PostMapping("/register")
    public ResponseEntity<?> registerAdmin(
            @Valid @RequestBody AuthDTO.RegisterRequest request,
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        log.info("Processing Admin registration for: {}", request.getEmail());

        long adminCount = userRepository.countByRole(User.Role.ADMIN);

        // Security Check: If the system is already "bootstrapped", enforce admin-only access
        if (adminCount > 0) {
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Access Denied: Initial system setup is complete. Only existing admins can create new admin accounts.");
            }
            // Logic Note: Your SecurityConfig should handle the @PreAuthorize or filter-level check
            // for the ADMIN role to ensure this request is authorized.
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            return ResponseEntity.badRequest().body("Error: Email is already in use.");
        }

        try {
            // We use a dedicated method in UserService to handle hashing and mapping
            User savedAdmin = userService.createAdminUser(request);

            log.info("Admin account created: ID={}, Email={}", savedAdmin.getId(), savedAdmin.getEmail());

            return ResponseEntity.ok(
                    AuthDTO.AuthResponse.builder()
                            .success(true)
                            .userId(savedAdmin.getId())
                            .email(savedAdmin.getEmail())
                            .name(savedAdmin.getName())
                            .role(savedAdmin.getRole().name())
                            .message("Admin account provisioned successfully.")
                            .build()
            );
        } catch (Exception e) {
            log.error("Failed to create admin: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("An error occurred during admin registration.");
        }
    }
}