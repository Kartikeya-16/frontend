"use client";

import { useState } from "react";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  Scale,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import type { ExpenseResponse, LiabilityResponse } from "@/lib/types";

interface BudgetRebalancerProps {
  monthlyIncome: number;
  expenses: ExpenseResponse[];
  liabilities: LiabilityResponse[];
}

export function BudgetRebalancer({
  monthlyIncome,
  expenses,
  liabilities,
}: BudgetRebalancerProps) {
  // Target percentages
  const [targetNeedsPct, setTargetNeedsPct] = useState<number>(50);
  const [targetWantsPct, setTargetWantsPct] = useState<number>(30);
  const targetSavingsPct = Math.max(0, 100 - targetNeedsPct - targetWantsPct);

  // Actual numbers
  const totalEmi = liabilities.reduce((sum, l) => sum + Number(l.emi_amount || 0), 0);
  const needsCategories = [
    "HOUSING",
    "FOOD",
    "TRANSPORT",
    "UTILITIES",
    "HEALTHCARE",
    "EDUCATION",
    "INSURANCE",
  ];

  const actualNeeds =
    expenses
      .filter((e) => needsCategories.includes(e.category))
      .reduce((sum, e) => sum + Number(e.amount || 0), 0) + totalEmi;

  const actualWants = expenses
    .filter((e) => !needsCategories.includes(e.category))
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const actualSavings = Math.max(0, monthlyIncome - actualNeeds - actualWants);

  // Computed Target Rupees
  const targetNeedsAmt = Math.round((monthlyIncome * targetNeedsPct) / 100);
  const targetWantsAmt = Math.round((monthlyIncome * targetWantsPct) / 100);
  const targetSavingsAmt = Math.round((monthlyIncome * targetSavingsPct) / 100);

  // Gaps
  const needsDiff = actualNeeds - targetNeedsAmt;
  const wantsDiff = actualWants - targetWantsAmt;
  const savingsGain = targetSavingsAmt - actualSavings;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/20 pb-3">
        <div>
          <h3 className="font-serif text-lg font-bold text-ink flex items-center gap-2">
            <Scale className="w-4 h-4 text-ink" />
            Dynamic Budget Rebalancer
          </h3>
          <p className="text-xs text-ink/70">
            Slide targets to remodel your cash flow, optimize discretionary leaks, and unlock surplus capital
          </p>
        </div>

        <span className="font-mono text-xs font-bold text-ink bg-ink/5 px-2.5 py-1 rounded border border-ink/20">
          Income Base: {formatINR(monthlyIncome)} / mo
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Sliders (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="paper-card p-5 space-y-4">
            <h4 className="font-serif text-sm font-bold text-ink border-b border-ink/15 pb-2">
              Set Your Ideal Budget Allocation
            </h4>

            {/* Needs Slider */}
            <div>
              <div className="flex justify-between items-center text-xs font-mono mb-1.5">
                <span className="text-ink font-semibold">Essential Needs Target</span>
                <span className="font-bold text-ink ticker-num bg-ink/5 px-2 py-0.5 rounded border border-ink/20">
                  {targetNeedsPct}% ({formatINR(targetNeedsAmt)})
                </span>
              </div>
              <input
                type="range"
                min={35}
                max={70}
                step={5}
                value={targetNeedsPct}
                onChange={(e) => setTargetNeedsPct(Number(e.target.value))}
                className="w-full accent-ink cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-ink/50 mt-0.5">
                <span>35% (Lean)</span>
                <span>50% (Standard)</span>
                <span>70% (Heavy)</span>
              </div>
            </div>

            {/* Wants Slider */}
            <div>
              <div className="flex justify-between items-center text-xs font-mono mb-1.5">
                <span className="text-ink font-semibold">Lifestyle & Wants Target</span>
                <span className="font-bold text-marigold ticker-num bg-marigold/10 px-2 py-0.5 rounded border border-marigold/30">
                  {targetWantsPct}% ({formatINR(targetWantsAmt)})
                </span>
              </div>
              <input
                type="range"
                min={10}
                max={45}
                step={5}
                value={targetWantsPct}
                onChange={(e) => setTargetWantsPct(Number(e.target.value))}
                className="w-full accent-marigold cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-ink/50 mt-0.5">
                <span>10% (Frugal)</span>
                <span>30% (Standard)</span>
                <span>45% (High Spend)</span>
              </div>
            </div>

            {/* Resulting Savings Target */}
            <div className="p-3 rounded border border-emerald/40 bg-emerald/10 flex items-center justify-between">
              <div>
                <span className="font-mono text-[10px] uppercase font-bold text-emerald tracking-wider block">
                  Resulting Wealth Accumulation Target
                </span>
                <p className="font-serif text-lg font-bold text-emerald ticker-num">
                  {targetSavingsPct}% · {formatINR(targetSavingsAmt)} / mo
                </p>
              </div>
              <span className="font-mono text-xs text-ink/60">
                Auto-balances to 100%
              </span>
            </div>
          </div>
        </div>

        {/* Right: Actual vs Target Comparison (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="paper-card p-5 space-y-4 border-2 border-ink">
            <h4 className="font-serif text-sm font-bold text-ink border-b border-ink/15 pb-2">
              Actual vs Rebalanced Plan
            </h4>

            {/* Needs Row */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-ink font-semibold">1. Needs & Fixed EMIs</span>
                <span className={cn("font-bold", needsDiff > 0 ? "text-clay" : "text-emerald")}>
                  {needsDiff > 0 ? `Overspend +${formatINR(needsDiff)}` : `Within Target (-${formatINR(Math.abs(needsDiff))})`}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-ink/70">
                <span>Actual: <strong>{formatINR(actualNeeds)}</strong></span>
                <ArrowRight className="w-3 h-3" />
                <span>Target: <strong>{formatINR(targetNeedsAmt)}</strong></span>
              </div>
            </div>

            {/* Wants Row */}
            <div className="space-y-1 pt-2 border-t border-ink/10">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-ink font-semibold">2. Lifestyle & Discretionary</span>
                <span className={cn("font-bold", wantsDiff > 0 ? "text-clay" : "text-emerald")}>
                  {wantsDiff > 0 ? `Trim by ${formatINR(wantsDiff)}` : "Comfortable"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-ink/70">
                <span>Actual: <strong>{formatINR(actualWants)}</strong></span>
                <ArrowRight className="w-3 h-3" />
                <span>Target: <strong>{formatINR(targetWantsAmt)}</strong></span>
              </div>
            </div>

            {/* Savings Gain Callout */}
            <div className="p-3.5 rounded border border-ink bg-paper shadow-[1.5px_1.5px_0_0_var(--color-ink)] space-y-1">
              <span className="font-mono text-[10px] uppercase font-bold text-emerald tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Annual Compounding Opportunity
              </span>
              <p className="text-xs text-ink/80 leading-relaxed font-sans">
                By adjusting lifestyle spending to your <strong>{targetWantsPct}%</strong> target, you unlock an extra{" "}
                <strong className="text-emerald font-mono">{formatINR(Math.max(0, savingsGain))}</strong> per month, accumulating{" "}
                <strong className="text-emerald font-mono">{formatINR(Math.max(0, savingsGain * 12))}</strong> in extra capital each year.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
