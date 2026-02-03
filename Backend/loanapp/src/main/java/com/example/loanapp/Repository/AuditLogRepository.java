package com.example.loanapp.Repository;

import com.example.loanapp.Entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findByUserIdOrderByTimestampDesc(String userId);

    @Query("SELECT a FROM AuditLog a WHERE a.userId = :userId ORDER BY a.timestamp DESC")
    List<AuditLog> findRecentByUserId(@Param("userId") String userId, Pageable pageable);

    Page<AuditLog> findByEntityTypeAndEntityId(String entityType, String entityId, Pageable pageable);

    @Query("SELECT COUNT(a) FROM AuditLog a WHERE a.userId = :userId AND a.action = :action")
    long countByUserIdAndAction(@Param("userId") String userId, @Param("action") String action);

    @Query("SELECT a FROM AuditLog a WHERE a.timestamp >= :startDate AND a.timestamp <= :endDate ORDER BY a.timestamp DESC")
    List<AuditLog> findByTimestampBetween(@Param("startDate") LocalDateTime startDate,
                                          @Param("endDate") LocalDateTime endDate);

    @Query("SELECT a FROM AuditLog a WHERE a.userId = :userId AND a.timestamp >= :startDate ORDER BY a.timestamp DESC")
    List<AuditLog> findByUserIdAndTimestampAfter(@Param("userId") String userId,
                                                 @Param("startDate") LocalDateTime startDate);

    @Query(value = "SELECT a FROM AuditLog a WHERE " +
            "(LOWER(a.action) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(a.entityType) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(a.details) LIKE LOWER(CONCAT('%', :query, '%'))) " +
            "ORDER BY a.timestamp DESC")
    Page<AuditLog> searchAuditLogs(@Param("query") String query, Pageable pageable);
}
