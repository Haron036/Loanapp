package com.example.loanapp.Service;

import com.example.loanapp.Entity.Loan;
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
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class RepaymentService {

    private final RepaymentRepository repaymentRepository;
    private final LoanRepository loanRepository;
    private final MpesaService mpesaService;

    /**
     * Processes a payment for a specific pre-existing installment.
     */
    @Transactional
    public Repayment processPayment(String repaymentId, String paymentMethod) {
        Repayment repayment = repaymentRepository.findById(repaymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Repayment installment not found."));

        if (repayment.getStatus() == RepaymentStatus.PAID) {
            throw new IllegalStateException("This installment has already been paid.");
        }

        if ("MPESA".equalsIgnoreCase(paymentMethod)) {
            return initiateMpesaFlow(repayment);
        }

        // Handle other methods (e.g., WALLET) immediately
        return finalizePayment(repayment, paymentMethod);
    }

    /**
     * Processes a flexible (custom amount) payment for a loan.
     * Fixes the "not-null property references a null" error by providing an installmentNumber.
     */
    @Transactional
    public Repayment processFlexiblePayment(String loanId, BigDecimal amount, String paymentMethod) {
        Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new ResourceNotFoundException("Loan not found"));

        // Validation Logic
        validateFlexiblePayment(loan, amount);

        // Create the repayment record
        // FIX: Added installmentNumber(0) to satisfy database constraints for ad-hoc payments
        Repayment repayment = Repayment.builder()
                .loan(loan)
                .amount(amount)
                .dueDate(LocalDate.now())
                .installmentNumber(0)
                .status(RepaymentStatus.PENDING)
                .paymentMethod(paymentMethod)
                .build();

        // Save first to generate the ID required for the M-Pesa metadata
        repayment = repaymentRepository.save(repayment);

        if ("MPESA".equalsIgnoreCase(paymentMethod)) {
            return initiateMpesaFlow(repayment);
        }

        return finalizePayment(repayment, paymentMethod);
    }

    /**
     * Internal helper to handle M-Pesa STK Push initiation for any repayment type.
     */
    private Repayment initiateMpesaFlow(Repayment repayment) {
        try {
            String rawPhone = repayment.getLoan().getUser().getPhone();
            String formattedPhone = formatMpesaPhoneNumber(rawPhone);

            log.info("Initiating M-Pesa push for {} - Amount: {}", formattedPhone, repayment.getAmount());

            String checkoutId = mpesaService.initiateStkPush(
                    formattedPhone,
                    repayment.getAmount(),
                    repayment.getId()
            );

            if (checkoutId == null) {
                throw new RuntimeException("M-Pesa gateway failed to return a CheckoutID.");
            }

            repayment.setMpesaCheckoutId(checkoutId);
            return repaymentRepository.save(repayment);
        } catch (Exception e) {
            log.error("M-Pesa Service Error: {}", e.getMessage());
            throw new RuntimeException("Could not initiate M-Pesa payment: " + e.getMessage());
        }
    }

    /**
     * Finalizes the payment after successful M-Pesa callback or internal deduction.
     */
    @Transactional
    public void completeMpesaPayment(String checkoutRequestId) {
        Repayment repayment = repaymentRepository.findByMpesaCheckoutId(checkoutRequestId)
                .orElseThrow(() -> new ResourceNotFoundException("No record found for CheckoutID: " + checkoutRequestId));

        if (repayment.getStatus() != RepaymentStatus.PAID) {
            finalizePayment(repayment, "MPESA");
            log.info("M-Pesa payment CONFIRMED for Repayment ID: {}", repayment.getId());
        }
    }

    /**
     * Logic to update statuses and loan progress once money is confirmed.
     */
    private Repayment finalizePayment(Repayment repayment, String paymentMethod) {
        repayment.setStatus(RepaymentStatus.PAID);
        repayment.setPaidDate(LocalDate.now());
        repayment.setPaymentMethod(paymentMethod);

        Repayment savedRepayment = repaymentRepository.save(repayment);
        updateLoanProgress(repayment.getLoan(), repayment.getAmount());

        return savedRepayment;
    }

    /**
     * Updates the total repaid amount on the loan and checks for completion.
     */
    private void updateLoanProgress(Loan loan, BigDecimal paymentAmount) {
        BigDecimal totalPayable = loan.getAmount().add(
                loan.getAmount().multiply(loan.getInterestRate().divide(BigDecimal.valueOf(100)))
        );

        BigDecimal currentTotalRepaid = loan.getTotalRepaid() != null ? loan.getTotalRepaid() : BigDecimal.ZERO;
        BigDecimal newTotalRepaid = currentTotalRepaid.add(paymentAmount);

        loan.setTotalRepaid(newTotalRepaid);

        if (newTotalRepaid.compareTo(totalPayable) >= 0) {
            loan.setStatus(Loan.LoanStatus.COMPLETED);
            loan.setCompletedDate(LocalDate.now());
        } else {
            loan.setStatus(Loan.LoanStatus.REPAYING);
        }

        loanRepository.save(loan);
    }

    /**
     * Validates if a flexible payment is allowed.
     */
    private void validateFlexiblePayment(Loan loan, BigDecimal amount) {
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Payment amount must be greater than zero.");
        }

        BigDecimal totalPayable = loan.getAmount().add(
                loan.getAmount().multiply(loan.getInterestRate().divide(BigDecimal.valueOf(100)))
        );
        BigDecimal remainingBalance = totalPayable.subtract(
                loan.getTotalRepaid() != null ? loan.getTotalRepaid() : BigDecimal.ZERO
        );

        if (amount.compareTo(remainingBalance) > 0) {
            throw new IllegalArgumentException("Amount exceeds remaining balance: " + remainingBalance);
        }
    }

    /**
     * Ensures phone numbers are in the format: 2547XXXXXXXX
     */
    private String formatMpesaPhoneNumber(String phone) {
        if (phone == null || phone.isBlank()) {
            throw new IllegalArgumentException("Phone number is required for M-Pesa.");
        }
        String clean = phone.replaceAll("[^0-9]", "");

        if (clean.startsWith("0")) return "254" + clean.substring(1);
        if (clean.startsWith("254")) return clean;
        if (clean.length() == 9) return "254" + clean;

        return clean;
    }
}