"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useTwinStore } from "@/store/twin-store";
import { pageVariants, fadeInUp } from "@/lib/motion";
import { formatINR } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sliders,
  TrendingUp,
  Target,
  Flame,
  Scale,
  CreditCard,
  Wallet,
  Cpu,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import { calculateLegitHealthScore } from "@/lib/api/planner";

import { WhatIfSimulator } from "@/components/planner/what-if-simulator";
import { SipGoalCalculator } from "@/components/planner/sip-goal-calculator";
import { DebtPayoffStrategy } from "@/components/planner/debt-payoff-strategy";
import { BudgetRebalancer } from "@/components/planner/budget-rebalancer";

type PlannerMode = "what_if" | "sip_goals" | "debt_accelerator" | "budget_rebalance";

export default function PlannerPage() {
  const { t } = useTranslation();
  const {
    profile,
    expenses,
    liabilities,
    assets,
    goals,
    healthScore,
    isLoading,
    refreshHealthScore,
  } = useTwinStore();

  const [activeMode, setActiveMode] = useState<PlannerMode>("what_if");

  useEffect(() => {
    if (profile && !healthScore) {
      refreshHealthScore();
    }
  }, [profile, healthScore, refreshHealthScore]);

  // Baseline Computations
  const monthlyIncome = Number(profile?.monthly_income || 0);
  const totalEmi = liabilities.reduce((sum, l) => sum + Number(l.emi_amount || 0), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const totalAssets = assets.reduce((sum, a) => sum + Number(a.current_value || 0), 0);
  const totalLiab = liabilities.reduce((sum, l) => sum + Number(l.outstanding_amount || 0), 0);
  const monthlySurplus = monthlyIncome - totalExpenses - totalEmi;
  const emiRatio = monthlyIncome > 0 ? (totalEmi / monthlyIncome) * 100 : 0;

  const fallbackScoreObj = calculateLegitHealthScore({
    monthly_income: monthlyIncome,
    total_monthly_emis: totalEmi,
    total_monthly_expenses: totalExpenses,
    liquid_savings: Math.min(totalAssets, Math.max(totalExpenses * 3, 50000)),
    total_assets: totalAssets,
    total_liabilities: totalLiab,
    goals: goals.map((g) => ({
      target_amount: Number(g.target_amount || 0),
      current_savings: Number(g.current_savings || 0),
    })),
  });

  const currentScore =
    healthScore?.score !== undefined
      ? Number(healthScore.score)
      : fallbackScoreObj.health_score;
  const currentCategory = healthScore?.category || fallbackScoreObj.category;

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto py-2">
        <Skeleton className="h-10 w-64 bg-ink/10" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 bg-ink/10 rounded" />
          ))}
        </div>
        <Skeleton className="h-96 w-full bg-ink/10 rounded" />
      </div>
    );
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      className="max-w-6xl mx-auto space-y-7 pb-16"
    >
      {/* ── Editorial Header ── */}
      <div className="border-b border-ink/20 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink tracking-tight">
              {t("planner.title", "Smart Financial Planner")}
            </h1>
            <span className="font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded border border-ink bg-paper text-ink shadow-[1px_1px_0_0_var(--color-ink)]">
              PILLAR 2 · SIMULATION SUITE
            </span>
          </div>

          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald/10 text-emerald text-[11px] font-mono font-medium border border-emerald/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald animate-pulse" />
            Random Forest Engine Active
          </span>
        </div>
        <p className="font-mono text-xs uppercase tracking-wider text-ink/70 mt-1">
          {t("planner.subtitle", "Interactive Scenario Stress-Testing · SIP Compounding · Debt Payoff · Budget Optimization")}
        </p>
      </div>

      {/* ── Baseline Reference Vitals (4 Cards) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Baseline Score */}
        <div className="paper-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-ink/60">
            <span className="font-mono text-[10px] uppercase font-semibold tracking-wider">
              Baseline ML Score
            </span>
            <Cpu className="w-4 h-4 text-ink" />
          </div>
          <p className="font-serif text-2xl font-bold text-ink ticker-num my-1">
            {currentScore.toFixed(1)}
            <span className="font-mono text-xs text-ink/50 font-normal"> / 100</span>
          </p>
          <div className="flex items-center justify-between font-mono text-[10px]">
            <span className="text-ink/60">Rating</span>
            <span
              className={cn(
                "font-bold uppercase px-1.5 py-0.2 rounded text-[9px]",
                currentCategory === "EXCELLENT" && "bg-emerald/15 text-emerald",
                currentCategory === "GOOD" && "bg-emerald/15 text-emerald",
                currentCategory === "FAIR" && "bg-marigold/20 text-ink",
                currentCategory === "POOR" && "bg-clay/15 text-clay"
              )}
            >
              {currentCategory}
            </span>
          </div>
        </div>

        {/* Monthly Income */}
        <div className="paper-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-ink/60">
            <span className="font-mono text-[10px] uppercase font-semibold tracking-wider">
              Monthly Inflow
            </span>
            <Wallet className="w-4 h-4 text-emerald" />
          </div>
          <p className="font-serif text-2xl font-bold text-emerald ticker-num my-1">
            {formatINR(monthlyIncome)}
          </p>
          <p className="font-mono text-[10px] text-ink/60">
            Take-home salary & streams
          </p>
        </div>

        {/* Debt Ratio */}
        <div className="paper-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-ink/60">
            <span className="font-mono text-[10px] uppercase font-semibold tracking-wider">
              Current Debt Ratio
            </span>
            <CreditCard className="w-4 h-4 text-ink/60" />
          </div>
          <p className={cn("font-serif text-2xl font-bold ticker-num my-1", emiRatio > 40 ? "text-clay" : "text-ink")}>
            {emiRatio.toFixed(1)}%
          </p>
          <div className="flex items-center justify-between font-mono text-[10px]">
            <span className="text-ink/60">EMI: {formatINR(totalEmi)}</span>
            <span className={cn("font-bold text-[9px] uppercase px-1 rounded", emiRatio <= 40 ? "bg-emerald/10 text-emerald" : "bg-clay/10 text-clay")}>
              {emiRatio <= 40 ? "Safe <40%" : "High Burden"}
            </span>
          </div>
        </div>

        {/* Monthly Free Cash Flow */}
        <div className="paper-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-ink/60">
            <span className="font-mono text-[10px] uppercase font-semibold tracking-wider">
              Uncommitted Surplus
            </span>
            <TrendingUp className="w-4 h-4 text-emerald" />
          </div>
          <p className={cn("font-serif text-2xl font-bold ticker-num my-1", monthlySurplus >= 0 ? "text-emerald" : "text-clay")}>
            {formatINR(monthlySurplus)}
          </p>
          <p className="font-mono text-[10px] text-ink/60">
            Available for goals & SIPs
          </p>
        </div>
      </div>

      {/* ── Interactive Simulation Mode Switcher (Tactile Tab Bar) ── */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-lg bg-ink/5 border border-ink/15 shadow-[1px_1px_0_0_var(--color-ink)]">
        <button
          onClick={() => setActiveMode("what_if")}
          className={cn(
            "flex-1 min-w-[170px] px-3.5 py-2.5 rounded-md text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all",
            activeMode === "what_if"
              ? "bg-ink text-paper shadow-[2px_2px_0_0_var(--color-ink)]"
              : "text-ink/70 hover:text-ink hover:bg-paper"
          )}
        >
          <Sliders className="w-4 h-4" />
          What-If Loan Shock
        </button>

        <button
          onClick={() => setActiveMode("sip_goals")}
          className={cn(
            "flex-1 min-w-[170px] px-3.5 py-2.5 rounded-md text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all",
            activeMode === "sip_goals"
              ? "bg-ink text-paper shadow-[2px_2px_0_0_var(--color-ink)]"
              : "text-ink/70 hover:text-ink hover:bg-paper"
          )}
        >
          <Target className="w-4 h-4" />
          SIP & Goal Compounding
        </button>

        <button
          onClick={() => setActiveMode("debt_accelerator")}
          className={cn(
            "flex-1 min-w-[170px] px-3.5 py-2.5 rounded-md text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all",
            activeMode === "debt_accelerator"
              ? "bg-ink text-paper shadow-[2px_2px_0_0_var(--color-ink)]"
              : "text-ink/70 hover:text-ink hover:bg-paper"
          )}
        >
          <Flame className="w-4 h-4" />
          Debt Payoff (Snowball/Avalanche)
        </button>

        <button
          onClick={() => setActiveMode("budget_rebalance")}
          className={cn(
            "flex-1 min-w-[170px] px-3.5 py-2.5 rounded-md text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all",
            activeMode === "budget_rebalance"
              ? "bg-ink text-paper shadow-[2px_2px_0_0_var(--color-ink)]"
              : "text-ink/70 hover:text-ink hover:bg-paper"
          )}
        >
          <Scale className="w-4 h-4" />
          Budget Rebalancer (50/30/20)
        </button>
      </div>

      {/* ── Active Interactive Simulator Component ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeMode}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
        >
          {activeMode === "what_if" && (
            <WhatIfSimulator
              profile={profile}
              liabilities={liabilities}
              expenses={expenses}
              assets={assets}
              goals={goals}
              baselineScore={currentScore}
            />
          )}

          {activeMode === "sip_goals" && (
            <SipGoalCalculator
              goals={goals}
              monthlySurplus={monthlySurplus}
            />
          )}

          {activeMode === "debt_accelerator" && (
            <DebtPayoffStrategy liabilities={liabilities} />
          )}

          {activeMode === "budget_rebalance" && (
            <BudgetRebalancer
              monthlyIncome={monthlyIncome}
              expenses={expenses}
              liabilities={liabilities}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* ── Random Forest Model Diagnostics Reference Bar ── */}
      <div className="paper-card p-4 border border-ink/30">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink/15 pb-2.5 mb-2.5">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-ink" />
            <h4 className="font-serif text-sm font-bold text-ink">
              Underlying ML Inference Architecture (Port 8001)
            </h4>
          </div>
          <span className="font-mono text-[10px] text-emerald font-semibold uppercase bg-emerald/10 px-2 py-0.5 rounded border border-emerald/30">
            Model v1.0.0 Calibrated
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-[11px]">
          <div>
            <span className="text-ink/60 block text-[10px]">1. DTI Ratio Weight</span>
            <strong className="text-ink">35.6% influence</strong>
          </div>
          <div>
            <span className="text-ink/60 block text-[10px]">2. Net Savings Rate</span>
            <strong className="text-emerald">31.9% influence</strong>
          </div>
          <div>
            <span className="text-ink/60 block text-[10px]">3. Emergency Runway</span>
            <strong className="text-marigold">23.4% influence</strong>
          </div>
          <div>
            <span className="text-ink/60 block text-[10px]">4. Expense Discipline</span>
            <strong className="text-ink/80">9.1% influence</strong>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
