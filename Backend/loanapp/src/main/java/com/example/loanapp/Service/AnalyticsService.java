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
        List<Loan> loansInRange = loanRepository.findByAppliedDateBetween(start, end);
        long totalInRange = loansInRange.size();

        // Pass all status values as a list parameter
        BigDecimal totalAmt = loanRepository.sumAmountByStatusIn(Arrays.asList(LoanStatus.values()))
                .orElse(BigDecimal.ZERO);

        long pending = loanRepository.countByStatus(LoanStatus.PENDING);
        long approved = loanRepository.countByStatus(LoanStatus.APPROVED);

        return AnalyticsDTO.Dashboard.builder()
                .totalLoans(totalInRange)
                .totalAmount(totalAmt)
                .averageAmount(totalInRange > 0 ? totalAmt.divide(BigDecimal.valueOf(totalInRange), 2, RoundingMode.HALF_UP) : BigDecimal.ZERO)
                .approvalRate(calculateRate(approved, totalInRange))
                .pendingLoans(pending)
                .approvedLoans(approved)
                .rejectedLoans(loanRepository.countByStatus(LoanStatus.REJECTED))
                .monthOverMonthGrowth(calculateMoM(start, end))
                .build();
    }

    public AnalyticsDTO.Overview getOverviewAnalytics() {
        List<LoanStatus> activeStatuses = Arrays.asList(LoanStatus.DISBURSED, LoanStatus.REPAYING, LoanStatus.APPROVED);

        return AnalyticsDTO.Overview.builder()
                .totalPortfolioValue(loanRepository.sumAmountByStatusIn(activeStatuses).orElse(BigDecimal.ZERO))
                .activeLoans(loanRepository.countDistinctUsersByStatusIn(activeStatuses))
                .averageCreditScore(loanRepository.getAverageCreditScore().orElse(0.0))
                .riskDistribution(calculateRiskDistribution())
                .build();
    }

    public AnalyticsDTO.MonthlyData getMonthlyTrend(LocalDate start, LocalDate end) {
        List<Loan> loans = loanRepository.findByAppliedDateBetween(start, end);

        Map<YearMonth, List<Loan>> byMonth = loans.stream()
                .collect(Collectors.groupingBy(
                        l -> YearMonth.from(l.getAppliedDate()),
                        TreeMap::new,
                        Collectors.toList()
                ));

        List<AnalyticsDTO.MonthlyMetric> metrics = new ArrayList<>();
        Map<LoanStatus, List<Long>> statusTrends = new HashMap<>();

        Arrays.stream(LoanStatus.values()).forEach(status -> statusTrends.put(status, new ArrayList<>()));

        for (Map.Entry<YearMonth, List<Loan>> entry : byMonth.entrySet()) {
            List<Loan> monthlyLoans = entry.getValue();
            Map<LoanStatus, Long> counts = monthlyLoans.stream()
                    .collect(Collectors.groupingBy(l -> Optional.ofNullable(l.getStatus()).orElse(LoanStatus.PENDING), Collectors.counting()));

            metrics.add(AnalyticsDTO.MonthlyMetric.builder()
                    .month(entry.getKey().format(DateTimeFormatter.ofPattern("MMM yyyy")))
                    .totalLoans(monthlyLoans.size())
                    .totalAmount(monthlyLoans.stream().map(l -> Optional.ofNullable(l.getAmount()).orElse(BigDecimal.ZERO)).reduce(BigDecimal.ZERO, BigDecimal::add))
                    .approvedLoans(counts.getOrDefault(LoanStatus.APPROVED, 0L))
                    .rejectedLoans(counts.getOrDefault(LoanStatus.REJECTED, 0L))
                    .pendingLoans(counts.getOrDefault(LoanStatus.PENDING, 0L))
                    .build());

            statusTrends.forEach((status, trendList) -> trendList.add(counts.getOrDefault(status, 0L)));
        }

        return AnalyticsDTO.MonthlyData.builder()
                .monthlyMetrics(metrics)
                .statusTrends(statusTrends)
                .build();
    }

    public AnalyticsDTO.StatusDistribution getStatusDistribution() {
        List<Loan> allLoans = loanRepository.findAll();
        long total = allLoans.size();

        Map<LoanStatus, Long> dist = allLoans.stream()
                .collect(Collectors.groupingBy(l -> Optional.ofNullable(l.getStatus()).orElse(LoanStatus.PENDING), Collectors.counting()));

        Map<LoanStatus, Double> percentages = new HashMap<>();
        dist.forEach((status, count) -> percentages.put(status, total > 0 ? (count * 100.0) / total : 0.0));

        return AnalyticsDTO.StatusDistribution.builder()
                .distribution(dist)
                .percentages(percentages)
                .totalLoans(total)
                .build();
    }

    public AnalyticsDTO.PurposeDistribution getPurposeDistribution() {
        List<Loan> allLoans = loanRepository.findAll();
        Map<LoanPurpose, Long> dist = allLoans.stream()
                .collect(Collectors.groupingBy(l -> Optional.ofNullable(l.getPurpose()).orElse(LoanPurpose.OTHER), Collectors.counting()));

        return AnalyticsDTO.PurposeDistribution.builder()
                .distribution(dist)
                .totalLoans((long) allLoans.size())
                .build();
    }

    private BigDecimal calculateRate(long part, long total) {
        if (total == 0) return BigDecimal.ZERO;
        return BigDecimal.valueOf(part).multiply(HUNDRED).divide(BigDecimal.valueOf(total), 2, RoundingMode.HALF_UP);
    }

    private Map<String, Long> calculateRiskDistribution() {
        // Optimization: Process in memory from a single query if portfolio is small
        return loanRepository.findAll().stream()
                .map(l -> {
                    Integer s = l.getCreditScore();
                    if (s == null) return "Unknown";
                    if (s >= 750) return "Excellent";
                    if (s >= 650) return "Good";
                    return "Subprime";
                })
                .collect(Collectors.groupingBy(s -> s, Collectors.counting()));
    }

    private BigDecimal calculateMoM(LocalDate start, LocalDate end) {
        long currentMonth = loanRepository.findByAppliedDateBetween(end.withDayOfMonth(1), end).size();
        long lastMonth = loanRepository.findByAppliedDateBetween(start.withDayOfMonth(1), start).size();
        if (lastMonth == 0) return BigDecimal.ZERO;
        return BigDecimal.valueOf(((double)(currentMonth - lastMonth) / lastMonth) * 100).setScale(2, RoundingMode.HALF_UP);
    }
}