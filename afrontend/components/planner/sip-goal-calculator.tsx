"use client";

import { useState, useMemo } from "react";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  Target,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Coins,
  ArrowUpRight,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import type { FinancialGoalResponse } from "@/lib/types";

interface SipGoalCalculatorProps {
  goals: FinancialGoalResponse[];
  monthlySurplus: number;
}

export function SipGoalCalculator({ goals, monthlySurplus }: SipGoalCalculatorProps) {
  // Selection
  const [selectedGoalId, setSelectedGoalId] = useState<string>(goals[0]?.id || "custom");
  const [customGoalTitle, setCustomGoalTitle] = useState<string>("Wealth Creation");
  const [targetAmount, setTargetAmount] = useState<number>(2500000); // 25 Lakh
  const [horizonYears, setHorizonYears] = useState<number>(5);
  const [expectedReturn, setExpectedReturn] = useState<number>(12); // 12%
  const [adjustInflation, setAdjustInflation] = useState<boolean>(true);

  // When goal changes
  const handleGoalSelect = (id: string) => {
    setSelectedGoalId(id);
    if (id === "custom") {
      setCustomGoalTitle("Custom Milestone");
      setTargetAmount(2500000);
      setHorizonYears(5);
    } else {
      const g = goals.find((item) => item.id === id);
      if (g) {
        setCustomGoalTitle(g.title);
        const tgt = Math.max(50000, Number(g.target_amount) - Number(g.current_savings || 0));
        setTargetAmount(tgt);
        if (g.target_date) {
          const diffMonths = Math.round(
            (new Date(g.target_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30.4)
          );
          if (diffMonths > 6) setHorizonYears(Math.max(1, Math.round(diffMonths / 12)));
        }
      }
    }
  };

  // Math for SIP:
  // Inflation adjustment: Target_future = Target * (1 + 0.06)^years
  const effectiveTarget = adjustInflation
    ? Math.round(targetAmount * Math.pow(1 + 0.06, horizonYears))
    : targetAmount;

  const totalMonths = horizonYears * 12;
  const monthlyRate = expectedReturn / (12 * 100);

  // SIP formula: FV = P * [ ((1+i)^n - 1) / i ] * (1+i)
  // P = FV / ( [ ((1+i)^n - 1) / i ] * (1+i) )
  const requiredSip = useMemo(() => {
    if (monthlyRate <= 0) return Math.round(effectiveTarget / totalMonths);
    const compoundFactor = ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate) * (1 + monthlyRate);
    return Math.max(500, Math.round(effectiveTarget / compoundFactor));
  }, [effectiveTarget, monthlyRate, totalMonths]);

  const totalInvested = requiredSip * totalMonths;
  const wealthGained = Math.max(0, effectiveTarget - totalInvested);

  // Trajectory Chart Data
  const chartData = useMemo(() => {
    const data = [];
    let currentInvested = 0;
    let currentTotal = 0;

    for (let yr = 1; yr <= horizonYears; yr++) {
      const months = yr * 12;
      currentInvested = requiredSip * months;
      if (monthlyRate > 0) {
        currentTotal =
          requiredSip * (((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate));
      } else {
        currentTotal = currentInvested;
      }

      data.push({
        year: `Yr ${yr}`,
        invested: Math.round(currentInvested),
        growth: Math.round(currentTotal),
      });
    }
    return data;
  }, [horizonYears, requiredSip, monthlyRate]);

  const canAfford = monthlySurplus >= requiredSip;
  const deficit = requiredSip - monthlySurplus;

  return (
    <div className="space-y-6">
      {/* Header and Goal Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/20 pb-3">
        <div>
          <h3 className="font-serif text-lg font-bold text-ink flex items-center gap-2">
            <Target className="w-4 h-4 text-emerald" />
            Goal Wealth & SIP Investment Calculator
          </h3>
          <p className="text-xs text-ink/70">
            Calculate exact monthly mutual fund SIP contributions and compound returns required for your targets
          </p>
        </div>

        {/* Goal Selector Pill Bar */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded bg-ink/5 border border-ink/15">
          {goals.map((g) => (
            <button
              key={g.id}
              onClick={() => handleGoalSelect(g.id)}
              className={cn(
                "px-2.5 py-1 rounded text-xs font-mono font-medium transition-all max-w-[140px] truncate",
                selectedGoalId === g.id
                  ? "bg-ink text-paper font-bold shadow-[1px_1px_0_0_var(--color-ink)]"
                  : "text-ink/70 hover:text-ink hover:bg-paper"
              )}
              title={g.title}
            >
              {g.title}
            </button>
          ))}
          <button
            onClick={() => handleGoalSelect("custom")}
            className={cn(
              "px-2.5 py-1 rounded text-xs font-mono font-medium transition-all",
              selectedGoalId === "custom"
                ? "bg-ink text-paper font-bold shadow-[1px_1px_0_0_var(--color-ink)]"
                : "text-ink/70 hover:text-ink hover:bg-paper"
            )}
          >
            + Custom Milestone
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Interactive Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="paper-card p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-ink/15 pb-2">
              <span className="font-serif text-sm font-bold text-ink">
                Target: {customGoalTitle}
              </span>
              <label className="flex items-center gap-1.5 cursor-pointer text-xs font-mono text-ink/80">
                <input
                  type="checkbox"
                  checked={adjustInflation}
                  onChange={(e) => setAdjustInflation(e.target.checked)}
                  className="rounded accent-ink"
                />
                Include 6% Inflation
              </label>
            </div>

            {/* Target Amount Slider */}
            <div>
              <div className="flex justify-between items-center text-xs font-mono mb-1.5">
                <span className="text-ink font-semibold">Target Goal Corpus</span>
                <span className="font-bold text-sm text-ink ticker-num bg-ink/5 px-2 py-0.5 rounded border border-ink/20">
                  {formatINR(targetAmount)}
                </span>
              </div>
              <input
                type="range"
                min={100000}
                max={20000000}
                step={100000}
                value={targetAmount}
                onChange={(e) => setTargetAmount(Number(e.target.value))}
                className="w-full accent-ink cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-ink/50 mt-0.5">
                <span>₹1 Lakh</span>
                <span>₹50 Lakh</span>
                <span>₹2 Crore</span>
              </div>
              {adjustInflation && (
                <p className="text-[11px] font-mono text-ink/60 mt-1">
                  Adjusted for 6% inflation in {horizonYears} years: <strong className="text-ink">{formatINR(effectiveTarget)}</strong>
                </p>
              )}
            </div>

            {/* Horizon & Expected Return Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <div className="flex justify-between items-center text-xs font-mono mb-1.5">
                  <span className="text-ink font-semibold">Time Horizon</span>
                  <span className="font-bold text-ink ticker-num bg-ink/5 px-2 py-0.5 rounded border border-ink/20">
                    {horizonYears} Years ({totalMonths} mo)
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={25}
                  step={1}
                  value={horizonYears}
                  onChange={(e) => setHorizonYears(Number(e.target.value))}
                  className="w-full accent-ink cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-ink/50 mt-0.5">
                  <span>1 Year</span>
                  <span>12 Yrs</span>
                  <span>25 Yrs</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center text-xs font-mono mb-1.5">
                  <span className="text-ink font-semibold">Expected Return (CAGR)</span>
                  <span className="font-bold text-emerald ticker-num bg-emerald/10 px-2 py-0.5 rounded border border-emerald/30">
                    {expectedReturn}% p.a.
                  </span>
                </div>
                <input
                  type="range"
                  min={7}
                  max={18}
                  step={0.5}
                  value={expectedReturn}
                  onChange={(e) => setExpectedReturn(Number(e.target.value))}
                  className="w-full accent-emerald cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-ink/50 mt-0.5">
                  <span>7% (FD/Debt)</span>
                  <span>12% (Index)</span>
                  <span>18% (Midcap)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Growth Chart */}
          <div className="paper-card p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-ink/15 pb-2">
              <span className="font-mono text-xs uppercase tracking-wider text-ink font-semibold">
                Compound Wealth Trajectory ({horizonYears} Years)
              </span>
              <div className="flex items-center gap-3 text-[10px] font-mono">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-ink" /> Invested
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald" /> Total Wealth
                </span>
              </div>
            </div>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 4" stroke="var(--color-ink)" opacity={0.15} />
                  <XAxis dataKey="year" tick={{ fontSize: 10, fill: "var(--color-ink)" }} />
                  <YAxis
                    tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`}
                    tick={{ fontSize: 10, fill: "var(--color-ink)" }}
                  />
                  <RechartsTooltip
                    formatter={(val: any) => [formatINR(Number(val)), ""]}
                    contentStyle={{
                      background: "var(--color-paper)",
                      border: "1.5px solid var(--color-ink)",
                      borderRadius: 4,
                      fontSize: 11,
                      fontFamily: "var(--font-mono)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="growth"
                    name="Total Wealth"
                    stroke="var(--color-emerald)"
                    fill="var(--color-emerald)"
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="invested"
                    name="Invested Amount"
                    stroke="var(--color-ink)"
                    fill="var(--color-ink)"
                    fillOpacity={0.1}
                    strokeWidth={1.5}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right: SIP Output Box (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="paper-card p-5 space-y-4 border-2 border-ink">
            <div className="flex items-center justify-between border-b border-ink/20 pb-2">
              <span className="font-mono text-[10px] uppercase font-bold tracking-wider text-ink/60">
                Required Investment
              </span>
              <span
                className={cn(
                  "font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded border border-ink shadow-[1px_1px_0_0_var(--color-ink)]",
                  canAfford ? "bg-emerald text-paper" : "bg-clay text-paper"
                )}
              >
                {canAfford ? "Surplus Covered" : "Shortfall Identified"}
              </span>
            </div>

            {/* Stamped SIP Box */}
            <div className="p-4 rounded border border-ink bg-emerald/10 text-center">
              <p className="font-mono text-[10px] uppercase text-ink/60 font-semibold tracking-wider">
                Recommended Monthly SIP
              </p>
              <p className="font-serif text-3xl font-bold text-emerald ticker-num mt-1">
                {formatINR(requiredSip)}
                <span className="font-mono text-xs text-ink/50 font-normal"> / mo</span>
              </p>
              <p className="font-mono text-[10px] text-ink/70 mt-1">
                Targeting <strong>{formatINR(effectiveTarget)}</strong> by {new Date().getFullYear() + horizonYears}
              </p>
            </div>

            {/* Split: Invested vs Capital Gain */}
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-2.5 rounded border border-ink/20 bg-paper">
                <span className="text-ink/60 text-[10px] uppercase block">Total Contribution</span>
                <p className="text-sm font-bold text-ink ticker-num mt-0.5">
                  {formatINR(totalInvested)}
                </p>
                <span className="text-[9px] text-ink/50 block">Your principal capital</span>
              </div>

              <div className="p-2.5 rounded border border-ink/20 bg-emerald/10">
                <span className="text-emerald text-[10px] uppercase block font-semibold">Wealth Gain (Compound)</span>
                <p className="text-sm font-bold text-emerald ticker-num mt-0.5">
                  +{formatINR(wealthGained)}
                </p>
                <span className="text-[9px] text-ink/60 block">Power of compounding</span>
              </div>
            </div>

            {/* Cash Flow Alignment */}
            <div className="p-3 rounded border border-ink/20 bg-paper space-y-1.5 text-xs">
              <div className="flex justify-between font-mono">
                <span className="text-ink/70">Your Monthly Surplus:</span>
                <strong className={cn(monthlySurplus >= 0 ? "text-emerald" : "text-clay")}>
                  {formatINR(monthlySurplus)}
                </strong>
              </div>
              <div className="flex justify-between font-mono">
                <span className="text-ink/70">Required For This Goal:</span>
                <strong className="text-ink">{formatINR(requiredSip)}</strong>
              </div>
              <div className="pt-2 border-t border-ink/15 text-[11px] font-sans leading-relaxed">
                {canAfford ? (
                  <p className="text-emerald font-medium flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    Your monthly surplus covers this SIP with {formatINR(monthlySurplus - requiredSip)} to spare. Set up an automated auto-debit on salary day.
                  </p>
                ) : (
                  <p className="text-clay font-medium flex items-start gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    You need an extra {formatINR(deficit)}/mo to achieve this on schedule. Consider stretching the timeline by {Math.ceil(horizonYears * 1.25 - horizonYears)} years or optimizing discretionary spending.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
