package com.example.loanapp.controllers;

import com.example.loanapp.Entity.User;
import com.example.loanapp.Repository.LoanRepository;
import com.example.loanapp.Repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
@RestController
@RequestMapping("/api/admin/dashboard")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")

public class AdminDashboard {
    private final UserRepository userRepository;
    private final LoanRepository loanRepository;

    /**
     * 📊 Dashboard statistics
     */
    @GetMapping("/stats")
    public ResponseEntity<?> getStats() {

        long totalUsers = userRepository.count();
        long admins = userRepository.countByRole(User.Role.ADMIN);
        long normalUsers = userRepository.countByRole(User.Role.USER);

        long totalLoans = loanRepository.count();
        long pendingLoans = loanRepository.countByStatus("PENDING");
        long approvedLoans = loanRepository.countByStatus("APPROVED");
        long rejectedLoans = loanRepository.countByStatus("REJECTED");

        return ResponseEntity.ok(
                Map.of(
                        "users", Map.of(
                                "total", totalUsers,
                                "admins", admins,
                                "users", normalUsers
                        ),
                        "loans", Map.of(
                                "total", totalLoans,
                                "pending", pendingLoans,
                                "approved", approvedLoans,
                                "rejected", rejectedLoans
                        )
                )
        );
    }

    /**
     * 👥 View all users
     */
    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    /**
     * 🔍 View single user
     */
    @GetMapping("/users/{id}")
    public ResponseEntity<?> getUser(@PathVariable String id) {
        return ResponseEntity.ok(
                userRepository.findById(id)
                        .orElseThrow(() -> new RuntimeException("User not found"))
        );
    }

    /**
     * 🚫 Lock a user account
     */
    @PutMapping("/users/{id}/lock")
    public ResponseEntity<?> lockUser(@PathVariable String id) {

        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setAccountNonLocked(false);
        userRepository.save(user);

        return ResponseEntity.ok("User account locked");
    }

    /**
     * ✅ Unlock user account
     */
    @PutMapping("/users/{id}/unlock")
    public ResponseEntity<?> unlockUser(@PathVariable String id) {

        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setAccountNonLocked(true);
        userRepository.save(user);

        return ResponseEntity.ok("User account unlocked");
    }
}
