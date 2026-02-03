package com.example.loanapp.DTO;

import com.example.loanapp.Entity.Loan.LoanPurpose;
import com.example.loanapp.Entity.Loan.LoanStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public class AnalyticsDTO {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Dashboard {
        private long totalLoans;
        private BigDecimal totalAmount;
        private BigDecimal averageAmount;
        private BigDecimal approvalRate;
        private BigDecimal defaultRate;
        private long pendingLoans;
        private long approvedLoans;
        private long rejectedLoans;
        private String topPerformingOfficer;
        private BigDecimal monthOverMonthGrowth;

        // Added for broader service compatibility
        private long totalUsers;
        private BigDecimal totalDisbursed;
        private BigDecimal totalReceived;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Overview {
        private BigDecimal totalPortfolioValue;
        private long activeLoans;
        private BigDecimal totalInterestEarned;
        private Double averageCreditScore; // Changed to Double to match Repository return types
        private BigDecimal averageLoanToValueRatio;
        private Map<String, Long> riskDistribution;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MonthlyMetric {
        private String month;
        private long totalLoans;
        private BigDecimal totalAmount;
        private long approvedLoans;
        private long rejectedLoans;
        private long pendingLoans;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MonthlyData {
        private List<MonthlyMetric> monthlyMetrics;
        private Map<LoanStatus, List<Long>> statusTrends;
        private Map<String, Double> overallTrends;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StatusDistribution {
        private Map<LoanStatus, Long> distribution;
        private Map<LoanStatus, Double> percentages;
        private long totalLoans;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PurposeDistribution {
        private Map<LoanPurpose, Long> distribution;
        private Map<LoanPurpose, Double> percentages;
        private Map<LoanPurpose, BigDecimal> averageAmounts;
        private long totalLoans;
    }
}