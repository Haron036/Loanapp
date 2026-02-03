package com.example.loanapp.Service;

import com.example.loanapp.Entity.Loan;
import com.example.loanapp.Entity.Repayment;
import com.example.loanapp.Entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;


@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {
    private final AuditService auditService;

    // Email templates
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("MMM dd, yyyy");
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("hh:mm a");

    public void sendLoanApplicationNotification(User user, Loan loan) {
        try {
            log.info("Loan Application Notification - User: {}, Loan: {}, Amount: {}",
                    user.getEmail(), loan.getId(), formatCurrency(loan.getAmount()));

            Map<String, Object> templateVariables = new HashMap<>();
            templateVariables.put("userName", user.getName());
            templateVariables.put("loanId", loan.getId());
            templateVariables.put("loanAmount", formatCurrency(loan.getAmount()));
            templateVariables.put("purpose", loan.getPurpose().toString());
            templateVariables.put("appliedDate", loan.getAppliedDate().format(DATE_FORMATTER));

            // For now, just log the notification
            logNotification("LOAN_APPLICATION_SENT", user.getId(), loan.getId(),
                    "Loan application confirmation sent to user");

        } catch (Exception e) {
            log.error("Failed to send loan application notification: {}", e.getMessage());
        }
    }

    public void sendLoanApprovalNotification(User user, Loan loan) {
        try {
            log.info("Loan Approval Notification - User: {}, Loan: {}, Amount: {}, Rate: {}%",
                    user.getEmail(), loan.getId(), formatCurrency(loan.getAmount()), loan.getInterestRate());

            Map<String, Object> templateVariables = new HashMap<>();
            templateVariables.put("userName", user.getName());
            templateVariables.put("loanId", loan.getId());
            templateVariables.put("loanAmount", formatCurrency(loan.getAmount()));
            templateVariables.put("interestRate", loan.getInterestRate() + "%");
            templateVariables.put("monthlyPayment", formatCurrency(loan.getMonthlyPayment()));

            logNotification("LOAN_APPROVAL_SENT", user.getId(), loan.getId(),
                    "Loan approval notification sent");

        } catch (Exception e) {
            log.error("Failed to send loan approval notification: {}", e.getMessage());
        }
    }

    public void sendLoanRejectionNotification(User user, Loan loan) {
        try {
            log.info("Loan Rejection Notification - User: {}, Loan: {}, Reason: {}",
                    user.getEmail(), loan.getId(), loan.getRejectionReason());

            Map<String, Object> templateVariables = new HashMap<>();
            templateVariables.put("userName", user.getName());
            templateVariables.put("loanId", loan.getId());
            templateVariables.put("rejectionReason", loan.getRejectionReason());

            logNotification("LOAN_REJECTION_SENT", user.getId(), loan.getId(),
                    "Loan rejection notification sent");

        } catch (Exception e) {
            log.error("Failed to send loan rejection notification: {}", e.getMessage());
        }
    }

    public void sendLoanDisbursementNotification(User user, Loan loan) {
        try {
            log.info("Loan Disbursement Notification - User: {}, Loan: {}, Disbursed: {}",
                    user.getEmail(), loan.getId(), loan.getDisbursedDate());

            Map<String, Object> templateVariables = new HashMap<>();
            templateVariables.put("userName", user.getName());
            templateVariables.put("loanId", loan.getId());
            templateVariables.put("disbursementDate", loan.getDisbursedDate().format(DATE_FORMATTER));

            logNotification("LOAN_DISBURSEMENT_SENT", user.getId(), loan.getId(),
                    "Loan disbursement notification sent");

        } catch (Exception e) {
            log.error("Failed to send loan disbursement notification: {}", e.getMessage());
        }
    }

    public void sendRepaymentReminder(User user, Repayment repayment) {
        try {
            log.info("Repayment Reminder - User: {}, Loan: {}, Amount: {}, Due: {}",
                    user.getEmail(), repayment.getLoan().getId(),
                    formatCurrency(repayment.getAmount()), repayment.getDueDate());

            Map<String, Object> templateVariables = new HashMap<>();
            templateVariables.put("userName", user.getName());
            templateVariables.put("loanId", repayment.getLoan().getId());
            templateVariables.put("amountDue", formatCurrency(repayment.getAmount()));
            templateVariables.put("dueDate", repayment.getDueDate().format(DATE_FORMATTER));

            logNotification("REPAYMENT_REMINDER_SENT", user.getId(), repayment.getLoan().getId(),
                    "Repayment reminder sent");

        } catch (Exception e) {
            log.error("Failed to send repayment reminder: {}", e.getMessage());
        }
    }

    public void sendRepaymentConfirmation(User user, Repayment repayment) {
        try {
            log.info("Repayment Confirmation - User: {}, Loan: {}, Amount: {}, Date: {}",
                    user.getEmail(), repayment.getLoan().getId(),
                    formatCurrency(repayment.getAmount()), repayment.getPaidDate());

            Map<String, Object> templateVariables = new HashMap<>();
            templateVariables.put("userName", user.getName());
            templateVariables.put("loanId", repayment.getLoan().getId());
            templateVariables.put("amountPaid", formatCurrency(repayment.getAmount()));
            templateVariables.put("paymentDate", repayment.getPaidDate().format(DATE_FORMATTER));

            logNotification("REPAYMENT_CONFIRMATION_SENT", user.getId(), repayment.getLoan().getId(),
                    "Repayment confirmation sent");

        } catch (Exception e) {
            log.error("Failed to send repayment confirmation: {}", e.getMessage());
        }
    }

    public void sendOverdueNotification(User user, Repayment repayment) {
        try {
            long daysOverdue = java.time.temporal.ChronoUnit.DAYS.between(
                    repayment.getDueDate(), LocalDate.now());

            log.warn("Overdue Notification - User: {}, Loan: {}, Amount: {}, Days Overdue: {}",
                    user.getEmail(), repayment.getLoan().getId(),
                    formatCurrency(repayment.getAmount()), daysOverdue);

            Map<String, Object> templateVariables = new HashMap<>();
            templateVariables.put("userName", user.getName());
            templateVariables.put("loanId", repayment.getLoan().getId());
            templateVariables.put("overdueAmount", formatCurrency(repayment.getAmount()));
            templateVariables.put("daysOverdue", daysOverdue);

            logNotification("OVERDUE_NOTIFICATION_SENT", user.getId(), repayment.getLoan().getId(),
                    "Overdue notification sent - " + daysOverdue + " days overdue");

        } catch (Exception e) {
            log.error("Failed to send overdue notification: {}", e.getMessage());
        }
    }

    public void sendCreditScoreUpdate(User user, Integer oldScore, Integer newScore) {
        try {
            log.info("Credit Score Update - User: {}, Old Score: {}, New Score: {}, Change: {}",
                    user.getEmail(), oldScore, newScore, newScore - oldScore);

            Map<String, Object> templateVariables = new HashMap<>();
            templateVariables.put("userName", user.getName());
            templateVariables.put("oldScore", oldScore);
            templateVariables.put("newScore", newScore);
            templateVariables.put("changeAmount", newScore - oldScore);

            logNotification("CREDIT_SCORE_UPDATE_SENT", user.getId(), null,
                    "Credit score update sent: " + oldScore + " → " + newScore);

        } catch (Exception e) {
            log.error("Failed to send credit score update: {}", e.getMessage());
        }
    }

    public void sendWelcomeEmail(User user) {
        try {
            log.info("Welcome Email - User: {}, Credit Score: {}, Created: {}",
                    user.getEmail(), user.getCreditScore(), user.getCreatedAt());

            Map<String, Object> templateVariables = new HashMap<>();
            templateVariables.put("userName", user.getName());
            templateVariables.put("initialCreditScore", user.getCreditScore());
            templateVariables.put("signupDate", user.getCreatedAt().format(DATE_FORMATTER));

            logNotification("WELCOME_EMAIL_SENT", user.getId(), null,
                    "Welcome email sent to new user");

        } catch (Exception e) {
            log.error("Failed to send welcome email: {}", e.getMessage());
        }
    }

    public void sendPasswordResetEmail(User user, String resetToken) {
        try {
            log.info("Password Reset Email - User: {}, Token: {}",
                    user.getEmail(), resetToken);

            Map<String, Object> templateVariables = new HashMap<>();
            templateVariables.put("userName", user.getName());
            templateVariables.put("resetToken", resetToken);

            logNotification("PASSWORD_RESET_SENT", user.getId(), null,
                    "Password reset email sent");

        } catch (Exception e) {
            log.error("Failed to send password reset email: {}", e.getMessage());
        }
    }

    public void sendAccountStatusChange(User user, String changeType, String reason) {
        try {
            log.info("Account Status Change - User: {}, Change: {}, Reason: {}",
                    user.getEmail(), changeType, reason);

            Map<String, Object> templateVariables = new HashMap<>();
            templateVariables.put("userName", user.getName());
            templateVariables.put("changeType", changeType);
            templateVariables.put("reason", reason);

            logNotification("ACCOUNT_STATUS_CHANGE_SENT", user.getId(), null,
                    "Account status change notification sent: " + changeType);

        } catch (Exception e) {
            log.error("Failed to send account status change notification: {}", e.getMessage());
        }
    }

    public void sendAdminAlert(String alertType, String message, Loan loan) {
        try {
            log.warn("Admin Alert - Type: {}, Message: {}, Loan: {}",
                    alertType, message, loan != null ? loan.getId() : "N/A");

            Map<String, Object> templateVariables = new HashMap<>();
            templateVariables.put("alertType", alertType);
            templateVariables.put("alertMessage", message);

            logNotification("ADMIN_ALERT_SENT", "ADMIN", loan != null ? loan.getId() : null,
                    "Admin alert: " + alertType + " - " + message);

        } catch (Exception e) {
            log.error("Failed to send admin alert: {}", e.getMessage());
        }
    }

    // ==================== PRIVATE HELPER METHODS ====================

    private void logNotification(String notificationType, String userId, String entityId, String details) {
        try {
            if (auditService != null) {
                auditService.logNotification(notificationType, userId, entityId, details);
            }
        } catch (Exception e) {
            log.error("Failed to log notification audit: {}", e.getMessage());
        }
    }

    private String formatCurrency(BigDecimal amount) {
        if (amount == null) return "$0.00";
        return String.format("$%,.2f", amount);
    }

}