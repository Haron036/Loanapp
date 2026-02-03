package com.example.loanapp.Service;

import com.example.loanapp.DTO.AnalyticsDTO;
import com.example.loanapp.Entity.Loan;
import com.example.loanapp.Entity.Loan.LoanStatus;
import com.example.loanapp.Entity.Loan.LoanPurpose;
import com.example.loanapp.Repository.LoanRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final LoanRepository loanRepository;
    private static final BigDecimal HUNDRED = new BigDecimal("100");

    public AnalyticsDTO.Dashboard getDashboardAnalytics(LocalDate start, LocalDate end) {
        List<Loan> loans = loanRepository.findByAppliedDateBetween(start, end);
        long total = loans.size();

        Map<LoanStatus, Long> counts = loans.stream()
                .collect(Collectors.groupingBy(
                        l -> l.getStatus() != null ? l.getStatus() : LoanStatus.PENDING,
                        Collectors.counting()
                ));

        BigDecimal totalAmt = loans.stream()
                .map(l -> l.getAmount() != null ? l.getAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        AnalyticsDTO.MonthlyData trend = getMonthlyTrend(start, end);

        return AnalyticsDTO.Dashboard.builder()
                .totalLoans(total)
                .totalAmount(totalAmt)
                .averageAmount(total > 0 ? totalAmt.divide(BigDecimal.valueOf(total), 2, RoundingMode.HALF_UP) : BigDecimal.ZERO)
                .approvalRate(calculateRate(counts.getOrDefault(LoanStatus.APPROVED, 0L), total))
                .defaultRate(calculateRate(counts.getOrDefault(LoanStatus.DEFAULTED, 0L), total))
                .pendingLoans(counts.getOrDefault(LoanStatus.PENDING, 0L))
                .approvedLoans(counts.getOrDefault(LoanStatus.APPROVED, 0L))
                .rejectedLoans(counts.getOrDefault(LoanStatus.REJECTED, 0L))
                .topPerformingOfficer(getTopOfficer(loans))
                .monthOverMonthGrowth(BigDecimal.valueOf(calculateMoM(trend)).setScale(2, RoundingMode.HALF_UP))
                .build();
    }

    public AnalyticsDTO.Overview getOverviewAnalytics() {
        // sumAmountByStatus was added to LoanRepository in our previous step
        BigDecimal portfolio = loanRepository.sumAmountByStatus(LoanStatus.APPROVED);

        // Ensure countByStatusIn exists in your Repository or use count() with filtering
        long active = loanRepository.findAll().stream()
                .filter(l -> Arrays.asList(LoanStatus.DISBURSED, LoanStatus.REPAYING, LoanStatus.DEFAULTED).contains(l.getStatus()))
                .count();

        Double avgCredit = loanRepository.getAverageCreditScore();

        List<Loan> all = loanRepository.findAll();
        Map<String, Long> riskDist = all.stream()
                .collect(Collectors.groupingBy(l -> getRiskCat(l.getCreditScore()), Collectors.counting()));

        return AnalyticsDTO.Overview.builder()
                .totalPortfolioValue(portfolio != null ? portfolio : BigDecimal.ZERO)
                .activeLoans(active)
                .totalInterestEarned(calculateInterest(all))
                // Converting Double from Repo to Double in DTO (updated in AnalyticsDTO earlier)
                .averageCreditScore(avgCredit != null ? avgCredit : 0.0)
                .riskDistribution(riskDist)
                .build();
    }

    public AnalyticsDTO.MonthlyData getMonthlyTrend(LocalDate start, LocalDate end) {
        List<Loan> loans = loanRepository.findByAppliedDateBetween(start, end);

        Map<YearMonth, List<Loan>> byMonth = loans.stream()
                .filter(l -> l.getAppliedDate() != null)
                .collect(Collectors.groupingBy(
                        l -> YearMonth.from(l.getAppliedDate()),
                        TreeMap::new,
                        Collectors.toList()
                ));

        List<AnalyticsDTO.MonthlyMetric> metrics = new ArrayList<>();
        Map<LoanStatus, List<Long>> trends = new HashMap<>();
        Arrays.stream(LoanStatus.values()).forEach(s -> trends.put(s, new ArrayList<>()));

        for (Map.Entry<YearMonth, List<Loan>> entry : byMonth.entrySet()) {
            List<Loan> monthlyList = entry.getValue();
            Map<LoanStatus, Long> mCounts = monthlyList.stream()
                    .filter(l -> l.getStatus() != null)
                    .collect(Collectors.groupingBy(Loan::getStatus, Collectors.counting()));

            metrics.add(AnalyticsDTO.MonthlyMetric.builder()
                    .month(entry.getKey().format(DateTimeFormatter.ofPattern("MMM yyyy")))
                    .totalLoans(monthlyList.size())
                    .totalAmount(monthlyList.stream()
                            .map(l -> l.getAmount() != null ? l.getAmount() : BigDecimal.ZERO)
                            .reduce(BigDecimal.ZERO, BigDecimal::add))
                    .approvedLoans(mCounts.getOrDefault(LoanStatus.APPROVED, 0L))
                    .rejectedLoans(mCounts.getOrDefault(LoanStatus.REJECTED, 0L))
                    .pendingLoans(mCounts.getOrDefault(LoanStatus.PENDING, 0L))
                    .build());

            Arrays.stream(LoanStatus.values()).forEach(s -> trends.get(s).add(mCounts.getOrDefault(s, 0L)));
        }

        return AnalyticsDTO.MonthlyData.builder()
                .monthlyMetrics(metrics)
                .statusTrends(trends)
                .overallTrends(new HashMap<>())
                .build();
    }

    // Helper methods remain the same but with null-safety checks
    private BigDecimal calculateRate(long part, long total) {
        return total == 0 ? BigDecimal.ZERO :
                BigDecimal.valueOf(part).multiply(HUNDRED)
                        .divide(BigDecimal.valueOf(total), 2, RoundingMode.HALF_UP);
    }

    private String getTopOfficer(List<Loan> loans) {
        return loans.stream()
                .filter(l -> l.getReviewedBy() != null)
                .collect(Collectors.groupingBy(Loan::getReviewedBy, Collectors.counting()))
                .entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("N/A");
    }

    private BigDecimal calculateInterest(List<Loan> loans) {
        return loans.stream()
                .filter(l -> l.getStatus() == LoanStatus.APPROVED || l.getStatus() == LoanStatus.COMPLETED)
                .map(l -> {
                    BigDecimal a = l.getAmount() != null ? l.getAmount() : BigDecimal.ZERO;
                    BigDecimal r = l.getInterestRate() != null ? l.getInterestRate() : BigDecimal.ZERO;
                    return a.multiply(r).divide(HUNDRED, 2, RoundingMode.HALF_UP);
                }).reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private double calculateMoM(AnalyticsDTO.MonthlyData data) {
        List<AnalyticsDTO.MonthlyMetric> m = data.getMonthlyMetrics();
        if (m == null || m.size() < 2) return 0.0;
        long curr = m.get(m.size() - 1).getTotalLoans();
        long prev = m.get(m.size() - 2).getTotalLoans();
        return prev == 0 ? 0.0 : ((double) (curr - prev) / prev) * 100.0;
    }

    private String getRiskCat(Integer s) {
        if (s == null) return "Unknown";
        if (s >= 750) return "Low Risk";
        if (s >= 650) return "Medium Risk";
        return "High Risk";
    }
    // ==================== MISSING METHODS TO FIX CONTROLLER ERRORS ====================

    public AnalyticsDTO.StatusDistribution getStatusDistribution() {
        List<Loan> all = loanRepository.findAll();
        long total = all.size();

        Map<LoanStatus, Long> dist = all.stream()
                .filter(l -> l.getStatus() != null)
                .collect(Collectors.groupingBy(Loan::getStatus, Collectors.counting()));

        Map<LoanStatus, Double> percs = new HashMap<>();
        dist.forEach((s, c) -> percs.put(s, total > 0 ? (c * 100.0) / total : 0.0));

        return AnalyticsDTO.StatusDistribution.builder()
                .distribution(dist)
                .percentages(percs)
                .totalLoans(total)
                .build();
    }

    public AnalyticsDTO.PurposeDistribution getPurposeDistribution() {
        List<Loan> all = loanRepository.findAll();
        long total = all.size();

        // Group by purpose
        Map<LoanPurpose, Long> dist = all.stream()
                .filter(l -> l.getPurpose() != null)
                .collect(Collectors.groupingBy(Loan::getPurpose, Collectors.counting()));

        Map<LoanPurpose, Double> percs = new HashMap<>();
        Map<LoanPurpose, BigDecimal> avgs = new HashMap<>();

        for (LoanPurpose p : LoanPurpose.values()) {
            List<Loan> pLoans = all.stream()
                    .filter(l -> l.getPurpose() == p)
                    .collect(Collectors.toList());

            // Calculate percentage
            percs.put(p, total > 0 ? (pLoans.size() * 100.0) / total : 0.0);

            // Calculate average amount for this purpose
            BigDecimal pSum = pLoans.stream()
                    .map(l -> l.getAmount() != null ? l.getAmount() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            avgs.put(p, !pLoans.isEmpty() ?
                    pSum.divide(BigDecimal.valueOf(pLoans.size()), 2, RoundingMode.HALF_UP) : BigDecimal.ZERO);
        }

        return AnalyticsDTO.PurposeDistribution.builder()
                .distribution(dist)
                .percentages(percs)
                .averageAmounts(avgs)
                .totalLoans(total)
                .build();
    }
}