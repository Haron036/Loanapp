package com.example.loanapp.Repository;

import com.example.loanapp.Entity.Loan;
import com.example.loanapp.Entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
@Repository
public interface UserRepository extends JpaRepository<User, String> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    boolean existsByPhone(String phone);
    boolean existsByEmailAndIdNot(String email, String id);

    long countByRole(User.Role role);
    long countByEnabled(boolean enabled);
    long countByCreatedAtAfter(LocalDateTime date);
    long countByAnnualIncomeNotNullAndEmploymentTypeNotNull();

    Long countByCreditScoreBetween(int min, int max);

    @Query("SELECT AVG(u.creditScore) FROM User u WHERE u.creditScore IS NOT NULL")
    Double averageCreditScore();

    @Query("SELECT u FROM User u WHERE " +
            "(:role IS NULL OR u.role = :role) AND " +
            "(:enabled IS NULL OR u.enabled = :enabled)")
    Page<User> findByFilters(@Param("role") User.Role role,
                             @Param("enabled") Boolean enabled,
                             Pageable pageable);

    @Query("SELECT u FROM User u WHERE " +
            "(LOWER(u.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(u.email) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "u.phone LIKE CONCAT('%', :query, '%')) AND " +
            "(:role IS NULL OR u.role = :role) AND " +
            "(:enabled IS NULL OR u.enabled = :enabled)")
    Page<User> searchUsers(@Param("query") String query,
                           @Param("role") User.Role role,
                           @Param("enabled") Boolean enabled,
                           Pageable pageable);

    @Query("SELECT u FROM User u WHERE " +
            "(LOWER(u.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(u.email) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "u.phone LIKE CONCAT('%', :query, '%')) " +
            "ORDER BY u.createdAt DESC LIMIT :limit")
    List<User> searchUsers(@Param("query") String query, @Param("limit") int limit);

    @Query("SELECT u FROM User u WHERE u.id = :id AND u.enabled = true")
    Optional<User> findActiveById(@Param("id") String id);

    @Query("SELECT COUNT(l) FROM Loan l WHERE l.user.id = :userId")
    long countLoansByUserId(@Param("userId") String userId);

    @Query("SELECT COUNT(l) FROM Loan l WHERE l.user.id = :userId AND l.status = :status")
    long countLoansByUserIdAndStatus(@Param("userId") String userId,
                                     @Param("status") Loan.LoanStatus status);
    Optional<User> findByPasswordResetToken(String token);

}

