package com.example.loanapp.controllers;

import com.example.loanapp.DTO.LoanDTO;
import com.example.loanapp.Entity.Loan;
import com.example.loanapp.Entity.Repayment;
import com.example.loanapp.Entity.User;
import com.example.loanapp.Service.LoanService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/loans")
@RequiredArgsConstructor
public class LoanController {
    private final LoanService loanService;

    @PostMapping
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<LoanDTO.Response> createLoan(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody LoanDTO.CreateRequest request) {
        Loan loan = loanService.createLoan(user.getId(), request);
        return ResponseEntity.ok(convertToDTO(loan));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'LOAN_OFFICER')")
    public ResponseEntity<Page<LoanDTO.Response>> getUserLoans(
            @AuthenticationPrincipal User user,
            @PageableDefault(size = 20) Pageable pageable) {

        Page<Loan> loans;
        if (user.getRole() == User.Role.USER) {
            loans = loanService.getUserLoans(user.getId(), pageable);
        } else {
            loans = loanService.getAllLoans(pageable);
        }

        Page<LoanDTO.Response> response = loans.map(this::convertToDTO);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'LOAN_OFFICER')")
    public ResponseEntity<LoanDTO.Response> getLoanById(
            @AuthenticationPrincipal User user,
            @PathVariable String id) {

        Loan loan = loanService.getLoanById(id);

        if (user.getRole() == User.Role.USER && !loan.getUser().getId().equals(user.getId())) {
            return ResponseEntity.status(403).build();
        }

        return ResponseEntity.ok(convertToDTO(loan));
    }

    @GetMapping("/{id}/repayments")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'LOAN_OFFICER')")
    public ResponseEntity<List<Repayment>> getRepayments(
            @AuthenticationPrincipal User user,
            @PathVariable String id) {

        Loan loan = loanService.getLoanById(id);
        if (user.getRole() == User.Role.USER && !loan.getUser().getId().equals(user.getId())) {
            return ResponseEntity.status(403).build();
        }

        return ResponseEntity.ok(loanService.getRepaymentsByLoanId(id));
    }

    @GetMapping("/summary")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<LoanDTO.Summary> getLoanSummary(@AuthenticationPrincipal User user) {
        LoanDTO.Summary summary = loanService.getUserLoanSummary(user.getId());
        return ResponseEntity.ok(summary);
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN', 'LOAN_OFFICER')")
    public ResponseEntity<LoanDTO.Response> approveLoan(
            @PathVariable String id,
            @RequestBody Map<String, String> request) {

        String notes = request.get("notes");
        Loan loan = loanService.approveLoan(id, notes);
        return ResponseEntity.ok(convertToDTO(loan));
    }

    @PutMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('ADMIN', 'LOAN_OFFICER')")
    public ResponseEntity<LoanDTO.Response> rejectLoan(
            @PathVariable String id,
            @RequestBody Map<String, String> request) {

        String reason = request.get("reason");
        Loan loan = loanService.rejectLoan(id, reason);
        return ResponseEntity.ok(convertToDTO(loan));
    }

    @PutMapping("/{id}/disburse")
    @PreAuthorize("hasAnyRole('ADMIN', 'LOAN_OFFICER')")
    public ResponseEntity<LoanDTO.Response> disburseLoan(@PathVariable String id) {
        Loan loan = loanService.disburseLoan(id);
        return ResponseEntity.ok(convertToDTO(loan));
    }

    @GetMapping("/status/{status}")
    @PreAuthorize("hasAnyRole('ADMIN', 'LOAN_OFFICER')")
    public ResponseEntity<Page<LoanDTO.Response>> getLoansByStatus(
            @PathVariable Loan.LoanStatus status,
            @PageableDefault(size = 20) Pageable pageable) {

        Page<Loan> loans = loanService.getLoansByStatus(status, pageable);
        Page<LoanDTO.Response> response = loans.map(this::convertToDTO);
        return ResponseEntity.ok(response);
    }

    private LoanDTO.Response convertToDTO(Loan loan) {
        LoanDTO.Response dto = new LoanDTO.Response();
        dto.setId(loan.getId());
        dto.setAmount(loan.getAmount());
        dto.setTermMonths(loan.getTermMonths());
        dto.setPurpose(loan.getPurpose().name());
        dto.setStatus(loan.getStatus().name());
        dto.setInterestRate(loan.getInterestRate());
        dto.setMonthlyPayment(loan.getMonthlyPayment());
        dto.setCreditScore(loan.getCreditScore());
        dto.setAppliedDate(loan.getAppliedDate());
        dto.setReviewedDate(loan.getReviewedDate());
        dto.setReviewedBy(loan.getReviewedBy());
        dto.setUserId(loan.getUser().getId());
        dto.setUserName(loan.getUser().getName());
        dto.setTotalRepaid(loan.getTotalRepaid());
        dto.setDueDate(loan.getDueDate());
        dto.setCompletedDate(loan.getCompletedDate());

        BigDecimal remaining = loan.getAmount().subtract(loan.getTotalRepaid());
        dto.setRemainingBalance(remaining.max(BigDecimal.ZERO));

        return dto;
    }
}