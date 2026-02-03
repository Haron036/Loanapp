package com.example.loanapp.controllers;

import com.example.loanapp.DTO.AnalyticsDTO;
import com.example.loanapp.Service.AnalyticsService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {
    private final AnalyticsService analyticsService;

    // Manual constructor
    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping("/dashboard")
    @PreAuthorize("hasAnyRole('ADMIN', 'LOAN_OFFICER')")
    public ResponseEntity<AnalyticsDTO.Dashboard> getDashboard(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        if (startDate == null) startDate = LocalDate.now().minusMonths(6);
        if (endDate == null) endDate = LocalDate.now();

        AnalyticsDTO.Dashboard dashboard = analyticsService.getDashboardAnalytics(startDate, endDate);
        return ResponseEntity.ok(dashboard);
    }

    @GetMapping("/overview")
    @PreAuthorize("hasAnyRole('ADMIN', 'LOAN_OFFICER')")
    public ResponseEntity<AnalyticsDTO.Overview> getOverview() {
        AnalyticsDTO.Overview overview = analyticsService.getOverviewAnalytics();
        return ResponseEntity.ok(overview);
    }

    @GetMapping("/monthly-trend")
    @PreAuthorize("hasAnyRole('ADMIN', 'LOAN_OFFICER')")
    public ResponseEntity<AnalyticsDTO.MonthlyData> getMonthlyTrend(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        AnalyticsDTO.MonthlyData trend = analyticsService.getMonthlyTrend(startDate, endDate);
        return ResponseEntity.ok(trend);
    }

    @GetMapping("/status-distribution")
    @PreAuthorize("hasAnyRole('ADMIN', 'LOAN_OFFICER')")
    public ResponseEntity<AnalyticsDTO.StatusDistribution> getStatusDistribution() {
        AnalyticsDTO.StatusDistribution distribution = analyticsService.getStatusDistribution();
        return ResponseEntity.ok(distribution);
    }

    @GetMapping("/purpose-distribution")
    @PreAuthorize("hasAnyRole('ADMIN', 'LOAN_OFFICER')")
    public ResponseEntity<AnalyticsDTO.PurposeDistribution> getPurposeDistribution() {
        AnalyticsDTO.PurposeDistribution distribution = analyticsService.getPurposeDistribution();
        return ResponseEntity.ok(distribution);
    }
}