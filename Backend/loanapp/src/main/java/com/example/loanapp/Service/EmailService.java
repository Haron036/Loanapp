package com.example.loanapp.Service;

import com.example.loanapp.Entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {
    private final JavaMailSender mailSender;

    @Async
    public void sendWelcomeEmail(User user) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(user.getEmail());
            message.setSubject("Welcome to LoanApp!");
            message.setText("Dear " + user.getName() + "...");
            mailSender.send(message);
        } catch (Exception e) {
            // Log the error so you know it failed, but don't crash the app
            System.err.println("Failed to send email: " + e.getMessage());
        }
    }

    public void sendPasswordChangeNotification(User user) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(user.getEmail());
        message.setSubject("Password Changed Successfully");
        message.setText("Dear " + user.getName() + ",\n\n" +
                "Your password has been changed successfully.\n\n" +
                "If you did not make this change, please contact our support team immediately.\n\n" +
                "Best regards,\nLoanApp Team");
        mailSender.send(message);
    }

    public void sendPasswordResetEmail(User user, String resetToken) {
        String resetLink = "http://localhost:3000/reset-password?token=" + resetToken;

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(user.getEmail());
        message.setSubject("Password Reset Request");
        message.setText("Dear " + user.getName() + ",\n\n" +
                "You requested to reset your password. Click the link below to reset:\n\n" +
                resetLink + "\n\n" +
                "This link will expire in 24 hours.\n\n" +
                "If you did not request this, please ignore this email.\n\n" +
                "Best regards,\nLoanApp Team");
        mailSender.send(message);
    }

    public void sendPasswordResetConfirmation(User user) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(user.getEmail());
        message.setSubject("Password Reset Successful");
        message.setText("Dear " + user.getName() + ",\n\n" +
                "Your password has been reset successfully.\n\n" +
                "You can now login with your new password.\n\n" +
                "Best regards,\nLoanApp Team");
        mailSender.send(message);
    }
}
