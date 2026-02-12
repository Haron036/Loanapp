package com.example.loanapp.Service;

import com.example.loanapp.Entity.Loan;
import com.example.loanapp.Entity.Loan.LoanStatus;
import com.example.loanapp.Entity.Repayment;
import com.example.loanapp.Entity.Repayment.RepaymentStatus;
import com.example.loanapp.Exception.ResourceNotFoundException;
import com.example.loanapp.Repository.LoanRepository;
import com.example.loanapp.Repository.RepaymentRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class RepaymentService {

    private final RepaymentRepository repaymentRepository;
    private final LoanRepository loanRepository;
    private final MpesaService mpesaService;

    /**
     * Processes a payment or initiates an M-Pesa STK Push.
     */
    @Transactional
    public Repayment processPayment(String repaymentId, String paymentMethod) {
        Repayment repayment = repaymentRepository.findById(repaymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Repayment installment not found."));

        if (repayment.getStatus() == RepaymentStatus.PAID) {
            throw new IllegalStateException("This installment has already been paid.");
        }

        if ("MPESA".equalsIgnoreCase(paymentMethod)) {
            // 1. Sanitize the phone number to 254XXXXXXXXX format
            String rawPhone = repayment.getLoan().getUser().getPhone();
            String formattedPhone = formatMpesaPhoneNumber(rawPhone);

            log.info("Initiating M-Pesa push for {} - Amount: {}", formattedPhone, repayment.getAmount());

            // 2. Trigger STK Push via MpesaService
            try {
                String checkoutId = mpesaService.initiateStkPush(formattedPhone, repayment.getAmount(), repaymentId);

                if (checkoutId != null) {
                    repayment.setMpesaCheckoutId(checkoutId);
                    // Note: We do NOT mark as PAID here. We wait for the callback.
                    return repaymentRepository.save(repayment);
                } else {
                    throw new RuntimeException("Daraja API returned a null CheckoutID. Check backend logs.");
                }
            } catch (Exception e) {
                log.error("M-Pesa Service Error: {}", e.getMessage());
                throw new RuntimeException("M-Pesa Communication Error: " + e.getMessage());
            }
        }

        // Standard logic for immediate payments (e.g. WALLET)
        return finalizePayment(repayment, paymentMethod);
    }

    /**
     * Sanitizes phone numbers to the strict format required by Safaricom.
     * Converts: 0712345678 -> 254712345678
     * Converts: +254712345678 -> 254712345678
     */
    private String formatMpesaPhoneNumber(String phone) {
        if (phone == null || phone.isEmpty()) {
            throw new IllegalArgumentException("User phone number is missing.");
        }
        // Remove all non-numeric characters (spaces, +, dashes)
        String clean = phone.replaceAll("[^0-9]", "");

        if (clean.startsWith("0")) {
            return "254" + clean.substring(1);
        } else if (clean.startsWith("254")) {
            return clean;
        } else if (clean.length() == 9) { // handles 712345678
            return "254" + clean;
        }

        return clean;
    }

    /**
     * Finalizes the payment after successful M-Pesa callback or Wallet deduction.
     */
    @Transactional
    public void completeMpesaPayment(String checkoutRequestId) {
        Repayment repayment = repaymentRepository.findByMpesaCheckoutId(checkoutRequestId)
                .orElseThrow(() -> new ResourceNotFoundException("No repayment found for CheckoutID: " + checkoutRequestId));

        if (repayment.getStatus() != RepaymentStatus.PAID) {
            finalizePayment(repayment, "MPESA");
            log.info("M-Pesa payment CONFIRMED and marked as PAID for ID: {}", repayment.getId());
        }
    }

    private Repayment finalizePayment(Repayment repayment, String paymentMethod) {
        repayment.setStatus(RepaymentStatus.PAID);
        repayment.setPaidDate(LocalDate.now());
        repayment.setPaymentMethod(paymentMethod);
        Repayment savedRepayment = repaymentRepository.save(repayment);

        updateLoanProgress(repayment.getLoan().getId(), repayment.getAmount());
        return savedRepayment;
    }

    private void updateLoanProgress(String loanId, BigDecimal paymentAmount) {
        Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new ResourceNotFoundException("Associated loan not found."));

        BigDecimal currentRepaid = loan.getTotalRepaid() != null ? loan.getTotalRepaid() : BigDecimal.ZERO;
        loan.setTotalRepaid(currentRepaid.add(paymentAmount));

        List<Repayment> allRepayments = repaymentRepository.findByLoanIdOrderByDueDateAsc(loanId);
        boolean isFullyPaid = allRepayments.stream()
                .allMatch(r -> r.getStatus() == RepaymentStatus.PAID);

        if (isFullyPaid) {
            loan.setStatus(LoanStatus.COMPLETED);
            loan.setCompletedDate(LocalDate.now());
        } else {
            loan.setStatus(LoanStatus.REPAYING);
        }

        loanRepository.save(loan);
    }
}