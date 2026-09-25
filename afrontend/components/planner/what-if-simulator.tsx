"use client";

import { useState } from "react";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";
import { calculateLegitHealthScore } from "@/lib/api/planner";
import {
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  RefreshCcw,
  Sliders,
  DollarSign,
  Car,
  Home,
  CreditCard,
  Briefcase,
} from "lucide-react";
import type { FinancialTwinResponse, LiabilityResponse, ExpenseResponse, AssetResponse, FinancialGoalResponse } from "@/lib/types";

interface WhatIfSimulatorProps {
  profile: FinancialTwinResponse | null;
  liabilities: LiabilityResponse[];
  expenses: ExpenseResponse[];
  assets: AssetResponse[];
  goals: FinancialGoalResponse[];
  baselineScore: number;
}

export function WhatIfSimulator({
  profile,
  liabilities,
  expenses,
  assets,
  goals,
  baselineScore,
}: WhatIfSimulatorProps) {
  // Scenario inputs
  const [loanPreset, setLoanPreset] = useState<"home" | "car" | "personal" | "custom">("car");
  const [principal, setPrincipal] = useState<number>(1000000); // 10 Lakh
  const [tenureYears, setTenureYears] = useState<number>(5);
  const [interestRate, setInterestRate] = useState<number>(9.5);
  const [incomeShockPct, setIncomeShockPct] = useState<number>(0);
  const [expenseShock, setExpenseShock] = useState<number>(0);

  // Baseline figures
  const baseIncome = Number(profile?.monthly_income || 0);
  const baseTotalEmi = liabilities.reduce((sum, l) => sum + Number(l.emi_amount || 0), 0);
  const baseTotalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const baseTotalAssets = assets.reduce((sum, a) => sum + Number(a.current_value || 0), 0);
  const baseTotalLiab = liabilities.reduce((sum, l) => sum + Number(l.outstanding_amount || 0), 0);
  const liquidSavings = assets
    .filter((a) => a.asset_type === "SAVINGS" || a.asset_type === "FIXED_DEPOSIT" || a.name.toLowerCase().includes("bank"))
    .reduce((sum, a) => sum + Number(a.current_value || 0), 0) || Math.max(50000, baseTotalExpenses * 2);

  // Preset handlers
  const handlePresetSelect = (preset: "home" | "car" | "personal" | "custom") => {
    setLoanPreset(preset);
    if (preset === "home") {
      setPrincipal(4000000); // 40 Lakh
      setTenureYears(20);
      setInterestRate(8.5);
    } else if (preset === "car") {
      setPrincipal(1000000); // 10 Lakh
      setTenureYears(5);
      setInterestRate(9.5);
    } else if (preset === "personal") {
      setPrincipal(300000); // 3 Lakh
      setTenureYears(3);
      setInterestRate(13.0);
    }
  };

  // Math for EMI
  const monthlyRate = interestRate / (12 * 100);
  const totalMonths = tenureYears * 12;
  const newEmi =
    monthlyRate > 0
      ? Math.round(
          (principal * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
            (Math.pow(1 + monthlyRate, totalMonths) - 1)
        )
      : Math.round(principal / totalMonths);

  const totalPayment = newEmi * totalMonths;
  const totalInterest = Math.max(0, totalPayment - principal);

  // Simulated figures
  const simIncome = Math.max(1, Math.round(baseIncome * (1 + incomeShockPct / 100)));
  const simExpenses = Math.max(0, baseTotalExpenses + expenseShock);
  const simTotalEmi = baseTotalEmi + newEmi;
  const simDti = simIncome > 0 ? (simTotalEmi / simIncome) * 100 : 0;
  const simCashFlow = simIncome - simExpenses - simTotalEmi;

  // Real-time Projected ML Score
  const projectedScoreObj = calculateLegitHealthScore({
    monthly_income: simIncome,
    total_monthly_emis: simTotalEmi,
    total_monthly_expenses: simExpenses,
    liquid_savings: liquidSavings,
    total_assets: baseTotalAssets + principal * 0.75, // add tangible asset value
    total_liabilities: baseTotalLiab + principal,
    goals: goals.map((g) => ({
      target_amount: Number(g.target_amount || 0),
      current_savings: Number(g.current_savings || 0),
    })),
  });

  const projectedScore = projectedScoreObj.health_score;
  const scoreDelta = Math.round((projectedScore - baselineScore) * 10) / 10;

  // Affordability Verdict
  const isSafe = simDti <= 40 && simCashFlow >= simIncome * 0.1;
  const isStretched = (simDti > 40 && simDti <= 50) || (simCashFlow > 0 && simCashFlow < simIncome * 0.1);
  const isCritical = simDti > 50 || simCashFlow < 0;

  return (
    <div className="space-y-6">
      {/* Top Presets bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/20 pb-3">
        <div>
          <h3 className="font-serif text-lg font-bold text-ink flex items-center gap-2">
            <Sliders className="w-4 h-4 text-ink" />
            Loan Affordability & Stress-Test Simulation
          </h3>
          <p className="text-xs text-ink/70">
            Simulate a new loan commitment or income shock and observe instant feedback on your Digital Twin
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded bg-ink/5 border border-ink/15">
          <button
            onClick={() => handlePresetSelect("car")}
            className={cn(
              "px-2.5 py-1 rounded text-xs font-mono font-medium flex items-center gap-1 transition-all",
              loanPreset === "car" ? "bg-ink text-paper font-bold shadow-[1px_1px_0_0_var(--color-ink)]" : "text-ink/70 hover:text-ink hover:bg-paper"
            )}
          >
            <Car className="w-3 h-3" /> Car Loan
          </button>
          <button
            onClick={() => handlePresetSelect("home")}
            className={cn(
              "px-2.5 py-1 rounded text-xs font-mono font-medium flex items-center gap-1 transition-all",
              loanPreset === "home" ? "bg-ink text-paper font-bold shadow-[1px_1px_0_0_var(--color-ink)]" : "text-ink/70 hover:text-ink hover:bg-paper"
            )}
          >
            <Home className="w-3 h-3" /> Home Loan
          </button>
          <button
            onClick={() => handlePresetSelect("personal")}
            className={cn(
              "px-2.5 py-1 rounded text-xs font-mono font-medium flex items-center gap-1 transition-all",
              loanPreset === "personal" ? "bg-ink text-paper font-bold shadow-[1px_1px_0_0_var(--color-ink)]" : "text-ink/70 hover:text-ink hover:bg-paper"
            )}
          >
            <CreditCard className="w-3 h-3" /> Personal
          </button>
          <button
            onClick={() => handlePresetSelect("custom")}
            className={cn(
              "px-2.5 py-1 rounded text-xs font-mono font-medium transition-all",
              loanPreset === "custom" ? "bg-ink text-paper font-bold shadow-[1px_1px_0_0_var(--color-ink)]" : "text-ink/70 hover:text-ink hover:bg-paper"
            )}
          >
            Custom
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Interactive Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="paper-card p-5 space-y-4">
            <h4 className="font-serif text-sm font-bold text-ink border-b border-ink/15 pb-2">
              1. Loan Parameters
            </h4>

            {/* Principal Slider */}
            <div>
              <div className="flex justify-between items-center text-xs font-mono mb-1.5">
                <span className="text-ink font-semibold">Loan Amount (Principal)</span>
                <span className="font-bold text-sm text-ink ticker-num bg-ink/5 px-2 py-0.5 rounded border border-ink/20">
                  {formatINR(principal)}
                </span>
              </div>
              <input
                type="range"
                min={50000}
                max={15000000}
                step={50000}
                value={principal}
                onChange={(e) => {
                  setPrincipal(Number(e.target.value));
                  setLoanPreset("custom");
                }}
                className="w-full accent-ink cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-ink/50 mt-0.5">
                <span>₹50,000</span>
                <span>₹50 Lakh</span>
                <span>₹1.5 Crore</span>
              </div>
            </div>

            {/* Tenure & Interest Rate Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <div className="flex justify-between items-center text-xs font-mono mb-1.5">
                  <span className="text-ink font-semibold">Tenure</span>
                  <span className="font-bold text-ink ticker-num bg-ink/5 px-2 py-0.5 rounded border border-ink/20">
                    {tenureYears} Years ({totalMonths} mo)
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={30}
                  step={1}
                  value={tenureYears}
                  onChange={(e) => {
                    setTenureYears(Number(e.target.value));
                    setLoanPreset("custom");
                  }}
                  className="w-full accent-ink cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-ink/50 mt-0.5">
                  <span>1 Year</span>
                  <span>15 Yrs</span>
                  <span>30 Yrs</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center text-xs font-mono mb-1.5">
                  <span className="text-ink font-semibold">Interest Rate</span>
                  <span className="font-bold text-ink ticker-num bg-ink/5 px-2 py-0.5 rounded border border-ink/20">
                    {interestRate.toFixed(1)}% p.a.
                  </span>
                </div>
                <input
                  type="range"
                  min={6}
                  max={24}
                  step={0.25}
                  value={interestRate}
                  onChange={(e) => {
                    setInterestRate(Number(e.target.value));
                    setLoanPreset("custom");
                  }}
                  className="w-full accent-ink cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-ink/50 mt-0.5">
                  <span>6.0%</span>
                  <span>14.0%</span>
                  <span>24.0%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Income & Expense Shock Section */}
          <div className="paper-card p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-ink/15 pb-2">
              <h4 className="font-serif text-sm font-bold text-ink flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-ink" />
                2. Economic & Household Shocks
              </h4>
              <button
                onClick={() => {
                  setIncomeShockPct(0);
                  setExpenseShock(0);
                }}
                className="text-[10px] font-mono text-ink/60 hover:text-ink flex items-center gap-1"
                title="Reset shocks"
              >
                <RefreshCcw className="w-2.5 h-2.5" /> Reset
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between items-center text-xs font-mono mb-1">
                  <span className="text-ink font-semibold">Salary / Inflow Change</span>
                  <span className={cn("font-bold text-xs ticker-num", incomeShockPct > 0 ? "text-emerald" : incomeShockPct < 0 ? "text-clay" : "text-ink")}>
                    {incomeShockPct > 0 ? `+${incomeShockPct}%` : `${incomeShockPct}%`}
                  </span>
                </div>
                <input
                  type="range"
                  min={-30}
                  max={50}
                  step={5}
                  value={incomeShockPct}
                  onChange={(e) => setIncomeShockPct(Number(e.target.value))}
                  className="w-full accent-ink cursor-pointer"
                />
                <p className="text-[10px] font-mono text-ink/60 mt-0.5">
                  Simulated Monthly Income: <strong>{formatINR(simIncome)}</strong>
                </p>
              </div>

              <div>
                <div className="flex justify-between items-center text-xs font-mono mb-1">
                  <span className="text-ink font-semibold">Monthly Expense Shift</span>
                  <span className={cn("font-bold text-xs ticker-num", expenseShock > 0 ? "text-clay" : expenseShock < 0 ? "text-emerald" : "text-ink")}>
                    {expenseShock > 0 ? `+${formatINR(expenseShock)}` : formatINR(expenseShock)}
                  </span>
                </div>
                <input
                  type="range"
                  min={-15000}
                  max={25000}
                  step={2000}
                  value={expenseShock}
                  onChange={(e) => setExpenseShock(Number(e.target.value))}
                  className="w-full accent-ink cursor-pointer"
                />
                <p className="text-[10px] font-mono text-ink/60 mt-0.5">
                  Simulated Expenses: <strong>{formatINR(simExpenses)}</strong>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Live Real-Time Impact Matrix (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="paper-card p-5 space-y-4 border-2 border-ink">
            <div className="flex items-center justify-between border-b border-ink/20 pb-2.5">
              <span className="font-mono text-[10px] uppercase font-bold tracking-wider text-ink/60">
                Stress-Test Verdict
              </span>
              <span
                className={cn(
                  "font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded border border-ink shadow-[1px_1px_0_0_var(--color-ink)]",
                  isSafe && "bg-emerald text-paper",
                  isStretched && "bg-marigold text-ink",
                  isCritical && "bg-clay text-paper"
                )}
              >
                {isSafe ? "Affordable" : isStretched ? "Caution: Stretched" : "High Risk of Default"}
              </span>
            </div>

            {/* Simulated Monthly EMI Stamped Box */}
            <div className="p-4 rounded border border-ink bg-ink/5 text-center">
              <p className="font-mono text-[10px] uppercase text-ink/60 font-semibold tracking-wider">
                Simulated Monthly EMI Outflow
              </p>
              <p className="font-serif text-3xl font-bold text-ink ticker-num mt-1">
                {formatINR(newEmi)}
                <span className="font-mono text-xs text-ink/50 font-normal"> / mo</span>
              </p>
              <p className="font-mono text-[11px] text-ink/60 mt-1">
                Total Interest: {formatINR(totalInterest)} · Repayment: {formatINR(totalPayment)}
              </p>
            </div>

            {/* Health Score Impact Card */}
            <div className="p-3.5 rounded border border-ink/30 bg-paper space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-semibold text-ink">Projected Health Score</span>
                <span className={cn("font-mono text-xs font-bold flex items-center gap-1", scoreDelta < 0 ? "text-clay" : scoreDelta > 0 ? "text-emerald" : "text-ink")}>
                  {scoreDelta < 0 ? <TrendingDown className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5" />}
                  {scoreDelta > 0 ? `+${scoreDelta}` : scoreDelta} pts
                </span>
              </div>
              <div className="flex items-baseline justify-between border-t border-ink/10 pt-1.5">
                <div className="text-left">
                  <span className="text-[10px] font-mono text-ink/50 uppercase block">Current</span>
                  <strong className="font-serif text-lg text-ink/70 ticker-num">{baselineScore.toFixed(1)}</strong>
                </div>
                <span className="text-ink/30 font-mono text-sm">&rarr;</span>
                <div className="text-right">
                  <span className="text-[10px] font-mono text-ink/50 uppercase block">Projected</span>
                  <strong className={cn("font-serif text-xl font-bold ticker-num", projectedScore >= 60 ? "text-emerald" : projectedScore >= 40 ? "text-ink" : "text-clay")}>
                    {projectedScore.toFixed(1)}
                  </strong>
                </div>
              </div>
            </div>

            {/* Key Ratios Comparison */}
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-2.5 rounded border border-ink/20 bg-paper">
                <span className="text-ink/60 text-[10px] uppercase block">New Debt Ratio (DTI)</span>
                <p className={cn("text-base font-bold ticker-num mt-0.5", simDti > 40 ? "text-clay" : "text-emerald")}>
                  {simDti.toFixed(1)}%
                </p>
                <span className="text-[9px] text-ink/50 block mt-0.5">
                  Safe ceiling is 40%
                </span>
              </div>

              <div className="p-2.5 rounded border border-ink/20 bg-paper">
                <span className="text-ink/60 text-[10px] uppercase block">New Monthly Surplus</span>
                <p className={cn("text-base font-bold ticker-num mt-0.5", simCashFlow >= 0 ? "text-emerald" : "text-clay")}>
                  {formatINR(simCashFlow)}
                </p>
                <span className="text-[9px] text-ink/50 block mt-0.5">
                  {simCashFlow >= 0 ? "Uncommitted cash" : "Monthly deficit"}
                </span>
              </div>
            </div>

            {/* Prescriptive Recommendation */}
            <div className="p-3 rounded border border-ink/20 bg-paper text-xs text-ink/80 leading-relaxed font-sans">
              {isSafe && (
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald shrink-0 mt-0.5" />
                  <p>
                    <strong>Affordable Commitment:</strong> You retain a healthy monthly cushion of {formatINR(simCashFlow)}. Your DTI ({simDti.toFixed(1)}%) remains well within banking safety limits.
                  </p>
                </div>
              )}
              {isStretched && (
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-marigold shrink-0 mt-0.5" />
                  <p>
                    <strong>Stretched Cash Flow:</strong> Total EMIs consume {simDti.toFixed(1)}% of your income. An emergency or sudden inflation spike could strain your monthly budget. Consider increasing tenure or reducing principal.
                  </p>
                </div>
              )}
              {isCritical && (
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-clay shrink-0 mt-0.5" />
                  <p>
                    <strong>High Risk:</strong> This commitment creates a monthly deficit of {formatINR(Math.abs(simCashFlow))} or pushes debt above 50% of income. Highly discouraged without substantial income expansion.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
