package com.example.loanapp.Service;

import com.example.loanapp.DTO.AuthDTO;
import com.example.loanapp.DTO.LoanDTO;
import com.example.loanapp.DTO.UserDTO;
import com.example.loanapp.Entity.AuditLog;
import com.example.loanapp.Entity.Loan;
import com.example.loanapp.Entity.User;
import com.example.loanapp.Exception.ResourceNotFoundException;
import com.example.loanapp.Exception.UserAlreadyExistsException;
import com.example.loanapp.Repository.AuditLogRepository;
import com.example.loanapp.Repository.LoanRepository;
import com.example.loanapp.Repository.RepaymentRepository;
import com.example.loanapp.Repository.UserRepository;
import jakarta.transaction.Transactional;
import jakarta.validation.ValidationException;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class UserService implements UserDetailsService {

    private final UserRepository userRepository;
    private final LoanRepository loanRepository;
    private final RepaymentRepository repaymentRepository;
    private final AuditLogRepository auditLogRepository;
    private final PasswordEncoder passwordEncoder;
    private final CreditScoreService creditScoreService;
    private final EmailService emailService;
    private final LoanService loanService;

    // Manual constructor to handle @Lazy LoanService correctly
    public UserService(UserRepository userRepository,
                       LoanRepository loanRepository,
                       RepaymentRepository repaymentRepository,
                       AuditLogRepository auditLogRepository,
                       PasswordEncoder passwordEncoder,
                       CreditScoreService creditScoreService,
                       EmailService emailService,
                       @Lazy LoanService loanService) {
        this.userRepository = userRepository;
        this.loanRepository = loanRepository;
        this.repaymentRepository = repaymentRepository;
        this.auditLogRepository = auditLogRepository;
        this.passwordEncoder = passwordEncoder;
        this.creditScoreService = creditScoreService;
        this.emailService = emailService;
        this.loanService = loanService;
    }

    /**
     * Updated to use AuthDTO.RegisterRequest to match the AuthController
     */
    @Transactional
    public User registerUser(AuthDTO.RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new UserAlreadyExistsException("Email '" + request.getEmail() + "' is already registered");
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setPhone(request.getPhone());
        user.setAddress(request.getAddress());
        user.setCity(request.getCity());
        user.setState(request.getState());
        user.setZipCode(request.getZipCode());
        user.setDateOfBirth(request.getDateOfBirth());
        user.setAnnualIncome(request.getAnnualIncome());
        user.setEmploymentType(request.getEmploymentType());
        user.setMonthlyDebt(request.getMonthlyDebt() != null ? request.getMonthlyDebt() : 0.0);

        // Default values for new users
        user.setExistingLoansCount(0);
        user.setRole(User.Role.USER);
        user.setEnabled(true);
        user.setCreatedAt(LocalDateTime.now());
        user.setAccountNonLocked(true);

        // Initial credit score calculation
        user.setCreditScore(creditScoreService.calculateCreditScore(user));

        User savedUser = userRepository.save(user);

        // Post-registration actions
        try {
            emailService.sendWelcomeEmail(savedUser);
        } catch (Exception e) {
            // Log email failure but don't roll back registration
            System.err.println("Failed to send welcome email: " + e.getMessage());
        }

        saveAuditLog("REGISTER", "USER", savedUser.getId(), savedUser.getId(), "User self-registered via Auth portal", "0.0.0.0");

        return savedUser;
    }

    /* ================= GETTERS & AUTH ================= */

    public User getUserEntityByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User with email " + email + " not found"));
    }

    @Override
    @Transactional
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = getUserEntityByEmail(email);
        return org.springframework.security.core.userdetails.User.builder()
                .username(user.getEmail())
                .password(user.getPassword())
                .authorities(user.getRole().name()) // Roles are usually stored as Authorities
                .disabled(!user.isEnabled())
                .accountLocked(!user.isAccountNonLocked())
                .build();
    }

    /* ================= PROFILE & STATS ================= */

    public UserDTO.ProfileResponse getUserProfile(String userId) {
        User user = getUserById(userId);
        LoanDTO.Summary loanSummary = loanService.getUserLoanSummary(userId);

        List<UserDTO.ActivityDTO> activities =
                auditLogRepository.findRecentByUserId(userId, Pageable.ofSize(10))
                        .stream()
                        .map(this::mapToActivityDTO)
                        .collect(Collectors.toList());

        return UserDTO.convertToProfileResponse(user, loanSummary, activities);
    }

    public UserDTO.Response getUserResponseByEmail(String email) {
        return UserDTO.convertToResponse(getUserEntityByEmail(email));
    }

    @Transactional
    public void changePassword(String userId, UserDTO.ChangePasswordRequest request) {
        User user = getUserById(userId);
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new ValidationException("Current password incorrect");
        }
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    public UserDTO.AdminResponse getUserForAdmin(String userId) {
        User user = getUserById(userId);
        UserDTO.UserStats stats = calculateUserStats(userId);
        return UserDTO.convertToAdminResponse(user, stats);
    }

    public UserDTO.PaginatedResponse getAllUsers(Pageable pageable) {
        Page<User> userPage = userRepository.findAll(pageable);
        List<UserDTO.Response> users = userPage.getContent()
                .stream()
                .map(UserDTO::convertToResponse)
                .collect(Collectors.toList());

        UserDTO.PaginatedResponse response = new UserDTO.PaginatedResponse();
        response.setUsers(users);
        response.setCurrentPage(userPage.getNumber());
        response.setTotalPages(userPage.getTotalPages());
        response.setTotalItems(userPage.getTotalElements());
        return response;
    }

    private UserDTO.UserStats calculateUserStats(String userId) {
        UserDTO.UserStats stats = new UserDTO.UserStats();
        stats.setTotalLoanApplications(loanRepository.countByUserId(userId));
        stats.setApprovedLoans(loanRepository.countByUserIdAndStatus(userId, Loan.LoanStatus.APPROVED));
        stats.setRejectedLoans(loanRepository.countByUserIdAndStatus(userId, Loan.LoanStatus.REJECTED));

        BigDecimal borrowed = loanRepository.sumAmountByUserIdAndStatusIn(
                userId, List.of(Loan.LoanStatus.APPROVED, Loan.LoanStatus.REPAYING, Loan.LoanStatus.COMPLETED));
        stats.setTotalBorrowed(borrowed != null ? borrowed : BigDecimal.ZERO);

        BigDecimal repaid = repaymentRepository.sumPaidAmountByUserId(userId);
        stats.setTotalRepaid(repaid != null ? repaid : BigDecimal.ZERO);

        long totalRepayments = repaymentRepository.countByLoan_User_Id(userId);
        long onTime = repaymentRepository.countByUserIdAndPaidOnTime(userId);
        stats.setOnTimeRepaymentRate(totalRepayments > 0 ? BigDecimal.valueOf((onTime * 100.0) / totalRepayments) : BigDecimal.ZERO);

        return stats;
    }

    /* ================= UTILS ================= */

    public User getUserById(String id) {
        return userRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + id));
    }

    private void saveAuditLog(String action, String type, String entityId, String userId, String details, String ip) {
        AuditLog log = new AuditLog();
        log.setAction(action);
        log.setEntityType(type);
        log.setEntityId(entityId);
        log.setUserId(userId);
        log.setDetails(details);
        log.setIpAddress(ip != null ? ip : "0.0.0.0");
        log.setTimestamp(LocalDateTime.now());
        auditLogRepository.save(log);
    }

    private UserDTO.ActivityDTO mapToActivityDTO(AuditLog log) {
        return new UserDTO.ActivityDTO(
                log.getId().toString(),
                log.getAction(),
                log.getDetails(),
                log.getEntityType(),
                log.getEntityId(),
                log.getTimestamp(),
                log.getIpAddress()
        );
    }
}