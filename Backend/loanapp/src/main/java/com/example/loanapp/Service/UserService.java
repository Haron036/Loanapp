package com.example.loanapp.Service;

import com.example.loanapp.DTO.AuthDTO;
import com.example.loanapp.DTO.LoanDTO;
import com.example.loanapp.DTO.UserDTO;
import com.example.loanapp.Entity.AuditLog;
import com.example.loanapp.Entity.Loan.LoanStatus;
import com.example.loanapp.Entity.User;
import com.example.loanapp.Exception.ResourceNotFoundException;
import com.example.loanapp.Exception.UserAlreadyExistsException;
import com.example.loanapp.Repository.AuditLogRepository;
import com.example.loanapp.Repository.LoanRepository;
import com.example.loanapp.Repository.RepaymentRepository;
import com.example.loanapp.Repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
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

    // Use Constructor Injection with @Lazy to solve the Circular Dependency
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

    // --- Authentication ---
    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        // User entity already implements UserDetails
        return getUserEntityByEmail(email);
    }

    // --- Registration & Admin Creation ---
    @Transactional
    public User registerUser(AuthDTO.RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new UserAlreadyExistsException("Email already registered");
        }

        User user = buildBaseUser(request);
        user.setRole(User.Role.USER);
        user.setCreditScore(creditScoreService.calculateCreditScore(user));

        User savedUser = userRepository.save(user);

        try {
            emailService.sendWelcomeEmail(savedUser);
        } catch (Exception e) {
            log.warn("Welcome email failed: {}", e.getMessage());
        }

        saveAuditLog("REGISTER", "USER", savedUser.getId(), savedUser.getId(), "User self-registered");
        return savedUser;
    }

    @Transactional
    public User createAdminUser(AuthDTO.RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new UserAlreadyExistsException("Email already registered");
        }

        User admin = buildBaseUser(request);
        admin.setRole(User.Role.ADMIN);
        admin.setCreditScore(850);

        User savedAdmin = userRepository.save(admin);

        saveAuditLog("ADMIN_CREATE", "USER", savedAdmin.getId(), "SYSTEM", "New Admin account provisioned");
        return savedAdmin;
    }

    private User buildBaseUser(AuthDTO.RegisterRequest request) {
        return User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .address(request.getAddress())
                .city(request.getCity())
                .state(request.getState())
                .zipCode(request.getZipCode())
                .dateOfBirth(request.getDateOfBirth())
                .annualIncome(request.getAnnualIncome())
                .employmentType(request.getEmploymentType())
                .monthlyDebt(request.getMonthlyDebt() != null ? request.getMonthlyDebt() : 0.0)
                .enabled(true)
                .accountNonLocked(true)
                .accountNonExpired(true)
                .credentialsNonExpired(true)
                .existingLoansCount(0)
                .createdAt(LocalDateTime.now())
                .build();
    }

    // --- Profile & Admin Views ---
    public UserDTO.ProfileResponse getUserProfile(String email) {
        User user = getUserEntityByEmail(email);

        // FIX: Match method name in LoanService and use email instead of ID
        LoanDTO.Summary loanSummary = loanService.getUserLoanSummary(user.getEmail());

        List<UserDTO.ActivityDTO> activities = auditLogRepository.findRecentByUserId(user.getId(), Pageable.ofSize(10))
                .stream()
                .map(logEntry -> new UserDTO.ActivityDTO(
                        logEntry.getId().toString(), logEntry.getAction(), logEntry.getDetails(),
                        logEntry.getEntityType(), logEntry.getEntityId(), logEntry.getTimestamp(), logEntry.getIpAddress()))
                .collect(Collectors.toList());

        return UserDTO.convertToProfileResponse(user, loanSummary, activities);
    }

    public UserDTO.PaginatedResponse getAllUsers(Pageable pageable) {
        Page<User> userPage = userRepository.findAll(pageable);
        List<UserDTO.Response> users = userPage.getContent().stream()
                .map(UserDTO::convertToResponse)
                .collect(Collectors.toList());

        UserDTO.PaginatedResponse response = new UserDTO.PaginatedResponse();
        response.setUsers(users);
        response.setCurrentPage(userPage.getNumber());
        response.setTotalPages(userPage.getTotalPages());
        response.setTotalItems(userPage.getTotalElements());
        response.setPageSize(userPage.getSize());
        response.setHasNext(userPage.hasNext());
        response.setHasPrevious(userPage.hasPrevious());
        return response;
    }

    public UserDTO.AdminResponse getUserForAdmin(String userId) {
        User user = getUserById(userId);
        UserDTO.UserStats stats = calculateUserStats(userId);
        return UserDTO.convertToAdminResponse(user, stats);
    }

    // --- Statistics ---
    private UserDTO.UserStats calculateUserStats(String userId) {
        UserDTO.UserStats stats = new UserDTO.UserStats();

        stats.setTotalLoanApplications(loanRepository.countByUserId(userId));
        stats.setApprovedLoans(loanRepository.countByUserIdAndStatus(userId, LoanStatus.APPROVED));
        stats.setRejectedLoans(loanRepository.countByUserIdAndStatus(userId, LoanStatus.REJECTED));

        BigDecimal borrowed = loanRepository.sumAmountByUserIdAndStatusIn(
                userId, Arrays.asList(LoanStatus.APPROVED, LoanStatus.DISBURSED, LoanStatus.REPAYING, LoanStatus.COMPLETED));
        stats.setTotalBorrowed(borrowed != null ? borrowed : BigDecimal.ZERO);

        BigDecimal repaid = repaymentRepository.sumPaidAmountByUserId(userId);
        stats.setTotalRepaid(repaid != null ? repaid : BigDecimal.ZERO);

        long totalRepayments = repaymentRepository.countByLoan_User_Id(userId);
        if (totalRepayments > 0) {
            long onTime = repaymentRepository.countByUserIdAndPaidOnTime(userId);
            stats.setOnTimeRepaymentRate(BigDecimal.valueOf(onTime)
                    .multiply(BigDecimal.valueOf(100))
                    .divide(BigDecimal.valueOf(totalRepayments), 2, RoundingMode.HALF_UP));
        } else {
            stats.setOnTimeRepaymentRate(BigDecimal.ZERO);
        }

        return stats;
    }

    // --- Utilities ---
    public User getUserById(String userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found ID: " + userId));
    }

    public User getUserEntityByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Email not found: " + email));
    }

    public String encodePassword(String rawPassword) {
        return passwordEncoder.encode(rawPassword);
    }

    private void saveAuditLog(String action, String type, String entityId, String userId, String details) {
        AuditLog auditLog = AuditLog.builder()
                .action(action).entityType(type).entityId(entityId)
                .userId(userId).details(details).timestamp(LocalDateTime.now())
                .ipAddress("0.0.0.0").build();
        auditLogRepository.save(auditLog);
    }
}