package com.example.loanapp.DTO;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

public class AuthDTO {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class LoginRequest {
        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        @Size(max = 100, message = "Email must be less than 100 characters")
        private String email;

        @NotBlank(message = "Password is required")
        @Size(min = 6, max = 100, message = "Password must be between 6 and 100 characters")
        private String password;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RegisterRequest {
        @NotBlank(message = "Name is required")
        @Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
        private String name;

        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        @Size(max = 100, message = "Email must be less than 100 characters")
        private String email;

        @NotBlank(message = "Password is required")
        @Size(min = 6, max = 100, message = "Password must be between 6 and 100 characters")
        private String password;

        @NotBlank(message = "Phone number is required")
        @Pattern(regexp = "^[+]?[0-9\\s\\-\\.\\(\\)]{10,20}$", message = "Invalid phone number format")
        private String phone;

        @NotBlank(message = "Address is required")
        @Size(min = 5, max = 200, message = "Address must be between 5 and 200 characters")
        private String address;

        @NotBlank(message = "City is required")
        @Size(min = 2, max = 100, message = "City must be between 2 and 100 characters")
        private String city;

        @NotBlank(message = "State is required")
        @Size(min = 2, max = 50, message = "State must be between 2 and 50 characters")
        private String state;

        @NotBlank(message = "ZIP code is required")
        @Pattern(regexp = "^\\d{5}(-\\d{4})?$", message = "Invalid ZIP code format")
        private String zipCode;

        @NotNull(message = "Date of birth is required")
        @JsonFormat(pattern = "yyyy-MM-dd")
        @Past(message = "Date of birth must be in the past")
        private LocalDate dateOfBirth;

        @NotNull(message = "Annual income is required")
        @PositiveOrZero(message = "Annual income must be zero or positive")
        @DecimalMin(value = "0.0", inclusive = true, message = "Annual income must be at least 0")
        private Double annualIncome;

        @NotBlank(message = "Employment type is required")
        @Pattern(regexp = "^(Full-time|Part-time|Self-employed|Unemployed|Retired)$",
                message = "Employment type must be one of: Full-time, Part-time, Self-employed, Unemployed, Retired")
        private String employmentType;

        @NotNull(message = "Monthly debt is required")
        @PositiveOrZero(message = "Monthly debt must be zero or positive")
        @DecimalMin(value = "0.0", inclusive = true, message = "Monthly debt must be at least 0")
        @Builder.Default
        private Double monthlyDebt = 0.0;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class AuthResponse {
        @JsonProperty("success")
        private boolean success;

        @NotBlank
        @JsonProperty("token")
        private String token;

        @NotBlank
        @JsonProperty("refreshToken")
        private String refreshToken;

        @NotBlank
        @JsonProperty("userId")
        private String userId;

        @NotBlank
        @Email
        @JsonProperty("email")
        private String email;

        @NotBlank
        @JsonProperty("name")
        private String name;

        @NotBlank
        @Pattern(regexp = "^(USER|ADMIN|LOAN_OFFICER)$", message = "Role must be USER, ADMIN, or LOAN_OFFICER")
        @JsonProperty("role")
        private String role; // Will be uppercase: "ADMIN", "USER", "LOAN_OFFICER"

        @NotNull
        @Positive
        @JsonProperty("expiresIn")
        private Long expiresIn; // Token expiration in milliseconds

        @NotBlank
        @Builder.Default
        @JsonProperty("tokenType")
        private String tokenType = "Bearer";

        @JsonProperty("phone")
        private String phone;

        @Min(300)
        @Max(850)
        @JsonProperty("creditScore")
        private Integer creditScore;

        @JsonProperty("isAdmin")
        private boolean isAdmin;

        @JsonProperty("message")
        private String message;

        @JsonProperty("error")
        private String error;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RefreshTokenRequest {
        @NotBlank(message = "Refresh token is required")
        private String refreshToken;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ErrorResponse {
        private boolean success;
        private String message;
        private String error;
        private String errorCode;
        private Long timestamp;

        public ErrorResponse(boolean success, String message, String error) {
            this.success = success;
            this.message = message;
            this.error = error;
            this.timestamp = System.currentTimeMillis();
        }
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LogoutRequest {
        @NotBlank(message = "Token is required")
        private String token;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class TokenVerificationResponse {
        private boolean valid;
        private String userId;
        private String email;
        private String name;
        private String role;
        private Long expiresIn;
        private String error;

        public static TokenVerificationResponse valid(String userId, String email, String name, String role, Long expiresIn) {
            return TokenVerificationResponse.builder()
                    .valid(true)
                    .userId(userId)
                    .email(email)
                    .name(name)
                    .role(role)
                    .expiresIn(expiresIn)
                    .build();
        }

        public static TokenVerificationResponse invalid(String error) {
            return TokenVerificationResponse.builder()
                    .valid(false)
                    .error(error)
                    .build();
        }
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class UserInfoResponse {
        private String id;
        private String email;
        private String name;
        private String role;
        private String phone;
        private Integer creditScore;
        private Double annualIncome;
        private String employmentType;
        private LocalDate dateOfBirth;
        private String address;
        private String city;
        private String state;
        private String zipCode;
        private boolean isAdmin;
        private boolean accountNonLocked;
        private boolean enabled;
        private LocalDate createdAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChangePasswordRequest {
        @NotBlank(message = "Current password is required")
        private String currentPassword;

        @NotBlank(message = "New password is required")
        @Size(min = 6, max = 100, message = "New password must be between 6 and 100 characters")
        private String newPassword;

        @NotBlank(message = "Confirm password is required")
        private String confirmPassword;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ResetPasswordRequest {
        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        private String email;

        @NotBlank(message = "Reset token is required")
        private String resetToken;

        @NotBlank(message = "New password is required")
        @Size(min = 6, max = 100, message = "New password must be between 6 and 100 characters")
        private String newPassword;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ForgotPasswordRequest {
        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        private String email;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class PasswordResetResponse {
        private boolean success;
        private String message;
        private String resetToken;
        private Long expiresIn;
        private String error;
    }
}