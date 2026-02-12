package com.example.loanapp.Repository;

import com.example.loanapp.Entity.Repayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface RepaymentRepository extends JpaRepository<Repayment, String> {

    // --- M-Pesa Integration ---
    /**
     * Finds a repayment by the M-Pesa CheckoutRequestID.
     * Essential for processing asynchronous STK Push callbacks.
     */
    Optional<Repayment> findByMpesaCheckoutId(String mpesaCheckoutId);

    // --- Existing Queries ---
    List<Repayment> findByLoanIdAndStatus(String loanId, Repayment.RepaymentStatus status);

    List<Repayment> findByLoanIdOrderByDueDateAsc(String loanId);

    // --- Aggregations for Stats ---
    @Query("SELECT SUM(r.amount) FROM Repayment r WHERE r.loan.id = :loanId AND r.status = 'PAID'")
    Optional<BigDecimal> sumPaidAmountByLoanId(@Param("loanId") String loanId);

    @Query("SELECT r FROM Repayment r WHERE r.dueDate < :today AND r.status = 'PENDING'")
    List<Repayment> findOverdueRepayments(@Param("today") LocalDate today);

    // Rate Calculation Helpers
    @Query("SELECT COUNT(r) FROM Repayment r WHERE r.loan.user.id = :userId AND r.status = 'PAID' AND r.paidDate <= r.dueDate")
    long countByUserIdAndPaidOnTime(@Param("userId") String userId);

    @Query("SELECT COUNT(r) FROM Repayment r WHERE r.loan.user.id = :userId")
    long countByLoan_User_Id(@Param("userId") String userId);

    @Query("SELECT COALESCE(SUM(r.amount), 0) FROM Repayment r WHERE r.loan.user.id = :userId AND r.status = 'PAID'")
    BigDecimal sumPaidAmountByUserId(@Param("userId") String userId);

    @Query("SELECT r.loan.id, SUM(r.amount) FROM Repayment r " +
            "WHERE r.status = 'PAID' AND r.paidDate BETWEEN :startDate AND :endDate " +
            "GROUP BY r.loan.id")
    List<Object[]> getRepaymentSummary(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
}