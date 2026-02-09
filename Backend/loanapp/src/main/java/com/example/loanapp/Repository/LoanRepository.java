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
import java.util.Optional;

@Repository
public interface LoanRepository extends JpaRepository<Loan, String> {

    // --- Standard Retrieval ---
    List<Loan> findByUserId(String userId);
    Page<Loan> findByUserId(String userId, Pageable pageable);
    Page<Loan> findByStatus(LoanStatus status, Pageable pageable);
    List<Loan> findByUserIdAndStatus(String userId, LoanStatus status);
    List<Loan> findByAppliedDateBetween(LocalDate start, LocalDate end);

    // --- Basic Counts ---
    long countByUserId(String userId);
    long countByUserIdAndStatus(String userId, LoanStatus status);
    long countByStatus(LoanStatus status);

    // --- User Aggregations ---
    @Query("SELECT SUM(l.amount) FROM Loan l WHERE l.user.id = :userId")
    Optional<BigDecimal> sumAmountByUserId(@Param("userId") String userId);

    @Query("SELECT SUM(l.amount) FROM Loan l WHERE l.user.id = :userId AND l.status IN :statuses")
    BigDecimal sumAmountByUserIdAndStatusIn(@Param("userId") String userId, @Param("statuses") List<LoanStatus> statuses);

    // --- Global Analytics Aggregations ---
    @Query("SELECT SUM(l.amount) FROM Loan l WHERE l.status = :status")
    BigDecimal sumAmountByStatus(@Param("status") LoanStatus status);

    @Query("SELECT SUM(l.amount) FROM Loan l WHERE l.status IN :statuses")
    Optional<BigDecimal> sumAmountByStatusIn(@Param("statuses") List<LoanStatus> statuses);

    @Query("SELECT AVG(l.creditScore) FROM Loan l WHERE l.creditScore IS NOT NULL")
    Optional<Double> getAverageCreditScore();


    @Query("SELECT AVG(l.interestRate) FROM Loan l WHERE l.status IN :statuses")
    Optional<Double> getAverageInterestRateIn(@Param("statuses") List<LoanStatus> statuses);

    @Query("SELECT COUNT(DISTINCT l.user.id) FROM Loan l WHERE l.status IN :statuses")
    long countDistinctUsersByStatusIn(@Param("statuses") List<LoanStatus> statuses);
}