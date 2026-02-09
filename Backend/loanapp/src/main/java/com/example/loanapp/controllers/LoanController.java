package com.example.loanapp.controllers;

import com.example.loanapp.DTO.LoanDTO;
import com.example.loanapp.Service.LoanService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/loans")
@RequiredArgsConstructor
public class LoanController {

    private final LoanService loanService;

    // --- 👤 User Endpoints ---

    @PostMapping
    public ResponseEntity<LoanDTO.Response> applyForLoan(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody LoanDTO.CreateRequest request
    ) {
        return ResponseEntity.ok(loanService.createLoan(userDetails.getUsername(), request));
    }

    @GetMapping("/my-loans")
    public ResponseEntity<Page<LoanDTO.Response>> getMyLoans(
            @AuthenticationPrincipal UserDetails userDetails,
            Pageable pageable
    ) {
        return ResponseEntity.ok(loanService.getUserLoans(userDetails.getUsername(), pageable));
    }

    // --- 🛠️ Admin/Officer Endpoints ---

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'LOAN_OFFICER')")
    public ResponseEntity<Page<LoanDTO.Response>> getAllLoans(Pageable pageable) {
        return ResponseEntity.ok(loanService.getAllLoans(pageable));
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN', 'LOAN_OFFICER')")
    public ResponseEntity<LoanDTO.Response> approveLoan(
            @PathVariable String id,
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, String> body
    ) {
        String notes = body.getOrDefault("notes", "No notes provided");
        String adminId = userDetails.getUsername();

        log.info("Admin {} is approving loan {}", adminId, id);
        return ResponseEntity.ok(loanService.approveLoan(id, adminId, notes));
    }

    @PutMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('ADMIN', 'LOAN_OFFICER')")
    public ResponseEntity<LoanDTO.Response> rejectLoan(
            @PathVariable String id,
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, String> body
    ) {
        String reason = body.getOrDefault("reason", "No reason provided");
        String adminId = userDetails.getUsername();

        log.info("Admin {} is rejecting loan {}", adminId, id);
        return ResponseEntity.ok(loanService.rejectLoan(id, adminId, reason));
    }

    @PutMapping("/{id}/disburse")
    @PreAuthorize("hasAnyRole('ADMIN', 'LOAN_OFFICER')")
    public ResponseEntity<LoanDTO.Response> disburseLoan(@PathVariable String id) {
        return ResponseEntity.ok(loanService.disburseLoan(id));
    }

    @GetMapping("/{id}")
    public ResponseEntity<LoanDTO.Response> getLoanDetails(@PathVariable String id) {
        return ResponseEntity.ok(loanService.getLoanById(id));
    }
}