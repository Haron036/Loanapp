package com.example.loanapp.Entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "repayments")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Repayment {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @JsonIgnore // Prevents infinite recursion during JSON serialization
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "loan_id", nullable = false)
    private Loan loan;

    @Column(nullable = false)
    private Integer installmentNumber;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false)
    private LocalDate dueDate;

    private LocalDate paidDate;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RepaymentStatus status = RepaymentStatus.PENDING;

    @Builder.Default
    @Column(precision = 12, scale = 2)
    private BigDecimal lateFee = BigDecimal.ZERO;

    private String paymentMethod; // e.g., "WALLET", "MPESA"

    private String transactionId; // The M-Pesa Receipt Number (e.g., RBT123456)

    /**
     * M-Pesa Specific Field:
     * Stores the CheckoutRequestID from the STK Push response.
     * Used to identify this record when the asynchronous callback arrives.
     */
    @Column(name = "mpesa_checkout_id")
    private String mpesaCheckoutId;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public enum RepaymentStatus {
        PENDING, PAID, OVERDUE, PARTIALLY_PAID, CANCELLED
    }
}