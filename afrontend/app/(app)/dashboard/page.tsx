"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { useTwinStore } from "@/store/twin-store";
import { TwinVisualization } from "@/components/twin-visualization/twin-visualization";
import { InsightCard } from "@/components/dashboard/insight-card";
import { Skeleton } from "@/components/ui/skeleton";
import { pageVariants, fadeInUp, staggerContainer } from "@/lib/motion";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  ShieldAlert,
  TrendingUp,
  Landmark,
  Target,
  RefreshCw,
  SlidersHorizontal,
  Wallet,
  PiggyBank,
  CreditCard,
  Building2,
  Sparkles,
  ArrowUpRight,
  ChevronRight,
  Scale,
  Plus,
  Cpu,
} from "lucide-react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n";
import { calculateLegitHealthScore } from "@/lib/api/planner";
import { matchSchemes } from "@/lib/api/schemes";
import type { MatchedScheme, SchemeUserProfile } from "@/lib/types";

export default function DashboardPage() {
  const { t } = useTranslation();
  const {
    profile,
    goals,
    liabilities,
    expenses,
    assets,
    healthScore,
    isLoading,
    refreshHealthScore,
    fetchAllTwinData,
  } = useTwinStore();

  const [isSyncing, setIsSyncing] = useState(false);
  const [savedName, setSavedName] = useState<string>("");
  const [matchedSchemes, setMatchedSchemes] = useState<MatchedScheme[]>([]);
  const [schemesLoading, setSchemesLoading] = useState(true);

  useEffect(() => {
    if (profile && !healthScore) {
      refreshHealthScore();
    }
  }, [profile, healthScore, refreshHealthScore]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("arthsaathi_user_demographics");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.full_name) setSavedName(parsed.full_name);
        }
      } catch {}
    }
  }, []);

  useEffect(() => {
    async function loadDashboardSchemes() {
      setSchemesLoading(true);
      try {
        let demographics: any = {};
        if (typeof window !== "undefined") {
          try {
            const saved = localStorage.getItem("arthsaathi_user_demographics");
            if (saved) demographics = JSON.parse(saved);
          } catch {}
        }
        const annualIncome = demographics.annual_income !== undefined
          ? Number(demographics.annual_income)
          : profile?.monthly_income
          ? Number(profile.monthly_income) * 12
          : 300000;

        const payload: SchemeUserProfile = {
          gender: demographics.gender || "female",
          age: Number(demographics.age) || profile?.age || 28,
          state: demographics.state || profile?.state || "Central",
          residence: demographics.residence || "urban",
          caste: demographics.caste || "General",
          disability: Boolean(demographics.disability),
          minority: Boolean(demographics.minority),
          is_student: demographics.is_student !== undefined ? Boolean(demographics.is_student) : profile?.occupation_type === "STUDENT",
          bpl: demographics.bpl !== undefined ? Boolean(demographics.bpl) : annualIncome < 120000,
          annual_income: annualIncome,
          applying_for_family: demographics.dependents_count ? Number(demographics.dependents_count) > 0 : Boolean(profile?.dependents_count && profile.dependents_count > 0),
          occupation: demographics.occupation || profile?.occupation,
          occupation_type: demographics.occupation_type || profile?.occupation_type,
        };

        const res = await matchSchemes(payload, 3);
        if (res?.results && res.results.length > 0) {
          setMatchedSchemes(res.results.slice(0, 3));
        }
      } catch (err) {
        console.error("Dashboard scheme matching failed:", err);
      } finally {
        setSchemesLoading(false);
      }
    }

    loadDashboardSchemes();
  }, [profile]);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await fetchAllTwinData();
    } finally {
      setTimeout(() => setIsSyncing(false), 600);
    }
  };

  // Metrics
  const monthlyIncome = Number(profile?.monthly_income || 0);
  const totalMonthlyEMI = liabilities.reduce(
    (sum, l) => sum + Number(l.emi_amount || 0),
    0
  );
  const totalExpenses = expenses.reduce(
    (sum, e) => sum + Number(e.amount || 0),
    0
  );
  const totalAssets = (assets || []).reduce(
    (sum, a) => sum + Number(a.current_value || 0),
    0
  );
  const totalLiab = (liabilities || []).reduce(
    (sum, l) => sum + Number(l.outstanding_amount || 0),
    0
  );

  const netWorth = totalAssets - totalLiab;
  const netMonthlyCashFlow = monthlyIncome - totalExpenses - totalMonthlyEMI;
  const emiRatio = monthlyIncome > 0 ? totalMonthlyEMI / monthlyIncome : 0;
  const savingsRate = monthlyIncome > 0 ? Math.max(0, netMonthlyCashFlow) / monthlyIncome : 0;

  // Breakdown of Assets
  const liquidAssets = (assets || [])
    .filter(
      (a) =>
        a.asset_type === "SAVINGS" ||
        a.asset_type === "FIXED_DEPOSIT" ||
        a.name.toLowerCase().includes("bank") ||
        a.name.toLowerCase().includes("cash") ||
        a.name.toLowerCase().includes("fd")
    )
    .reduce((sum, a) => sum + Number(a.current_value || 0), 0);

  const marketAssets = (assets || [])
    .filter((a) =>
      ["STOCKS", "MUTUAL_FUNDS", "GOLD", "CRYPTO"].includes(a.asset_type)
    )
    .reduce((sum, a) => sum + Number(a.current_value || 0), 0);

  const fixedAssets = Math.max(0, totalAssets - liquidAssets - marketAssets);

  // Breakdown of Liabilities
  const securedLiabilities = (liabilities || [])
    .filter((l) => l.liability_type === "HOME_LOAN" || l.liability_type === "CAR_LOAN")
    .reduce((sum, l) => sum + Number(l.outstanding_amount || 0), 0);

  const unsecuredLiabilities = Math.max(0, totalLiab - securedLiabilities);

  // Emergency runway
  const monthlyBurn = totalExpenses + totalMonthlyEMI;
  const effectiveLiquid = liquidAssets > 0 ? liquidAssets : Math.max(0, totalAssets * 0.3);
  const emergencyMonths = monthlyBurn > 0 ? effectiveLiquid / monthlyBurn : (effectiveLiquid > 0 ? 6.0 : 2.0);

  // 50 / 30 / 20 Budget
  const needsCategories = [
    "HOUSING",
    "FOOD",
    "TRANSPORT",
    "UTILITIES",
    "HEALTHCARE",
    "EDUCATION",
    "INSURANCE",
  ];
  const needsActual =
    expenses
      .filter((e) => needsCategories.includes(e.category))
      .reduce((sum, e) => sum + Number(e.amount || 0), 0) + totalMonthlyEMI;

  const wantsActual = expenses
    .filter((e) => !needsCategories.includes(e.category))
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const savingsActual = Math.max(0, netMonthlyCashFlow);

  const targetNeeds = monthlyIncome * 0.5;
  const targetWants = monthlyIncome * 0.3;
  const targetSavings = monthlyIncome * 0.2;

  // ML Health Score
  const fallbackScoreObj = calculateLegitHealthScore({
    monthly_income: monthlyIncome,
    total_monthly_emis: totalMonthlyEMI,
    total_monthly_expenses: totalExpenses,
    liquid_savings: effectiveLiquid,
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

  // Primary Insight
  function getPrimaryInsight() {
    if (healthScore?.insights && healthScore.insights.length > 0) {
      const insight = healthScore.insights[0];
      const isWarning =
        insight.toLowerCase().includes("high") ||
        insight.toLowerCase().includes("exceed") ||
        insight.toLowerCase().includes("burden") ||
        insight.toLowerCase().includes("risk");
      return {
        icon: isWarning ? AlertTriangle : TrendingUp,
        title: isWarning ? "Debt Burden Advisory" : "AI Financial Diagnosis",
        description: insight,
        variant: isWarning ? ("warning" as const) : ("default" as const),
      };
    }
    if (emiRatio > 0.4) {
      return {
        icon: AlertTriangle,
        title: "High Debt Exposure",
        description: `Your monthly EMIs consume ${(emiRatio * 100).toFixed(0)}% of income (safe threshold is <40%). Consider debt prepayment.`,
        variant: "warning" as const,
      };
    }
    return {
      icon: Sparkles,
      title: "Twin Simulation Active",
      description: `You retain a monthly surplus of ${formatINR(Math.max(0, netMonthlyCashFlow))}. Channel this surplus into your highest-priority goals.`,
      variant: "default" as const,
    };
  }

  const vizGoals = goals.map((g) => ({
    id: g.id,
    name: g.title,
    progress:
      Number(g.target_amount) > 0
        ? Number(g.current_savings) / Number(g.target_amount)
        : 0,
    target_amount: Number(g.target_amount),
    current_savings: Number(g.current_savings),
  }));

  const insight = getPrimaryInsight();

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto py-2">
        <Skeleton className="h-10 w-64 bg-ink/10" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 bg-ink/10 rounded" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Skeleton className="h-96 lg:col-span-5 bg-ink/10 rounded" />
          <Skeleton className="h-96 lg:col-span-7 bg-ink/10 rounded" />
        </div>
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ink/20 pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink tracking-tight">
              {savedName ? `${savedName}'s Command Center` : t("nav.twin", "Financial Command Center")}
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald/10 text-emerald text-[11px] font-mono font-medium border border-emerald/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald animate-pulse" />
              ML Calibrated
            </span>
          </div>
          <p className="font-mono text-xs text-ink/70 mt-0.5">
            {profile?.occupation ? `${profile.occupation} · ` : ""}
            {profile?.city ? `${profile.city}, ${profile.state || "India"}` : "Profile Mapped"}{" "}
            · Tier 2 Analysis Engine
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-medium border border-ink/40 bg-paper hover:bg-marigold/30 transition-colors shadow-[1.5px_1.5px_0_0_var(--color-ink)] disabled:opacity-50"
            title="Refresh latest data"
          >
            <RefreshCw className={cn("w-3 h-3", isSyncing && "animate-spin")} />
            {isSyncing ? "Syncing..." : "Sync Data"}
          </button>
          <Link
            href="/twin"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded text-xs font-mono font-semibold border border-ink bg-ink text-paper hover:bg-marigold hover:text-ink transition-colors shadow-[1.5px_1.5px_0_0_var(--color-ink)]"
          >
            <SlidersHorizontal className="w-3 h-3" />
            Edit Profile
          </Link>
        </div>
      </div>

      {/* ── 4 Key Vitals Strip ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Net Worth */}
        <div className="paper-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-ink/60">
            <span className="font-mono text-[10px] uppercase font-semibold tracking-wider">
              Net Worth
            </span>
            <Wallet className="w-4 h-4" />
          </div>
          <p className={cn("font-serif text-2xl font-bold ticker-num my-1.5", netWorth >= 0 ? "text-ink" : "text-clay")}>
            {formatINR(netWorth)}
          </p>
          <p className="font-mono text-[10px] text-ink/60">
            Assets {formatINR(totalAssets)} · Debt {formatINR(totalLiab)}
          </p>
        </div>

        {/* Metric 2: Free Cash Flow */}
        <div className="paper-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-ink/60">
            <span className="font-mono text-[10px] uppercase font-semibold tracking-wider">
              Monthly Cash Flow
            </span>
            <TrendingUp className="w-4 h-4 text-emerald" />
          </div>
          <p className={cn("font-serif text-2xl font-bold ticker-num my-1.5", netMonthlyCashFlow >= 0 ? "text-emerald" : "text-clay")}>
            {formatINR(netMonthlyCashFlow)}
          </p>
          <div className="flex items-center justify-between font-mono text-[10px]">
            <span className="text-ink/60">Uncommitted</span>
            <span className={cn("font-bold uppercase px-1 rounded text-[9px]", netMonthlyCashFlow >= 0 ? "bg-emerald/10 text-emerald" : "bg-clay/10 text-clay")}>
              {netMonthlyCashFlow >= 0 ? "Surplus" : "Deficit"}
            </span>
          </div>
        </div>

        {/* Metric 3: Emergency Runway */}
        <div className="paper-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-ink/60">
            <span className="font-mono text-[10px] uppercase font-semibold tracking-wider">
              Emergency Runway
            </span>
            <PiggyBank className="w-4 h-4 text-marigold" />
          </div>
          <p className="font-serif text-2xl font-bold text-ink ticker-num my-1.5">
            {emergencyMonths.toFixed(1)} <span className="text-xs font-mono text-ink/60 font-normal">Mos</span>
          </p>
          <div className="flex items-center justify-between font-mono text-[10px]">
            <span className="text-ink/60">Liquid: {formatINR(effectiveLiquid)}</span>
            <span className={cn("font-bold uppercase px-1 rounded text-[9px]", emergencyMonths >= 6 ? "bg-emerald/10 text-emerald" : "bg-marigold/20 text-ink")}>
              {emergencyMonths >= 6 ? "6+ Mo Safe" : "Under 6 Mo"}
            </span>
          </div>
        </div>

        {/* Metric 4: Debt-to-Income */}
        <div className="paper-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-ink/60">
            <span className="font-mono text-[10px] uppercase font-semibold tracking-wider">
              Debt Ratio (DTI)
            </span>
            <CreditCard className="w-4 h-4 text-ink/60" />
          </div>
          <p className={cn("font-serif text-2xl font-bold ticker-num my-1.5", emiRatio > 0.4 ? "text-clay" : "text-ink")}>
            {(emiRatio * 100).toFixed(0)}%
          </p>
          <div className="flex items-center justify-between font-mono text-[10px]">
            <span className="text-ink/60">EMI: {formatINR(totalMonthlyEMI)}</span>
            <span className={cn("font-bold uppercase px-1 rounded text-[9px]", emiRatio > 0.4 ? "bg-clay/10 text-clay" : "bg-emerald/10 text-emerald")}>
              {emiRatio > 0.4 ? "Heavy Debt" : "Safe <40%"}
            </span>
          </div>
        </div>
      </div>

      {/* ── Balanced Two-Column Stage (Twin Diagram on Left + Insight & Cash Flow on Right) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: Digital Twin Visual + Score */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="paper-card p-5 flex flex-col items-center justify-between text-center h-full">
            <div className="w-full flex items-center justify-between border-b border-ink/20 pb-2.5 mb-2">
              <span className="font-mono text-[11px] uppercase tracking-wider text-ink font-semibold">
                Digital Twin
              </span>
              <span className="font-mono text-xs text-ink/60">
                {vizGoals.length} Active Goals
              </span>
            </div>

            {/* Radial Visual */}
            <div className="py-2 w-full flex justify-center flex-1 items-center">
              <TwinVisualization
                healthScore={currentScore}
                goals={vizGoals}
                category={currentCategory}
              />
            </div>

            {/* Score & Status Stamp */}
            <div className="w-full pt-3 border-t border-ink/20 mt-1 flex items-center justify-between">
              <div className="text-left">
                <p className="font-mono text-[10px] text-ink/60 uppercase">ML Health Score</p>
                <p className="font-serif text-2xl font-bold text-ink ticker-num">
                  {currentScore.toFixed(1)}
                  <span className="font-mono text-xs text-ink/50 font-normal"> / 100</span>
                </p>
              </div>
              <span
                className={cn(
                  "font-mono text-xs uppercase px-2.5 py-1 rounded border border-ink font-bold shadow-[1.5px_1.5px_0_0_var(--color-ink)]",
                  currentCategory === "EXCELLENT" && "bg-emerald text-paper",
                  currentCategory === "GOOD" && "bg-emerald/70 text-paper",
                  currentCategory === "FAIR" && "bg-marigold text-ink",
                  currentCategory === "POOR" && "bg-clay text-paper"
                )}
              >
                {t(`category.${currentCategory}`, currentCategory)}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Actionable Insight & Unified Cash Flow / 50-30-20 Budget */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          {/* Actionable Insight Box */}
          <InsightCard {...insight} />

          <div className="paper-card p-5 space-y-5 flex-1 flex flex-col justify-between">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-ink/20 pb-2.5">
              <div>
                <h3 className="font-serif text-base font-bold text-ink">Cash Flow & 50/30/20 Budget</h3>
                <p className="text-xs text-ink/60">Living costs, obligations, and capital accumulation</p>
              </div>
              <span className={cn(
                "font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded border border-ink/30",
                needsActual <= targetNeeds * 1.1 ? "bg-emerald/10 text-emerald" : "bg-marigold/20 text-ink"
              )}>
                {needsActual <= targetNeeds * 1.1 ? "Rule Compliant" : "High Needs Exposure"}
              </span>
            </div>

            {/* 3 Core Inflow & Outflow Metrics */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded border border-ink/20 bg-paper/60">
                <p className="font-mono text-[10px] uppercase text-ink/60">Take-Home Income</p>
                <p className="font-mono text-base font-bold text-emerald ticker-num mt-0.5">
                  {formatINR(monthlyIncome)}
                </p>
              </div>

              <div className="p-3 rounded border border-ink/20 bg-paper/60">
                <p className="font-mono text-[10px] uppercase text-ink/60">Living Outflows</p>
                <p className="font-mono text-base font-bold text-ink ticker-num mt-0.5">
                  {formatINR(totalExpenses)}
                </p>
              </div>

              <div className="p-3 rounded border border-ink/20 bg-paper/60">
                <p className="font-mono text-[10px] uppercase text-ink/60">Monthly EMIs</p>
                <p className={cn("font-mono text-base font-bold ticker-num mt-0.5", emiRatio > 0.4 ? "text-clay" : "text-ink")}>
                  {formatINR(totalMonthlyEMI)}
                </p>
              </div>
            </div>

            {/* 50 / 30 / 20 Rule Breakdown */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-ink font-semibold">50/30/20 Allocation Meter</span>
                <span className="text-ink/60 text-[11px]">
                  Needs (50%) · Wants (30%) · Savings (20%)
                </span>
              </div>

              {/* Segmented bar */}
              <div className="w-full h-3.5 rounded border border-ink/40 bg-ink/5 overflow-hidden flex shadow-[1px_1px_0_0_var(--color-ink)]">
                <div
                  className="bg-ink h-full border-r border-ink/30 transition-all"
                  style={{ width: `${monthlyIncome > 0 ? Math.min(100, (needsActual / monthlyIncome) * 100) : 50}%` }}
                  title="Needs"
                />
                <div
                  className="bg-marigold h-full border-r border-ink/30 transition-all"
                  style={{ width: `${monthlyIncome > 0 ? Math.min(100, (wantsActual / monthlyIncome) * 100) : 30}%` }}
                  title="Wants"
                />
                <div
                  className="bg-emerald h-full transition-all"
                  style={{ width: `${monthlyIncome > 0 ? Math.min(100, (savingsActual / monthlyIncome) * 100) : 20}%` }}
                  title="Savings"
                />
              </div>

              {/* 3 Balanced Pillars */}
              <div className="grid grid-cols-3 gap-2.5 pt-2">
                <div className="p-2 rounded border border-ink/20 bg-ink/5">
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className="w-2 h-2 rounded-full bg-ink" />
                    <span className="font-mono text-[10px] font-bold text-ink">Needs (50%)</span>
                  </div>
                  <p className="font-mono text-xs font-bold text-ink ticker-num">{formatINR(needsActual)}</p>
                  <p className="text-[9px] text-ink/60">Tgt: ≤{formatINR(targetNeeds)}</p>
                </div>

                <div className="p-2 rounded border border-ink/20 bg-marigold/10">
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className="w-2 h-2 rounded-full bg-marigold" />
                    <span className="font-mono text-[10px] font-bold text-ink">Wants (30%)</span>
                  </div>
                  <p className="font-mono text-xs font-bold text-ink ticker-num">{formatINR(wantsActual)}</p>
                  <p className="text-[9px] text-ink/60">Tgt: ≤{formatINR(targetWants)}</p>
                </div>

                <div className="p-2 rounded border border-ink/20 bg-emerald/10">
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald" />
                    <span className="font-mono text-[10px] font-bold text-ink">Savings (20%)</span>
                  </div>
                  <p className="font-mono text-xs font-bold text-emerald ticker-num">{formatINR(savingsActual)}</p>
                  <p className="text-[9px] text-ink/60">Tgt: ≥{formatINR(targetSavings)}</p>
                </div>
              </div>
            </div>

            {/* Quick Action footer */}
            <div className="flex items-center justify-between pt-2 border-t border-ink/15 text-xs">
              <span className="text-ink/60 font-mono">
                Surplus Rate: <strong className="text-emerald">{(savingsRate * 100).toFixed(0)}%</strong>
              </span>
              <Link
                href="/planner"
                className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-ink hover:text-emerald"
              >
                Run Budget Stress Test <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Asset Portfolio vs Debt Structure Matrix ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Assets Allocation Card */}
        <div className="paper-card p-5">
          <div className="flex items-center justify-between border-b border-ink/20 pb-2.5 mb-3.5">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald" />
              <h3 className="font-serif text-base font-bold text-ink">Asset Allocation Portfolio</h3>
            </div>
            <span className="font-mono text-xs font-bold text-emerald ticker-num">
              {formatINR(totalAssets)}
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between items-center text-xs font-mono mb-1">
                <span className="text-ink font-medium">Liquid Cash & Bank Accounts</span>
                <span className="font-bold ticker-num">{formatINR(liquidAssets)}</span>
              </div>
              <div className="w-full h-2 rounded bg-ink/10 overflow-hidden">
                <div
                  className="bg-emerald h-full rounded transition-all"
                  style={{ width: `${totalAssets > 0 ? (liquidAssets / totalAssets) * 100 : 33}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center text-xs font-mono mb-1">
                <span className="text-ink font-medium">Market Investments (Equities / Gold / MF)</span>
                <span className="font-bold ticker-num">{formatINR(marketAssets)}</span>
              </div>
              <div className="w-full h-2 rounded bg-ink/10 overflow-hidden">
                <div
                  className="bg-marigold h-full rounded transition-all"
                  style={{ width: `${totalAssets > 0 ? (marketAssets / totalAssets) * 100 : 33}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center text-xs font-mono mb-1">
                <span className="text-ink font-medium">Fixed & Tangible Assets (Property / Vehicles)</span>
                <span className="font-bold ticker-num">{formatINR(fixedAssets)}</span>
              </div>
              <div className="w-full h-2 rounded bg-ink/10 overflow-hidden">
                <div
                  className="bg-ink h-full rounded transition-all"
                  style={{ width: `${totalAssets > 0 ? (fixedAssets / totalAssets) * 100 : 34}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-ink/15 flex items-center justify-between text-xs">
            <span className="text-ink/60">{(assets || []).length} recorded assets</span>
            <Link
              href="/twin"
              className="inline-flex items-center gap-1 font-mono font-semibold text-ink hover:text-emerald transition-colors"
            >
              Manage Assets <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Debt Exposure & Liabilities Card */}
        <div className="paper-card p-5">
          <div className="flex items-center justify-between border-b border-ink/20 pb-2.5 mb-3.5">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-clay" />
              <h3 className="font-serif text-base font-bold text-ink">Debt & Liability Structure</h3>
            </div>
            <span className={cn("font-mono text-xs font-bold ticker-num", totalLiab > 0 ? "text-clay" : "text-emerald")}>
              {formatINR(totalLiab)}
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between items-center text-xs font-mono mb-1">
                <span className="text-ink font-medium">Secured Loans (Home & Vehicle)</span>
                <span className="font-bold ticker-num">{formatINR(securedLiabilities)}</span>
              </div>
              <div className="w-full h-2 rounded bg-ink/10 overflow-hidden">
                <div
                  className="bg-ink h-full rounded transition-all"
                  style={{ width: `${totalLiab > 0 ? (securedLiabilities / totalLiab) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center text-xs font-mono mb-1">
                <span className="text-ink font-medium">Unsecured Debt (Personal & Credit Cards)</span>
                <span className="font-bold ticker-num">{formatINR(unsecuredLiabilities)}</span>
              </div>
              <div className="w-full h-2 rounded bg-ink/10 overflow-hidden">
                <div
                  className="bg-clay h-full rounded transition-all"
                  style={{ width: `${totalLiab > 0 ? (unsecuredLiabilities / totalLiab) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div className="p-2.5 rounded border border-ink/15 bg-paper/60 flex items-center justify-between">
              <div>
                <p className="font-mono text-[10px] text-ink/60 uppercase">Monthly EMI Outflow</p>
                <p className="font-serif text-sm font-bold text-ink ticker-num">{formatINR(totalMonthlyEMI)} / mo</p>
              </div>
              <span className={cn("font-mono text-[9px] uppercase font-bold px-2 py-0.5 rounded border border-ink", emiRatio <= 0.4 ? "bg-emerald/10 text-emerald" : "bg-clay/10 text-clay")}>
                {emiRatio <= 0.4 ? "Safe Ratio" : "Exceeds 40% Target"}
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-ink/15 flex items-center justify-between text-xs">
            <span className="text-ink/60">{(liabilities || []).length} recorded liabilities</span>
            <Link
              href="/twin"
              className="inline-flex items-center gap-1 font-mono font-semibold text-ink hover:text-clay transition-colors"
            >
              Manage Debt <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* ── Active Financial Milestones Radar ── */}
      <div className="paper-card p-5">
        <div className="flex items-center justify-between border-b border-ink/20 pb-2.5 mb-4">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-ink" />
            <h3 className="font-serif text-base font-bold text-ink">Active Financial Milestones</h3>
          </div>
          <Link
            href="/twin"
            className="font-mono text-xs text-ink/70 hover:text-ink font-semibold inline-flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> Add Milestone ({goals.length})
          </Link>
        </div>

        {goals.length === 0 ? (
          <div className="text-center py-6 px-4 border border-dashed border-ink/20 rounded bg-paper/40">
            <Target className="w-6 h-6 text-ink/40 mx-auto mb-1.5" />
            <p className="font-serif text-sm font-semibold text-ink">No Active Goals Recorded</p>
            <p className="text-xs text-ink/60 max-w-sm mx-auto mt-0.5 mb-3">
              Define goals to calculate time-to-goal feasibility with your digital twin.
            </p>
            <Link
              href="/twin"
              className="inline-flex items-center gap-1 px-3 py-1 rounded text-xs font-mono font-semibold border border-ink bg-ink text-paper hover:bg-marigold hover:text-ink transition-colors"
            >
              + Define First Goal
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {goals.map((g) => {
              const target = Number(g.target_amount || 0);
              const current = Number(g.current_savings || 0);
              const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
              const remaining = Math.max(0, target - current);

              return (
                <div
                  key={g.id}
                  className="p-3.5 rounded border border-ink/30 bg-paper shadow-[1px_1px_0_0_var(--color-ink)] flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-serif text-sm font-bold text-ink truncate">{g.title}</span>
                      <span className="font-mono text-xs font-bold text-ink ticker-num">{pct}%</span>
                    </div>
                    <div className="w-full h-2 rounded bg-ink/10 overflow-hidden my-2 border border-ink/20">
                      <div className="h-full bg-emerald transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between font-mono text-[10px] text-ink/70 pt-1 border-t border-ink/10">
                    <span>Saved: <strong>{formatINR(current)}</strong></span>
                    <span>Target: {formatINR(target)}</span>
                    <span className="text-emerald font-semibold">
                      {remaining === 0 ? "Goal Met" : `Need ${formatINR(remaining)}`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Pillar 4 · Top Recommended Welfare Schemes ── */}
      <div className="paper-card p-5">
        <div className="flex items-center justify-between border-b border-ink/20 pb-2.5 mb-4">
          <div className="flex items-center gap-2">
            <Landmark className="w-4 h-4 text-emerald" />
            <div>
              <h3 className="font-serif text-base font-bold text-ink">
                Recommended Government Welfare Schemes
              </h3>
              <p className="text-xs text-ink/60">Subsidies and benefits matched to your profile</p>
            </div>
          </div>
          <Link
            href="/schemes"
            className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-ink hover:text-emerald"
          >
            All 15+ Schemes <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {schemesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-3.5 rounded border border-ink/20 bg-paper/50 animate-pulse h-36 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="h-4 bg-ink/10 rounded w-1/3" />
                  <div className="h-5 bg-ink/10 rounded w-3/4" />
                  <div className="h-3 bg-ink/10 rounded w-full" />
                </div>
                <div className="h-4 bg-ink/10 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : matchedSchemes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {matchedSchemes.map((scheme, idx) => (
              <div
                key={scheme.slug || idx}
                className="p-3.5 rounded border border-ink/30 bg-paper shadow-[1px_1px_0_0_var(--color-ink)] flex flex-col justify-between hover:bg-emerald/5 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-[9px] uppercase font-bold text-emerald bg-emerald/10 px-1.5 py-0.5 rounded border border-emerald/30">
                      {Math.round(scheme.match_score)}% Match · {scheme.category || "Welfare"}
                    </span>
                    <span className="font-mono text-[10px] text-ink/60">{scheme.state || "Central"}</span>
                  </div>
                  <h4 className="font-serif text-sm font-bold text-ink line-clamp-1">
                    {scheme.name}
                  </h4>
                  <p className="text-[11px] text-ink/70 mt-1 line-clamp-2">
                    {scheme.benefits || scheme.description || "Subsidized government welfare benefit."}
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-ink/15 flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold text-emerald truncate max-w-[130px]">
                    {scheme.matched_criteria?.[0] || "Profile Matched"}
                  </span>
                  <Link href="/schemes" className="font-mono text-[10px] font-bold text-ink underline hover:text-emerald shrink-0">
                    Check Eligibility →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center border border-dashed border-ink/30 rounded bg-paper/50 space-y-2">
            <p className="text-xs text-ink/70">
              Complete your profile or explore our repository of 4,800+ central and state schemes.
            </p>
            <Link
              href="/schemes"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-ink bg-marigold text-ink font-mono text-xs font-bold"
            >
              Explore Schemes →
            </Link>
          </div>
        )}
      </div>

      {/* ── Pillar Hub Quick Launcher ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <Link href="/planner" className="group block">
          <div className="paper-card p-3.5 group-hover:bg-marigold/10 transition-colors flex items-center gap-3">
            <div className="w-8 h-8 rounded border border-ink bg-paper flex items-center justify-center shrink-0 shadow-[1px_1px_0_0_var(--color-ink)]">
              <TrendingUp className="w-4 h-4 text-ink" />
            </div>
            <div className="min-w-0">
              <p className="font-serif text-xs font-bold text-ink truncate">Smart Planner</p>
              <p className="font-mono text-[10px] text-ink/60 truncate">Simulate EMI Impact</p>
            </div>
          </div>
        </Link>

        <Link href="/scam-shield" className="group block">
          <div className="paper-card p-3.5 group-hover:bg-clay/10 transition-colors flex items-center gap-3">
            <div className="w-8 h-8 rounded border border-ink bg-paper flex items-center justify-center shrink-0 shadow-[1px_1px_0_0_var(--color-ink)]">
              <ShieldAlert className="w-4 h-4 text-ink" />
            </div>
            <div className="min-w-0">
              <p className="font-serif text-xs font-bold text-ink truncate">Scam Shield</p>
              <p className="font-mono text-[10px] text-ink/60 truncate">Scan Phishing & SMS</p>
            </div>
          </div>
        </Link>

        <Link href="/schemes" className="group block">
          <div className="paper-card p-3.5 group-hover:bg-emerald/10 transition-colors flex items-center gap-3">
            <div className="w-8 h-8 rounded border border-ink bg-paper flex items-center justify-center shrink-0 shadow-[1px_1px_0_0_var(--color-ink)]">
              <Landmark className="w-4 h-4 text-ink" />
            </div>
            <div className="min-w-0">
              <p className="font-serif text-xs font-bold text-ink truncate">Scheme Navigator</p>
              <p className="font-mono text-[10px] text-ink/60 truncate">Check Subsidies</p>
            </div>
          </div>
        </Link>

        <Link href="/twin" className="group block">
          <div className="paper-card p-3.5 group-hover:bg-ink/5 transition-colors flex items-center gap-3">
            <div className="w-8 h-8 rounded border border-ink bg-paper flex items-center justify-center shrink-0 shadow-[1px_1px_0_0_var(--color-ink)]">
              <SlidersHorizontal className="w-4 h-4 text-ink" />
            </div>
            <div className="min-w-0">
              <p className="font-serif text-xs font-bold text-ink truncate">Twin Studio</p>
              <p className="font-mono text-[10px] text-ink/60 truncate">Edit Demographics</p>
            </div>
          </div>
        </Link>
      </div>
    </motion.div>
  );
}
