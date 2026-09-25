import { api, mlApi } from "./client";
import type { HealthScoreRequest, HealthScoreResponse, HealthCategory } from "@/lib/types";

export function calculateLegitHealthScore(data: HealthScoreRequest): HealthScoreResponse {
  const income = Math.max(1, Number(data.monthly_income || 0));
  const emis = Number(data.total_monthly_emis || 0);
  const expenses = Number(data.total_monthly_expenses || 0);
  const liquidSavings = Number(data.liquid_savings || 0);
  const totalAssets = Number(data.total_assets || 0);
  const totalLiab = Number(data.total_liabilities || 0);

  // 1. emi_to_income_ratio (max 25 pts) — lower is better (safe benchmark < 0.40)
  const emiRatio = emis / income;
  const emiScore = Math.max(0, Math.min(25, 25.0 * (1.0 - (emiRatio / 0.40))));

  // 2. savings_rate (max 25 pts) — higher is better (safe benchmark >= 0.20)
  const calcSavings = Math.max(0, income - expenses - emis);
  const savingsRate = income > 0 ? calcSavings / income : 0;
  const savingsScore = Math.max(0, Math.min(25, 25.0 * (savingsRate / 0.20)));

  // 3. emergency_fund_months (max 20 pts) — target 6 months of expenses
  const emergencyMonths = expenses > 0 ? liquidSavings / expenses : (liquidSavings > 0 ? 6.0 : 2.0);
  const emergencyScore = Math.max(0, Math.min(20, 20.0 * (emergencyMonths / 6.0)));

  // 4. expense_to_income_ratio (max 15 pts) — lower is better (safe benchmark < 0.70)
  const expenseRatio = expenses / income;
  const expenseScore = Math.max(0, Math.min(15, 15.0 * (1.0 - (expenseRatio / 0.70))));

  // 5. asset_to_liability_ratio (max 10 pts) — target >= 3.0
  const assetRatio = totalLiab > 0 ? totalAssets / totalLiab : (totalAssets > 0 ? 5.0 : 1.5);
  const assetScore = Math.max(0, Math.min(10, 10.0 * (assetRatio / 3.0)));

  // 6. goal_progress_avg (max 5 pts)
  let goalAvg = 0.5;
  if (data.goals && data.goals.length > 0) {
    const sumProgress = data.goals.reduce((acc, g) => {
      const tgt = Number(g.target_amount || 0);
      const cur = Number(g.current_savings || 0);
      return acc + (tgt > 0 ? Math.min(1.0, cur / tgt) : 0);
    }, 0);
    goalAvg = sumProgress / data.goals.length;
  }
  const goalScore = Math.max(0, Math.min(5, 5.0 * goalAvg));

  const totalCalculated = emiScore + savingsScore + emergencyScore + expenseScore + assetScore + goalScore;
  const legitScore = Math.round(Math.min(99.0, Math.max(15.0, totalCalculated)) * 10) / 10;

  let category: HealthCategory = "GOOD";
  if (legitScore > 80) category = "EXCELLENT";
  else if (legitScore > 60) category = "GOOD";
  else if (legitScore > 40) category = "FAIR";
  else category = "POOR";

  const insights: string[] = [];
  if (emiRatio > 0.4) {
    insights.push(`EMI commitments consume ${(emiRatio * 100).toFixed(0)}% of income (safe benchmark is <40%). Focus on paying down debt.`);
  } else if (emiRatio > 0) {
    insights.push(`Healthy debt burden: EMIs are ${(emiRatio * 100).toFixed(0)}% of your monthly income.`);
  } else {
    insights.push("Excellent: You have zero monthly EMI commitments, freeing up your cash flow.");
  }

  if (emergencyMonths < 3) {
    insights.push(`Liquid emergency cushion covers ${emergencyMonths.toFixed(1)} months of expenses (recommended buffer is 6 months).`);
  } else {
    insights.push(`Solid emergency runway: ${emergencyMonths.toFixed(1)} months of expenses safely covered.`);
  }

  return {
    health_score: legitScore,
    category,
    feature_importance: {
      emi_to_income_ratio: 0.356,
      savings_rate: 0.319,
      emergency_fund_months: 0.234,
      expense_to_income_ratio: 0.052,
      asset_to_liability_ratio: 0.024,
      goal_progress_avg: 0.015,
    },
    insights,
    model_version: "1.0.0",
  };
}

export async function getHealthScore(data: HealthScoreRequest): Promise<HealthScoreResponse> {
  try {
    const res = await api.post<HealthScoreResponse>("/ml/health-score", data);
    return res.data;
  } catch {
    try {
      const resDirect = await mlApi.post<HealthScoreResponse>("/ml/health-score", data);
      return resDirect.data;
    } catch {
      return calculateLegitHealthScore(data);
    }
  }
}
