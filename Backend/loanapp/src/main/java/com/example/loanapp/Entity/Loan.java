package com.example.loanapp.Entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "loans")
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
    private LoanStatus status = LoanStatus.PENDING;

    @Column(precision = 5, scale = 2)
    private BigDecimal interestRate;

    @Column(precision = 12, scale = 2)
    private BigDecimal monthlyPayment;

    @Column(precision = 12, scale = 2)
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

    // Constructors
    public Loan() {
    }

    public Loan(String id, User user, BigDecimal amount, Integer termMonths, LoanPurpose purpose,
                LoanStatus status, BigDecimal interestRate, BigDecimal monthlyPayment,
                BigDecimal totalRepaid, Integer creditScore, LocalDate appliedDate,
                LocalDate reviewedDate, LocalDate disbursedDate, LocalDate dueDate,
                LocalDate completedDate, String reviewedBy, String rejectionReason,
                LocalDateTime createdAt, LocalDateTime updatedAt, List<Repayment> repayments) {
        this.id = id;
        this.user = user;
        this.amount = amount;
        this.termMonths = termMonths;
        this.purpose = purpose;
        this.status = status;
        this.interestRate = interestRate;
        this.monthlyPayment = monthlyPayment;
        this.totalRepaid = totalRepaid;
        this.creditScore = creditScore;
        this.appliedDate = appliedDate;
        this.reviewedDate = reviewedDate;
        this.disbursedDate = disbursedDate;
        this.dueDate = dueDate;
        this.completedDate = completedDate;
        this.reviewedBy = reviewedBy;
        this.rejectionReason = rejectionReason;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.repayments = repayments;
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public Integer getTermMonths() {
        return termMonths;
    }

    public void setTermMonths(Integer termMonths) {
        this.termMonths = termMonths;
    }

    public LoanPurpose getPurpose() {
        return purpose;
    }

    public void setPurpose(LoanPurpose purpose) {
        this.purpose = purpose;
    }

    public LoanStatus getStatus() {
        return status;
    }

    public void setStatus(LoanStatus status) {
        this.status = status;
    }

    public BigDecimal getInterestRate() {
        return interestRate;
    }

    public void setInterestRate(BigDecimal interestRate) {
        this.interestRate = interestRate;
    }

    public BigDecimal getMonthlyPayment() {
        return monthlyPayment;
    }

    public void setMonthlyPayment(BigDecimal monthlyPayment) {
        this.monthlyPayment = monthlyPayment;
    }

    public BigDecimal getTotalRepaid() {
        return totalRepaid;
    }

    public void setTotalRepaid(BigDecimal totalRepaid) {
        this.totalRepaid = totalRepaid;
    }

    public Integer getCreditScore() {
        return creditScore;
    }

    public void setCreditScore(Integer creditScore) {
        this.creditScore = creditScore;
    }

    public LocalDate getAppliedDate() {
        return appliedDate;
    }

    public void setAppliedDate(LocalDate appliedDate) {
        this.appliedDate = appliedDate;
    }

    public LocalDate getReviewedDate() {
        return reviewedDate;
    }

    public void setReviewedDate(LocalDate reviewedDate) {
        this.reviewedDate = reviewedDate;
    }

    public LocalDate getDisbursedDate() {
        return disbursedDate;
    }

    public void setDisbursedDate(LocalDate disbursedDate) {
        this.disbursedDate = disbursedDate;
    }

    public LocalDate getDueDate() {
        return dueDate;
    }

    public void setDueDate(LocalDate dueDate) {
        this.dueDate = dueDate;
    }

    public LocalDate getCompletedDate() {
        return completedDate;
    }

    public void setCompletedDate(LocalDate completedDate) {
        this.completedDate = completedDate;
    }

    public String getReviewedBy() {
        return reviewedBy;
    }

    public void setReviewedBy(String reviewedBy) {
        this.reviewedBy = reviewedBy;
    }

    public String getRejectionReason() {
        return rejectionReason;
    }

    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public List<Repayment> getRepayments() {
        return repayments;
    }

    public void setRepayments(List<Repayment> repayments) {
        this.repayments = repayments;
    }

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