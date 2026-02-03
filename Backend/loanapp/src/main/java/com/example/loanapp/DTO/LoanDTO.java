package com.example.loanapp.DTO;

import com.example.loanapp.Entity.Loan;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;


public class LoanDTO {
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateRequest {
        @NotNull
        @DecimalMin(value = "1000.00")
        private BigDecimal amount;

        @NotNull
        @Min(12)
        private Integer termMonths;

        @NotNull
        private Loan.LoanPurpose purpose;

        private String description;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateStatusRequest {
        @NotNull
        private Loan.LoanStatus status;
        private String notes;
        private String rejectionReason;
        private BigDecimal interestRate;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private String id;
        private BigDecimal amount;
        private Integer termMonths;
        private String purpose;
        private String status;
        private BigDecimal interestRate;
        private BigDecimal monthlyPayment;
        private Integer creditScore;
        private LocalDate appliedDate;
        private LocalDate reviewedDate;
        private String reviewedBy;
        private String userId;
        private String userName;
        private BigDecimal totalRepaid;
        private BigDecimal remainingBalance;
        private LocalDate dueDate;
        private LocalDate completedDate;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Summary {
        private BigDecimal totalBorrowed;
        private BigDecimal totalRepaid;
        private Integer activeLoans;
        private Integer pendingDue;
        private BigDecimal monthlyPayment;
        private BigDecimal availableCredit;
    }
}
