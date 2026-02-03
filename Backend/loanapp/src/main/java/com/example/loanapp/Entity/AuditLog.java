package com.example.loanapp.Entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuditLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String action;

    @Column(nullable = false)
    private String entityType;

    private String entityId;
    private String userId;

    @Column(columnDefinition = "TEXT")
    private String details;

    private String ipAddress;
    private String userAgent;

    @CreationTimestamp
    private LocalDateTime timestamp;

    public enum Action {
        CREATE, UPDATE, DELETE, LOGIN, LOGOUT,
        APPROVE, REJECT, DISBURSE, REPAY,
        REGISTER, UPDATE_PROFILE, CHANGE_PASSWORD,
        PASSWORD_RESET_REQUEST, PASSWORD_RESET,
        ADMIN_UPDATE, ENABLE_ACCOUNT, DISABLE_ACCOUNT,
        LOCK_ACCOUNT, UNLOCK_ACCOUNT, CHANGE_ROLE,
        SOFT_DELETE
    }
}

