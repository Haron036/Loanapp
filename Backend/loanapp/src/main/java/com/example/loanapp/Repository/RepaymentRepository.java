package com.example.loanapp.Repository;

import com.example.loanapp.Entity.Repayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface RepaymentRepository extends JpaRepository<Repayment, String> {

    List<Repayment> findByLoanIdAndStatus(String loanId, Repayment.RepaymentStatus status);

    List<Repayment> findByLoanIdOrderByDueDateAsc(String loanId);

    @Query("SELECT SUM(r.amount) FROM Repayment r WHERE r.loan.id = :loanId AND r.status = 'PAID'")
    BigDecimal sumPaidAmountByLoanId(String loanId);

    @Query("SELECT r FROM Repayment r WHERE r.dueDate < :today AND r.status = 'PENDING'")
    List<Repayment> findOverdueRepayments(LocalDate today);

    @Query("SELECT r.loan.id, SUM(r.amount) FROM Repayment r " +
            "WHERE r.status = 'PAID' AND r.paidDate BETWEEN :startDate AND :endDate " +
            "GROUP BY r.loan.id")
    List<Object[]> getRepaymentSummary(LocalDate startDate, LocalDate endDate);

    @Query("SELECT COUNT(r) FROM Repayment r WHERE r.loan.user.id = :userId AND r.status = 'PAID' AND r.paidDate <= r.dueDate")
    long countByUserIdAndPaidOnTime(String userId);

    long countByLoan_User_Id(String userId);

    @Query("""
        SELECT COALESCE(SUM(r.amount), 0)
        FROM Repayment r
        WHERE r.loan.user.id = :userId
          AND r.status = 'PAID'
        """)
    BigDecimal sumPaidAmountByUserId(String userId);
}
