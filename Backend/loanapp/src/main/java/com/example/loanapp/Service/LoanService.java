package com.example.loanapp.Service;

import com.example.loanapp.DTO.LoanDTO;
import com.example.loanapp.Entity.Loan;
import com.example.loanapp.Entity.Loan.LoanStatus;
import com.example.loanapp.Entity.Repayment;
import com.example.loanapp.Entity.User;
import com.example.loanapp.Exception.LoanProcessingException;
import com.example.loanapp.Exception.ResourceNotFoundException;
import com.example.loanapp.Repository.LoanRepository;
import com.example.loanapp.Repository.RepaymentRepository;
import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
public class LoanService {

    private final LoanRepository loanRepository;
    private final RepaymentRepository repaymentRepository;
    private final UserService userService;
    private final CreditScoreService creditScoreService;
    private final NotificationService notificationService;

    public LoanService(LoanRepository loanRepository,
                       RepaymentRepository repaymentRepository,
                       @Lazy UserService userService,
                       CreditScoreService creditScoreService,
                       NotificationService notificationService) {
        this.loanRepository = loanRepository;
        this.repaymentRepository = repaymentRepository;
        this.userService = userService;
        this.creditScoreService = creditScoreService;
        this.notificationService = notificationService;
    }

    // --- 👤 User Endpoints ---

    @Transactional
    public LoanDTO.Response createLoan(String userEmail, LoanDTO.CreateRequest request) {
        User user = userService.getUserEntityByEmail(userEmail);

        // Check active loan limits
        List<LoanStatus> activeStatuses = List.of(LoanStatus.APPROVED, LoanStatus.DISBURSED, LoanStatus.REPAYING);
        long activeCount = loanRepository.findByUserId(user.getId()).stream()
                .filter(l -> activeStatuses.contains(l.getStatus()))
                .count();

        if (activeCount >= 3) {
            throw new LoanProcessingException("Maximum limit of 3 active loans reached.");
        }

        Integer creditScore = user.getCreditScore() != null ? user.getCreditScore() : creditScoreService.calculateCreditScore(user);
        BigDecimal interestRate = calculateInterestRate(creditScore, request.getTermMonths());
        BigDecimal monthlyPayment = calculateMonthlyPayment(request.getAmount(), interestRate, request.getTermMonths());

        Loan loan = Loan.builder()
                .user(user)
                .amount(request.getAmount())
                .termMonths(request.getTermMonths())
                .purpose(request.getPurpose())
                .creditScore(creditScore)
                .interestRate(interestRate)
                .monthlyPayment(monthlyPayment)
                .status(LoanStatus.PENDING)
                .appliedDate(LocalDate.now())
                .totalRepaid(BigDecimal.ZERO)
                .build();

        Loan savedLoan = loanRepository.save(loan);
        notificationService.sendLoanApplicationNotification(user, savedLoan);

        log.info("New loan application submitted by {}: Loan ID {}", userEmail, savedLoan.getId());
        return convertToResponse(savedLoan);
    }

    /**
     * Resolves the 404 in Controller and populates Dashboard Stats.
     */
    public LoanDTO.Summary getUserLoanSummary(String email) {
        User user = userService.getUserEntityByEmail(email);
        List<Loan> loans = loanRepository.findByUserId(user.getId());

        BigDecimal borrowed = BigDecimal.ZERO;
        BigDecimal repaid = BigDecimal.ZERO;
        BigDecimal monthly = BigDecimal.ZERO;

        List<Loan.LoanStatus> activeStatuses = List.of(
                Loan.LoanStatus.APPROVED,
                Loan.LoanStatus.DISBURSED,
                Loan.LoanStatus.REPAYING
        );

        int activeCount = 0;
        for (Loan l : loans) {
            if (activeStatuses.contains(l.getStatus())) {
                borrowed = borrowed.add(l.getAmount());
                repaid = repaid.add(l.getTotalRepaid() != null ? l.getTotalRepaid() : BigDecimal.ZERO);
                monthly = monthly.add(l.getMonthlyPayment() != null ? l.getMonthlyPayment() : BigDecimal.ZERO);
                activeCount++;
            }
        }

        // Return the actual DTO instead of a Map
        return LoanDTO.Summary.builder()
                .totalBorrowed(borrowed)
                .totalRepaid(repaid)
                .activeLoans(activeCount)
                .monthlyPayment(monthly)

                .availableCredit(BigDecimal.valueOf(100000).subtract(borrowed).max(BigDecimal.ZERO))
                .pendingDue(0)
                .build();
    }
    // --- 🛠️ Admin/Officer Endpoints ---

    @Transactional
    public LoanDTO.Response approveLoan(String loanId, String adminId, String notes) {
        Loan loan = getLoanEntityById(loanId);

        if (loan.getStatus() != LoanStatus.PENDING) {
            throw new LoanProcessingException("Only PENDING loans can be approved.");
        }

        loan.setStatus(LoanStatus.APPROVED);
        loan.setReviewedDate(LocalDate.now());
        loan.setReviewedBy(adminId);
        loan.setDueDate(LocalDate.now().plusMonths(loan.getTermMonths()));

        generateRepaymentSchedule(loan);

        return convertToResponse(loanRepository.save(loan));
    }

    @Transactional
    public LoanDTO.Response rejectLoan(String loanId, String adminId, String reason) {
        Loan loan = getLoanEntityById(loanId);

        if (loan.getStatus() != LoanStatus.PENDING) {
            throw new LoanProcessingException("Only PENDING loans can be rejected.");
        }

        loan.setStatus(LoanStatus.REJECTED);
        loan.setRejectionReason(reason);
        loan.setReviewedBy(adminId);
        loan.setReviewedDate(LocalDate.now());

        return convertToResponse(loanRepository.save(loan));
    }

    @Transactional
    public LoanDTO.Response disburseLoan(String loanId) {
        Loan loan = getLoanEntityById(loanId);

        if (loan.getStatus() != LoanStatus.APPROVED) {
            throw new LoanProcessingException("Only approved loans can be disbursed.");
        }

        loan.setStatus(LoanStatus.DISBURSED);
        loan.setDisbursedDate(LocalDate.now());

        // Update repayment dates based on actual disbursement
        List<Repayment> schedule = repaymentRepository.findByLoanIdOrderByDueDateAsc(loanId);
        for (int i = 0; i < schedule.size(); i++) {
            schedule.get(i).setDueDate(LocalDate.now().plusMonths(i + 1));
        }
        repaymentRepository.saveAll(schedule);

        return convertToResponse(loanRepository.save(loan));
    }

    // --- Data Retrieval ---

    public LoanDTO.Response getLoanById(String id) {
        return convertToResponse(getLoanEntityById(id));
    }

    public Page<LoanDTO.Response> getAllLoans(Pageable pageable) {
        return loanRepository.findAll(pageable).map(this::convertToResponse);
    }

    public Page<LoanDTO.Response> getUserLoans(String userEmail, Pageable pageable) {
        User user = userService.getUserEntityByEmail(userEmail);
        return loanRepository.findByUserId(user.getId(), pageable).map(this::convertToResponse);
    }

    // --- Internal Helpers ---

    private Loan getLoanEntityById(String id) {
        return loanRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Loan not found: " + id));
    }

    /**
     * Maps Entity to DTO and includes Repayment details for the Frontend.
     */
    private LoanDTO.Response convertToResponse(Loan loan) {
        List<Repayment> repayments = repaymentRepository.findByLoanIdOrderByDueDateAsc(loan.getId());

        return LoanDTO.Response.builder()
                .id(loan.getId())
                .amount(loan.getAmount())
                .termMonths(loan.getTermMonths())
                .purpose(loan.getPurpose().name())
                .status(loan.getStatus().name())
                .interestRate(loan.getInterestRate())
                .monthlyPayment(loan.getMonthlyPayment())
                .creditScore(loan.getCreditScore())
                .appliedDate(loan.getAppliedDate())
                .reviewedDate(loan.getReviewedDate())
                .reviewedBy(loan.getReviewedBy())
                .userId(loan.getUser().getId())
                .userName(loan.getUser().getName())
                .totalRepaid(loan.getTotalRepaid())
                .dueDate(loan.getDueDate())
                // Ensure repayments are passed so the Dashboard "Pay Now" logic triggers
                .repayments(repayments != null ? repayments.stream()
                        .map(this::mapToRepaymentDTO)
                        .collect(Collectors.toList()) : new ArrayList<>())
                .build();
    }

    private LoanDTO.RepaymentDTO mapToRepaymentDTO(Repayment repayment) {
        return LoanDTO.RepaymentDTO.builder()
                .id(repayment.getId())
                .loanId(repayment.getLoan().getId())
                .installmentNumber(repayment.getInstallmentNumber())
                .amount(repayment.getAmount())
                .dueDate(repayment.getDueDate())
                .status(repayment.getStatus().name())
                .paidDate(repayment.getPaidDate())
                .build();
    }

    private BigDecimal calculateInterestRate(Integer score, Integer months) {
        double base = 12.0; // Slightly higher default base
        if (score >= 750) base -= 4.0;
        else if (score >= 650) base -= 2.0;
        if (months > 36) base += 2.0;
        return BigDecimal.valueOf(base);
    }

    private BigDecimal calculateMonthlyPayment(BigDecimal principal, BigDecimal annualRate, int months) {
        // Amortization Formula: [P * r * (1 + r)^n] / [(1 + r)^n – 1]
        BigDecimal monthlyRate = annualRate.divide(BigDecimal.valueOf(1200), 10, RoundingMode.HALF_UP);
        BigDecimal factor = BigDecimal.ONE.add(monthlyRate).pow(months);

        return principal.multiply(monthlyRate.multiply(factor))
                .divide(factor.subtract(BigDecimal.ONE), 2, RoundingMode.HALF_UP);
    }

    private void generateRepaymentSchedule(Loan loan) {
        List<Repayment> schedule = new ArrayList<>();
        for (int i = 1; i <= loan.getTermMonths(); i++) {
            schedule.add(Repayment.builder()
                    .loan(loan)
                    .installmentNumber(i)
                    .amount(loan.getMonthlyPayment())
                    .dueDate(LocalDate.now().plusMonths(i))
                    .status(Repayment.RepaymentStatus.PENDING)
                    .build());
        }
        repaymentRepository.saveAll(schedule);
        log.info("Generated schedule for Loan ID {}: {} installments", loan.getId(), loan.getTermMonths());
    }
}