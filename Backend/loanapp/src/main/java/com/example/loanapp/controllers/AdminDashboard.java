package com.example.loanapp.controllers;

import com.example.loanapp.Entity.User;
import com.example.loanapp.Entity.Loan.LoanStatus; // Import the Enum
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
     * Updated to use type-safe Enums and optimized repository counts
     */
    @GetMapping("/stats")
    public ResponseEntity<?> getStats() {
        // User Stats
        long totalUsers = userRepository.count();
        long admins = userRepository.countByRole(User.Role.ADMIN);
        long normalUsers = userRepository.countByRole(User.Role.USER);

        // Loan Stats - Using the Enum constants to fix the "Incompatible Types" error
        long totalLoans = loanRepository.count();
        long pendingLoans = loanRepository.countByStatus(LoanStatus.PENDING);
        long approvedLoans = loanRepository.countByStatus(LoanStatus.APPROVED);
        long rejectedLoans = loanRepository.countByStatus(LoanStatus.REJECTED);

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
        return userRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * 🚫 Lock a user account
     */
    @PutMapping("/users/{id}/lock")
    public ResponseEntity<?> lockUser(@PathVariable String id) {
        return userRepository.findById(id)
                .map(user -> {
                    user.setAccountNonLocked(false);
                    userRepository.save(user);
                    return ResponseEntity.ok(Map.of("message", "User account locked"));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * ✅ Unlock user account
     */
    @PutMapping("/users/{id}/unlock")
    public ResponseEntity<?> unlockUser(@PathVariable String id) {
        return userRepository.findById(id)
                .map(user -> {
                    user.setAccountNonLocked(true);
                    userRepository.save(user);
                    return ResponseEntity.ok(Map.of("message", "User account unlocked"));
                })
                .orElse(ResponseEntity.notFound().build());
    }
}