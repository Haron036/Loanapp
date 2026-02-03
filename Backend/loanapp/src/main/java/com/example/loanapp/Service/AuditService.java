package com.example.loanapp.Service;

import com.example.loanapp.Entity.AuditLog;
import com.example.loanapp.Repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditService {
    private final AuditLogRepository auditLogRepository;

    public void logNotification(String notificationType, String userId, String entityId, String details) {
        try {
            AuditLog auditLog = new AuditLog();
            auditLog.setAction("NOTIFICATION_SENT");
            auditLog.setEntityType("NOTIFICATION");
            auditLog.setEntityId(entityId);
            auditLog.setUserId(userId);
            auditLog.setDetails(notificationType + ": " + details);
            auditLog.setTimestamp(LocalDateTime.now());
            auditLog.setIpAddress("SYSTEM");
            auditLog.setUserAgent("NotificationService");

            auditLogRepository.save(auditLog);

        } catch (Exception e) {
            log.error("Failed to log notification audit: {}", e.getMessage());
        }
    }

    public void logLoanAction(String action, String loanId, String userId, String details) {
        try {
            AuditLog auditLog = new AuditLog();
            auditLog.setAction(action);
            auditLog.setEntityType("LOAN");
            auditLog.setEntityId(loanId);
            auditLog.setUserId(userId);
            auditLog.setDetails(details);
            auditLog.setTimestamp(LocalDateTime.now());

            auditLogRepository.save(auditLog);

        } catch (Exception e) {
            log.error("Failed to log loan action audit: {}", e.getMessage());
        }
    }

    public void logUserAction(String action, String userId, String details) {
        try {
            AuditLog auditLog = new AuditLog();
            auditLog.setAction(action);
            auditLog.setEntityType("USER");
            auditLog.setEntityId(userId);
            auditLog.setUserId(userId);
            auditLog.setDetails(details);
            auditLog.setTimestamp(LocalDateTime.now());

            auditLogRepository.save(auditLog);

        } catch (Exception e) {
            log.error("Failed to log user action audit: {}", e.getMessage());
        }
    }
}
