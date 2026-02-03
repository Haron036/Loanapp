package com.example.loanapp.DTO;

import com.example.loanapp.Entity.User;
import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;
import java.util.List;

public class UserDTO {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RegisterRequest {
        @NotBlank(message = "Name is required")
        private String name;
        @NotBlank(message = "Email is required")
        @Email
        private String email;
        @NotBlank(message = "Password is required")
        @Size(min = 6)
        private String password;
        @NotBlank(message = "Phone number is required")
        private String phone;
        @NotBlank(message = "Address is required")
        private String address;
        @NotBlank(message = "City is required")
        private String city;
        @NotBlank(message = "State is required")
        private String state;
        @NotBlank(message = "ZIP code is required")
        private String zipCode;
        @NotNull(message = "Date of birth is required")
        @JsonFormat(pattern = "yyyy-MM-dd")
        private LocalDate dateOfBirth;
        @NotNull(message = "Annual income is required")
        private Double annualIncome;
        @NotBlank(message = "Employment type is required")
        private String employmentType;
        private Double monthlyDebt = 0.0;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateProfileRequest {
        private String name;
        private String phone;
        private String address;
        private String city;
        private String state;
        private String zipCode;
        private String ssnLastFour;
        private LocalDate dateOfBirth;
        private Double annualIncome;
        private String employmentType;
        private Double monthlyDebt;
        private Integer existingLoansCount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateUserRequest {
        private String name;
        private String email;
        private String phone;
        private User.Role role;
        private Boolean enabled;
        private Boolean accountNonLocked;
        private Integer creditScore;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChangePasswordRequest {
        @NotBlank(message = "Current password is required")
        private String currentPassword;
        @NotBlank(message = "New password is required")
        @Size(min = 6)
        private String newPassword;
        @NotBlank(message = "Confirm password is required")
        private String confirmPassword;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private String id;
        private String name;
        private String email;
        private String phone;
        private String role;
        private String address;
        private String city;
        private String state;
        private String zipCode;
        private String ssnLastFour;
        private LocalDate dateOfBirth;
        private Integer age;
        private Integer creditScore;
        private String creditScoreCategory;
        private Double annualIncome;
        private String employmentType;
        private Integer existingLoansCount;
        private Double monthlyDebt;
        private Double debtToIncomeRatio;
        private Boolean enabled;
        private Boolean accountNonLocked;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        private Long totalLoans;
        private Long activeLoans;
        private Long completedLoans;
        private BigDecimal totalBorrowed;
        private BigDecimal totalRepaid;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProfileResponse {
        private String id;
        private String name;
        private String email;
        private String phone;
        private String address;
        private String city;
        private String state;
        private String zipCode;
        private LocalDate dateOfBirth;
        private Integer age;
        private Integer creditScore;
        private String creditScoreCategory;
        private Double annualIncome;
        private String employmentType;
        private Integer existingLoansCount;
        private Double monthlyDebt;
        private Double debtToIncomeRatio;
        private LocalDateTime createdAt;
        private LoanDTO.Summary loanSummary;
        private List<ActivityDTO> recentActivities;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AdminResponse {
        private String id;
        private String name;
        private String email;
        private String phone;
        private String role;
        private String address;
        private String city;
        private String state;
        private String zipCode;
        private LocalDate dateOfBirth;
        private Integer creditScore;
        private String creditScoreCategory;
        private Double annualIncome;
        private String employmentType;
        private Integer existingLoansCount;
        private Double monthlyDebt;
        private Boolean enabled;
        private Boolean accountNonLocked;
        private Boolean accountNonExpired;
        private Boolean credentialsNonExpired;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        private LocalDateTime lastLoginAt;
        private Long totalLoanApplications;
        private Long approvedLoans;
        private Long rejectedLoans;
        private BigDecimal totalBorrowed;
        private BigDecimal totalRepaid;
        private BigDecimal onTimeRepaymentRate;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ActivityDTO {
        private String id;
        private String action;
        private String description;
        private String entityType;
        private String entityId;
        private LocalDateTime timestamp;
        private String ipAddress;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserStats {
        private Long totalLoanApplications;
        private Long approvedLoans;
        private Long rejectedLoans;
        private BigDecimal totalBorrowed;
        private BigDecimal totalRepaid;
        private BigDecimal onTimeRepaymentRate;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PaginatedResponse {
        private List<UserDTO.Response> users;
        private int currentPage;
        private int totalPages;
        private long totalItems;
        private int pageSize;
        private boolean hasNext;
        private boolean hasPrevious;
    }

    // ==================== CONVERSION LOGIC ====================

    public static Response convertToResponse(User user) {
        Response dto = new Response();
        dto.setId(user.getId());
        dto.setName(user.getName());
        dto.setEmail(user.getEmail());
        dto.setPhone(user.getPhone());
        dto.setRole(user.getRole() != null ? user.getRole().name() : "USER");
        dto.setAddress(user.getAddress());
        dto.setCity(user.getCity());
        dto.setState(user.getState());
        dto.setZipCode(user.getZipCode());
        dto.setSsnLastFour(user.getSsnLastFour());
        dto.setDateOfBirth(user.getDateOfBirth());
        dto.setAge(user.getDateOfBirth() != null ? calculateAge(user.getDateOfBirth()) : 0);
        dto.setCreditScore(user.getCreditScore());
        dto.setCreditScoreCategory(getCategory(user.getCreditScore()));
        dto.setAnnualIncome(user.getAnnualIncome());
        dto.setEmploymentType(user.getEmploymentType());
        dto.setExistingLoansCount(user.getExistingLoansCount());
        dto.setMonthlyDebt(user.getMonthlyDebt());
        dto.setCreatedAt(user.getCreatedAt());
        dto.setUpdatedAt(user.getUpdatedAt());


        if (user.getAnnualIncome() != null && user.getAnnualIncome() > 0) {
            dto.setDebtToIncomeRatio(((user.getMonthlyDebt() != null ? user.getMonthlyDebt() : 0.0) * 12) / user.getAnnualIncome());
        }

        dto.setEnabled(user.isEnabled());
        dto.setAccountNonLocked(user.isAccountNonLocked());
        dto.setCreatedAt(user.getCreatedAt());
        dto.setUpdatedAt(user.getUpdatedAt());
        return dto;
    }

    public static ProfileResponse convertToProfileResponse(User user, LoanDTO.Summary loanSummary, List<ActivityDTO> activities) {
        ProfileResponse dto = new ProfileResponse();
        dto.setId(user.getId());
        dto.setName(user.getName());
        dto.setEmail(user.getEmail());
        dto.setPhone(user.getPhone());
        dto.setAddress(user.getAddress());
        dto.setCity(user.getCity());
        dto.setState(user.getState());
        dto.setZipCode(user.getZipCode());
        dto.setDateOfBirth(user.getDateOfBirth());
        dto.setAge(user.getDateOfBirth() != null ? calculateAge(user.getDateOfBirth()) : 0);
        dto.setCreditScore(user.getCreditScore());
        dto.setCreditScoreCategory(getCategory(user.getCreditScore()));
        dto.setAnnualIncome(user.getAnnualIncome());
        dto.setEmploymentType(user.getEmploymentType());
        dto.setCreatedAt(user.getCreatedAt());
        dto.setLoanSummary(loanSummary);
        dto.setRecentActivities(activities);
        return dto;
    }

    public static AdminResponse convertToAdminResponse(User user, UserStats stats) {
        AdminResponse dto = new AdminResponse();
        dto.setId(user.getId());
        dto.setName(user.getName());
        dto.setEmail(user.getEmail());
        dto.setRole(user.getRole() != null ? user.getRole().name() : "USER");
        dto.setCreditScore(user.getCreditScore());
        dto.setCreditScoreCategory(getCategory(user.getCreditScore()));
        dto.setEnabled(user.isEnabled());
        dto.setCreatedAt(user.getCreatedAt());
        dto.setUpdatedAt(user.getUpdatedAt());


        if (stats != null) {
            dto.setTotalLoanApplications(stats.getTotalLoanApplications());
            dto.setApprovedLoans(stats.getApprovedLoans());
            dto.setRejectedLoans(stats.getRejectedLoans());
            dto.setTotalBorrowed(stats.getTotalBorrowed());
            dto.setTotalRepaid(stats.getTotalRepaid());
            dto.setOnTimeRepaymentRate(stats.getOnTimeRepaymentRate());
        }
        return dto;
    }

    private static int calculateAge(LocalDate birthDate) {
        return Period.between(birthDate, LocalDate.now()).getYears();
    }

    private static String getCategory(Integer score) {
        if (score == null) return "N/A";
        if (score >= 750) return "Excellent";
        if (score >= 700) return "Good";
        if (score >= 650) return "Fair";
        return "Poor";
    }
}