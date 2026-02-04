package com.example.loanapp.Service;

import com.example.loanapp.DTO.LoanDTO;
import com.example.loanapp.Entity.Loan;
import com.example.loanapp.Entity.Repayment;
import com.example.loanapp.Entity.User;
import com.example.loanapp.Exception.LoanProcessingException;
import com.example.loanapp.Exception.ResourceNotFoundException;
import com.example.loanapp.Repository.LoanRepository;
import com.example.loanapp.Repository.RepaymentRepository;
import jakarta.transaction.Transactional;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

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

    @Transactional
    public Loan createLoan(String userId, LoanDTO.CreateRequest request) {
        User user = userService.getUserById(userId);

        List<Loan> activeLoans = loanRepository.findByUserIdAndStatus(userId, Loan.LoanStatus.REPAYING);
        if (activeLoans.size() >= 3) {
            throw new LoanProcessingException("Maximum number of active loans reached");
        }

        Integer creditScore = creditScoreService.calculateCreditScore(user);
        BigDecimal interestRate = calculateInterestRate(creditScore, request.getTermMonths());
        BigDecimal monthlyPayment = calculateMonthlyPayment(request.getAmount(), interestRate, request.getTermMonths());

        Loan loan = new Loan();
        loan.setUser(user);
        loan.setAmount(request.getAmount());
        loan.setTermMonths(request.getTermMonths());
        loan.setPurpose(request.getPurpose());
        loan.setCreditScore(creditScore);
        loan.setInterestRate(interestRate);
        loan.setMonthlyPayment(monthlyPayment);
        loan.setStatus(Loan.LoanStatus.PENDING);
        loan.setAppliedDate(LocalDate.now());

        Loan savedLoan = loanRepository.save(loan);

        // Auto-approval logic
        if (creditScore >= 650 && request.getAmount().compareTo(BigDecimal.valueOf(50000)) <= 0) {
            approveLoan(savedLoan.getId(), "Auto-approved based on credit score");
        }

        notificationService.sendLoanApplicationNotification(user, savedLoan);
        return savedLoan;
    }

    @Transactional
    public Loan approveLoan(String loanId, String notes) {
        Loan loan = getLoanById(loanId);
        if (loan.getStatus() != Loan.LoanStatus.PENDING && loan.getStatus() != Loan.LoanStatus.UNDER_REVIEW) {
            throw new LoanProcessingException("Loan cannot be approved in current status");
        }

        loan.setStatus(Loan.LoanStatus.APPROVED);
        loan.setReviewedDate(LocalDate.now());
        loan.setReviewedBy("SYSTEM_AUTO");
        loan.setDueDate(LocalDate.now().plusMonths(loan.getTermMonths()));

        generateRepaymentSchedule(loan);
        Loan approvedLoan = loanRepository.save(loan);
        notificationService.sendLoanApprovalNotification(loan.getUser(), approvedLoan);
        return approvedLoan;
    }

    @Transactional
    public Loan rejectLoan(String loanId, String reason) {
        Loan loan = getLoanById(loanId);
        if (loan.getStatus() != Loan.LoanStatus.PENDING && loan.getStatus() != Loan.LoanStatus.UNDER_REVIEW) {
            throw new LoanProcessingException("Loan cannot be rejected in current status");
        }

        loan.setStatus(Loan.LoanStatus.REJECTED);
        loan.setReviewedDate(LocalDate.now());
        loan.setReviewedBy("SYSTEM_AUTO");
        loan.setRejectionReason(reason);

        Loan rejectedLoan = loanRepository.save(loan);
        notificationService.sendLoanRejectionNotification(loan.getUser(), rejectedLoan);
        return rejectedLoan;
    }

    @Transactional
    public Loan disburseLoan(String loanId) {
        Loan loan = getLoanById(loanId);
        if (loan.getStatus() != Loan.LoanStatus.APPROVED) {
            throw new LoanProcessingException("Only approved loans can be disbursed");
        }

        loan.setStatus(Loan.LoanStatus.DISBURSED);
        loan.setDisbursedDate(LocalDate.now());

        List<Repayment> repayments = repaymentRepository.findByLoanIdOrderByDueDateAsc(loanId);
        if (!repayments.isEmpty()) {
            // Update the first repayment date to be 1 month from disbursement
            Repayment firstRepayment = repayments.get(0);
            firstRepayment.setDueDate(LocalDate.now().plusMonths(1));
            repaymentRepository.save(firstRepayment);
        }

        return loanRepository.save(loan);
    }

    // ================== DATA RETRIEVAL METHODS ==================

    public Loan getLoanById(String id) {
        return loanRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Loan not found with ID: " + id));
    }

    public Page<Loan> getAllLoans(Pageable pageable) {
        return loanRepository.findAll(pageable);
    }

    public Page<Loan> getUserLoans(String userId, Pageable pageable) {
        return loanRepository.findByUserId(userId, pageable);
    }

    public List<Loan> findByUserId(String userId) {
        return loanRepository.findByUserId(userId);
    }

    public Page<Loan> getLoansByStatus(Loan.LoanStatus status, Pageable pageable) {
        return loanRepository.findByStatus(status, pageable);
    }

    // IMPORTANT: Required by LoanController for the Dashboard repayment list
    public List<Repayment> getRepaymentsByLoanId(String loanId) {
        return repaymentRepository.findByLoanIdOrderByDueDateAsc(loanId);
    }

    public LoanDTO.Summary getUserLoanSummary(String userId) {
        List<Loan> userLoans = loanRepository.findByUserId(userId);
        BigDecimal totalBorrowed = BigDecimal.ZERO;
        BigDecimal totalRepaid = BigDecimal.ZERO;
        int activeLoansCount = 0;
        int pendingDue = 0;
        BigDecimal monthlyPayment = BigDecimal.ZERO;

        for (Loan loan : userLoans) {
            if (loan.getStatus() == Loan.LoanStatus.REPAYING ||
                    loan.getStatus() == Loan.LoanStatus.DISBURSED ||
                    loan.getStatus() == Loan.LoanStatus.APPROVED) {

                totalBorrowed = totalBorrowed.add(loan.getAmount());
                totalRepaid = totalRepaid.add(loan.getTotalRepaid() != null ? loan.getTotalRepaid() : BigDecimal.ZERO);
                activeLoansCount++;
                monthlyPayment = monthlyPayment.add(loan.getMonthlyPayment() != null ? loan.getMonthlyPayment() : BigDecimal.ZERO);

                List<Repayment> pendingRepayments = repaymentRepository.findByLoanIdAndStatus(loan.getId(), Repayment.RepaymentStatus.PENDING);
                pendingDue += pendingRepayments.size();
            }
        }

        LoanDTO.Summary summary = new LoanDTO.Summary();
        summary.setTotalBorrowed(totalBorrowed);
        summary.setTotalRepaid(totalRepaid);
        summary.setActiveLoans(activeLoansCount);
        summary.setPendingDue(pendingDue);
        summary.setMonthlyPayment(monthlyPayment);
        summary.setAvailableCredit(BigDecimal.valueOf(100000).subtract(totalBorrowed).max(BigDecimal.ZERO));

        return summary;
    }

    // ================== CALCULATION UTILITIES ==================

    private BigDecimal calculateInterestRate(Integer creditScore, Integer termMonths) {
        BigDecimal baseRate = BigDecimal.valueOf(6.5);
        BigDecimal scoreAdj = (creditScore >= 750) ? BigDecimal.valueOf(-2.0) :
                (creditScore >= 700) ? BigDecimal.valueOf(-1.0) :
                        (creditScore >= 600) ? BigDecimal.valueOf(1.5) : BigDecimal.valueOf(3.0);

        BigDecimal termAdj = (termMonths > 60) ? BigDecimal.valueOf(1.0) :
                (termMonths > 36) ? BigDecimal.valueOf(0.5) : BigDecimal.ZERO;

        return baseRate.add(scoreAdj).add(termAdj);
    }

    private BigDecimal calculateMonthlyPayment(BigDecimal principal, BigDecimal annualRate, Integer months) {
        if (months == 0) return principal;
        BigDecimal monthlyRate = annualRate.divide(BigDecimal.valueOf(1200), 10, RoundingMode.HALF_UP);
        BigDecimal pow = BigDecimal.ONE.add(monthlyRate).pow(months);
        return principal.multiply(monthlyRate.multiply(pow)
                        .divide(pow.subtract(BigDecimal.ONE), 10, RoundingMode.HALF_UP))
                .setScale(2, RoundingMode.HALF_UP);
    }

    private void generateRepaymentSchedule(Loan loan) {
        List<Repayment> repayments = new ArrayList<>();
        for (int i = 1; i <= loan.getTermMonths(); i++) {
            Repayment r = new Repayment();
            r.setLoan(loan);
            r.setInstallmentNumber(i);
            r.setAmount(loan.getMonthlyPayment());
            r.setDueDate(LocalDate.now().plusMonths(i));
            r.setStatus(Repayment.RepaymentStatus.PENDING);
            repayments.add(r);
        }
        repaymentRepository.saveAll(repayments);
    }
}