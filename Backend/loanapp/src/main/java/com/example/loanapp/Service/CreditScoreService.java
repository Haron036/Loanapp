package com.example.loanapp.Service;

import com.example.loanapp.Entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Period;

@Service
@RequiredArgsConstructor
public class CreditScoreService {
    private static final int MIN_CREDIT_SCORE = 300;
    private static final int MAX_CREDIT_SCORE = 850;

    public Integer calculateCreditScore(User user) {
        int score = 650; // Base score

        // 1. Income Factor (0-100 points)
        if (user.getAnnualIncome() != null) {
            if (user.getAnnualIncome() >= 100000) score += 50;
            else if (user.getAnnualIncome() >= 50000) score += 30;
            else if (user.getAnnualIncome() >= 30000) score += 10;
            else score -= 20;
        }

        // 2. Employment Type Factor (0-80 points)
        if (user.getEmploymentType() != null) {
            switch (user.getEmploymentType().toLowerCase()) {
                case "full-time":
                    score += 40;
                    break;
                case "part-time":
                    score += 20;
                    break;
                case "self-employed":
                    score += 30;
                    break;
                case "contractor":
                    score += 15;
                    break;
                default:
                    score -= 10;
            }
        }

        // 3. Debt-to-Income Ratio Factor (-50 to 50 points)
        if (user.getAnnualIncome() != null && user.getMonthlyDebt() != null &&
                user.getAnnualIncome() > 0) {
            double dti = (user.getMonthlyDebt() * 12) / user.getAnnualIncome();
            if (dti < 0.2) score += 50;
            else if (dti < 0.3) score += 30;
            else if (dti < 0.4) score += 10;
            else if (dti < 0.5) score -= 10;
            else score -= 30;
        }

        // 4. Existing Loans Factor (-30 to 0 points)
        if (user.getExistingLoansCount() != null) {
            if (user.getExistingLoansCount() == 0) score += 10;
            else if (user.getExistingLoansCount() == 1) score += 5;
            else if (user.getExistingLoansCount() == 2) score += 0;
            else if (user.getExistingLoansCount() <= 4) score -= 10;
            else score -= 30;
        }

        // 5. Account Age Factor (0-20 points)
        if (user.getCreatedAt() != null) {
            Period accountAge = Period.between(
                    user.getCreatedAt().toLocalDate(), LocalDate.now());
            if (accountAge.getYears() >= 3) score += 20;
            else if (accountAge.getYears() >= 1) score += 10;
            else if (accountAge.getMonths() >= 6) score += 5;
        }

        // Ensure score is within bounds
        score = Math.max(MIN_CREDIT_SCORE, Math.min(MAX_CREDIT_SCORE, score));

        return score;
    }

    public String getCreditScoreCategory(Integer score) {
        if (score >= 750) return "EXCELLENT";
        if (score >= 700) return "GOOD";
        if (score >= 650) return "FAIR";
        if (score >= 600) return "POOR";
        return "VERY_POOR";
    }

    public boolean isEligibleForLoan(Integer creditScore, BigDecimal requestedAmount) {
        if (creditScore < 600) return false;

        // Credit score based limits
        BigDecimal maxAmount;
        if (creditScore >= 750) maxAmount = BigDecimal.valueOf(100000);
        else if (creditScore >= 700) maxAmount = BigDecimal.valueOf(75000);
        else if (creditScore >= 650) maxAmount = BigDecimal.valueOf(50000);
        else maxAmount = BigDecimal.valueOf(25000);

        return requestedAmount.compareTo(maxAmount) <= 0;
    }
}
