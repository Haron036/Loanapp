package com.example.loanapp.Repository;

import com.example.loanapp.Entity.Loan;
import com.example.loanapp.Entity.Loan.LoanStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface LoanRepository extends JpaRepository<Loan, String> {

    // Pagination support for Service layer
    Page<Loan> findByUserId(String userId, Pageable pageable);
    Page<Loan> findByStatus(LoanStatus status, Pageable pageable);
    List<Loan> findByUserId(String userId);

    // Status-specific fetching
    List<Loan> findByUserIdAndStatus(String userId, LoanStatus status);

    // Date range for Analytics
    List<Loan> findByAppliedDateBetween(LocalDate start, LocalDate end);

    // --- Aggregations for UserService ---
    long countByUserId(String userId);
    long countByUserIdAndStatus(String userId, LoanStatus status);

    @Query("SELECT SUM(l.amount) FROM Loan l WHERE l.user.id = :userId")
    BigDecimal sumAmountByUserId(@Param("userId") String userId);

    @Query("SELECT SUM(l.amount) FROM Loan l WHERE l.user.id = :userId AND l.status IN :statuses")
    BigDecimal sumAmountByUserIdAndStatusIn(@Param("userId") String userId, @Param("statuses") List<LoanStatus> statuses);

    // --- Global Analytics ---
    @Query("SELECT SUM(l.amount) FROM Loan l WHERE l.status = :status")
    BigDecimal sumAmountByStatus(@Param("status") LoanStatus status);

    @Query("SELECT AVG(l.creditScore) FROM Loan l WHERE l.creditScore IS NOT NULL")
    Double getAverageCreditScore();
}