package com.example.loanapp.Entity;

import jakarta.persistence.*;
import lombok.*; // This is the key import
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "loans")
@Getter // Replaces manual getters
@Setter // Replaces manual setters
@NoArgsConstructor // Replaces manual empty constructor
@AllArgsConstructor // Required for @Builder
@Builder // FIX: Adds the .builder() method for LoanService
public class Loan {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false)
    private Integer termMonths;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LoanPurpose purpose;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default // Ensures Builder doesn't overwrite default with null
    private LoanStatus status = LoanStatus.PENDING;

    @Column(precision = 5, scale = 2)
    private BigDecimal interestRate;

    @Column(precision = 12, scale = 2)
    private BigDecimal monthlyPayment;

    @Column(precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal totalRepaid = BigDecimal.ZERO;

    private Integer creditScore;
    private LocalDate appliedDate;
    private LocalDate reviewedDate;
    private LocalDate disbursedDate;
    private LocalDate dueDate;
    private LocalDate completedDate;

    private String reviewedBy;
    private String rejectionReason;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "loan", cascade = CascadeType.ALL)
    private List<Repayment> repayments;

    // Enums
    public enum LoanStatus {
        PENDING, UNDER_REVIEW, APPROVED, REJECTED,
        DISBURSED, REPAYING, DEFAULTED, COMPLETED
    }

    public enum LoanPurpose {
        HOME_RENOVATION, DEBT_CONSOLIDATION, BUSINESS_EXPANSION,
        MEDICAL_EXPENSES, EDUCATION, VEHICLE_PURCHASE,
        WEDDING, TRAVEL, PERSONAL, OTHER
    }
}