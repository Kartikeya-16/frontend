"use client";

import { useState, useMemo } from "react";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  ShieldAlert,
  Flame,
  Snowflake,
  TrendingDown,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import type { LiabilityResponse } from "@/lib/types";

interface DebtPayoffStrategyProps {
  liabilities: LiabilityResponse[];
}

export function DebtPayoffStrategy({ liabilities }: DebtPayoffStrategyProps) {
  const [strategy, setStrategy] = useState<"avalanche" | "snowball">("avalanche");
  const [extraPayment, setExtraPayment] = useState<number>(5000); // 5000/mo

  // Fallback realistic debts if user has none configured
  const activeDebts = useMemo(() => {
    if (liabilities.length > 0) {
      return liabilities.map((l) => ({
        id: l.id,
        name: l.name,
        balance: Number(l.outstanding_amount || 0),
        rate: Number(l.interest_rate || 10.5),
        emi: Number(l.emi_amount || Math.round(Number(l.outstanding_amount) * 0.025)),
      }));
    }
    // Demo debts for simulation
    return [
      { id: "d1", name: "Credit Card Outstanding", balance: 65000, rate: 36.0, emi: 3500 },
      { id: "d2", name: "Personal Loan", balance: 240000, rate: 14.5, emi: 7200 },
      { id: "d3", name: "Auto Loan", balance: 520000, rate: 9.2, emi: 11400 },
    ];
  }, [liabilities]);

  const totalOutstanding = activeDebts.reduce((sum, d) => sum + d.balance, 0);
  const totalBaseEmi = activeDebts.reduce((sum, d) => sum + d.emi, 0);

  // Sorted debts
  const prioritizedDebts = useMemo(() => {
    const list = [...activeDebts];
    if (strategy === "avalanche") {
      // Highest interest rate first
      return list.sort((a, b) => b.rate - a.rate);
    } else {
      // Lowest balance first (Snowball)
      return list.sort((a, b) => a.balance - b.balance);
    }
  }, [activeDebts, strategy]);

  // Simulation of payoff months and total interest
  // Standard vs Accelerated
  const simulation = useMemo(() => {
    // 1. Standard Payoff approximation
    let standardMonths = 0;
    let standardInterest = 0;
    activeDebts.forEach((d) => {
      const monthlyRate = d.rate / (12 * 100);
      let b = d.balance;
      let m = 0;
      while (b > 0 && m < 360) {
        const interest = b * monthlyRate;
        standardInterest += interest;
        const principalPaid = Math.min(b, d.emi - interest);
        if (principalPaid <= 0) {
          b = 0; // avoid infinite loop
          break;
        }
        b -= principalPaid;
        m++;
      }
      standardMonths = Math.max(standardMonths, m);
    });

    // 2. Accelerated Payoff
    // Priority order gets the extraPayment
    let acceleratedMonths = 0;
    let acceleratedInterest = 0;
    let debtsCopy = prioritizedDebts.map((d) => ({ ...d }));
    let month = 0;

    while (debtsCopy.some((d) => d.balance > 0) && month < 360) {
      month++;
      let extraAvailable = extraPayment;

      for (let i = 0; i < debtsCopy.length; i++) {
        const d = debtsCopy[i];
        if (d.balance <= 0) continue;

        const monthlyRate = d.rate / (12 * 100);
        const interest = d.balance * monthlyRate;
        acceleratedInterest += interest;

        let payment = d.emi;
        if (extraAvailable > 0) {
          payment += extraAvailable;
          extraAvailable = 0;
        }

        const principalPaid = Math.min(d.balance, payment - interest);
        d.balance -= Math.max(0, principalPaid);
      }
    }
    acceleratedMonths = month;

    const interestSaved = Math.max(0, Math.round(standardInterest - acceleratedInterest));
    const monthsSaved = Math.max(0, standardMonths - acceleratedMonths);

    return {
      standardMonths,
      standardInterest: Math.round(standardInterest),
      acceleratedMonths,
      acceleratedInterest: Math.round(acceleratedInterest),
      interestSaved,
      monthsSaved,
    };
  }, [activeDebts, prioritizedDebts, extraPayment]);

  return (
    <div className="space-y-6">
      {/* Header and Strategy Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/20 pb-3">
        <div>
          <h3 className="font-serif text-lg font-bold text-ink flex items-center gap-2">
            <Flame className="w-4 h-4 text-clay" />
            Debt Freedom Accelerator
          </h3>
          <p className="text-xs text-ink/70">
            Compare Avalanche vs Snowball repayment strategies and calculate interest saved with extra prepayments
          </p>
        </div>

        {/* Strategy Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded bg-ink/5 border border-ink/15">
          <button
            onClick={() => setStrategy("avalanche")}
            className={cn(
              "px-3 py-1 rounded text-xs font-mono font-medium flex items-center gap-1.5 transition-all",
              strategy === "avalanche"
                ? "bg-ink text-paper font-bold shadow-[1px_1px_0_0_var(--color-ink)]"
                : "text-ink/70 hover:text-ink hover:bg-paper"
            )}
          >
            <Flame className="w-3.5 h-3.5 text-marigold" />
            Debt Avalanche (Max Savings)
          </button>
          <button
            onClick={() => setStrategy("snowball")}
            className={cn(
              "px-3 py-1 rounded text-xs font-mono font-medium flex items-center gap-1.5 transition-all",
              strategy === "snowball"
                ? "bg-ink text-paper font-bold shadow-[1px_1px_0_0_var(--color-ink)]"
                : "text-ink/70 hover:text-ink hover:bg-paper"
            )}
          >
            <Snowflake className="w-3.5 h-3.5 text-emerald" />
            Debt Snowball (Fast Wins)
          </button>
        </div>
      </div>

      {liabilities.length === 0 && (
        <div className="p-3 rounded border border-marigold/50 bg-marigold/10 text-xs text-ink/80 flex items-center justify-between">
          <span>
            <strong>Demo Simulation Mode:</strong> You haven&apos;t recorded active liabilities in your Twin yet. Showing a representative debt portfolio (Credit Card, Personal Loan, Auto Loan).
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Repayment Priority List (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Prepayment Slider */}
          <div className="paper-card p-5 space-y-3">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-ink font-semibold">Extra Monthly Prepayment Injection</span>
              <span className="font-bold text-sm text-emerald ticker-num bg-emerald/10 px-2.5 py-0.5 rounded border border-emerald/30">
                +{formatINR(extraPayment)} / mo
              </span>
            </div>
            <input
              type="range"
              min={1000}
              max={30000}
              step={1000}
              value={extraPayment}
              onChange={(e) => setExtraPayment(Number(e.target.value))}
              className="w-full accent-emerald cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-ink/50">
              <span>+₹1,000/mo</span>
              <span>+₹15,000/mo</span>
              <span>+₹30,000/mo</span>
            </div>
          </div>

          {/* Ordered Payoff Roadmap */}
          <div className="paper-card p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-ink/15 pb-2">
              <span className="font-serif text-sm font-bold text-ink">
                Repayment Queue ({strategy === "avalanche" ? "High APR First" : "Lowest Balance First"})
              </span>
              <span className="font-mono text-xs text-ink/60">
                Total Debt: {formatINR(totalOutstanding)}
              </span>
            </div>

            <div className="space-y-2.5">
              {prioritizedDebts.map((d, idx) => (
                <div
                  key={d.id}
                  className="p-3 rounded border border-ink/20 bg-paper shadow-[1px_1px_0_0_var(--color-ink)] flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-ink text-paper font-mono text-xs font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div>
                      <h5 className="font-serif text-sm font-bold text-ink">{d.name}</h5>
                      <p className="font-mono text-[10px] text-ink/60 mt-0.5">
                        Balance: {formatINR(d.balance)} · Base EMI: {formatINR(d.emi)}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={cn(
                      "font-mono text-xs font-bold px-2 py-0.5 rounded border border-ink",
                      d.rate >= 18 ? "bg-clay/15 text-clay" : d.rate >= 12 ? "bg-marigold/20 text-ink" : "bg-ink/5 text-ink"
                    )}>
                      {d.rate}% p.a.
                    </span>
                    {idx === 0 && (
                      <span className="block text-[9px] font-mono text-emerald font-bold uppercase mt-1">
                        &larr; Target Priority
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Results Card (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="paper-card p-5 space-y-4 border-2 border-ink">
            <div className="flex items-center justify-between border-b border-ink/20 pb-2">
              <span className="font-mono text-[10px] uppercase font-bold tracking-wider text-ink/60">
                Acceleration Payoff Impact
              </span>
              <span className="font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded border border-emerald/50 bg-emerald/10 text-emerald">
                Fast-Tracked
              </span>
            </div>

            {/* Interest Saved Box */}
            <div className="p-4 rounded border border-ink bg-emerald/10 text-center">
              <p className="font-mono text-[10px] uppercase text-ink/60 font-semibold tracking-wider">
                Total Interest Saved
              </p>
              <p className="font-serif text-3xl font-bold text-emerald ticker-num mt-1">
                {formatINR(simulation.interestSaved)}
              </p>
              <p className="font-mono text-[11px] text-ink/70 mt-1">
                Cash returned directly to your net worth
              </p>
            </div>

            {/* Months Saved Metric */}
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-2.5 rounded border border-ink/20 bg-paper">
                <span className="text-ink/60 text-[10px] uppercase block">Time Shaved Off</span>
                <p className="text-base font-bold text-ink ticker-num mt-0.5">
                  {simulation.monthsSaved} Months
                </p>
                <span className="text-[9px] text-emerald font-bold block mt-0.5">
                  Debt-free {(simulation.monthsSaved / 12).toFixed(1)} yrs earlier
                </span>
              </div>

              <div className="p-2.5 rounded border border-ink/20 bg-paper">
                <span className="text-ink/60 text-[10px] uppercase block">New Debt-Free Horizon</span>
                <p className="text-base font-bold text-ink ticker-num mt-0.5">
                  {simulation.acceleratedMonths} Months
                </p>
                <span className="text-[9px] text-ink/50 block mt-0.5">
                  down from {simulation.standardMonths} mo
                </span>
              </div>
            </div>

            {/* Strategy Explanation Note */}
            <div className="p-3 rounded border border-ink/20 bg-paper text-xs text-ink/80 leading-relaxed font-sans">
              {strategy === "avalanche" ? (
                <p>
                  <strong>Why Avalanche?</strong> By attacking your highest interest loan first (e.g. credit cards at 36%), you minimize total compound interest and mathematically free up cash the fastest.
                </p>
              ) : (
                <p>
                  <strong>Why Snowball?</strong> By eliminating your smallest balances first, you score rapid psychological wins and close out debt accounts, boosting motivation.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
