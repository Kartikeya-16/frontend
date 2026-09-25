import type { ExpenseResponse, LiabilityResponse } from "./types";

export const WANT_EXPENSE_CATEGORIES = new Set([
  "ENTERTAINMENT",
  "SHOPPING",
  "TRAVEL",
  "VACATION",
  "OTHER",
]);

export interface BudgetAllocationResult {
  monthlyIncome: number;
  needs: number;
  wants: number;
  savings: number;
  needsPct: number;
  wantsPct: number;
  savingsPct: number;
  needsTarget: number;
  wantsTarget: number;
  savingsTarget: number;
  isDeficit: boolean;
  deficitAmount: number;
}

export function calculateBudgetAllocation(
  monthlyIncome: number,
  expenses: ExpenseResponse[] = [],
  liabilities: LiabilityResponse[] = []
): BudgetAllocationResult {
  const income = monthlyIncome > 0 ? monthlyIncome : 1;

  let needsTotal = 0;
  let wantsTotal = 0;

  if (expenses && expenses.length > 0) {
    expenses.forEach((exp) => {
      const amt = Number(exp.amount || 0);
      const cat = String(exp.category || "").toUpperCase();
      if (WANT_EXPENSE_CATEGORIES.has(cat)) {
        wantsTotal += amt;
      } else {
        needsTotal += amt;
      }
    });
  }

  if (liabilities && liabilities.length > 0) {
    liabilities.forEach((lia) => {
      needsTotal += Number(lia.emi_amount || 0);
    });
  }

  const hasItemizedData = (expenses && expenses.length > 0) || (liabilities && liabilities.length > 0);
  const needs = hasItemizedData ? needsTotal : income * 0.5;
  const wants = hasItemizedData ? wantsTotal : income * 0.3;

  const savings = income - needs - wants;
  const isDeficit = savings < 0;

  const needsPct = Math.round((needs / income) * 1000) / 10;
  const wantsPct = Math.round((wants / income) * 1000) / 10;
  const savingsPct = Math.round((100.0 - needsPct - wantsPct) * 10) / 10;

  return {
    monthlyIncome: income,
    needs: Math.round(needs),
    wants: Math.round(wants),
    savings: Math.round(savings),
    needsPct,
    wantsPct,
    savingsPct,
    needsTarget: Math.round(income * 0.5),
    wantsTarget: Math.round(income * 0.3),
    savingsTarget: Math.round(income * 0.2),
    isDeficit,
    deficitAmount: isDeficit ? Math.abs(Math.round(savings)) : 0,
  };
}
