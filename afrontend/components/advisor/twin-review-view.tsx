"use client";

import { useState } from "react";
import Link from "next/link";
import { useAdvisorStore } from "@/store/advisor-store";
import { formatINR } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
  Pencil,
  Info,
  CheckCircle2,
  Calendar,
  Building,
  Target,
  Users,
} from "lucide-react";
import { toast } from "sonner";

export function TwinReviewView() {
  const {
    profile,
    twinGaps,
    skippedGoals,
    twinUpdatedAt,
    hasUsedSavedAnswers,
    updateProfile,
    setStep,
  } = useAdvisorStore();

  const [adjustingSection, setAdjustingSection] = useState<string | null>(null);

  const handleContinue = () => {
    // Validate missing items
    if (profile.daughters_under_10 < 0) {
      toast.error("Daughters under 10 cannot be negative.");
      return;
    }
    if (profile.insurance.term_cover_inr < 0) {
      toast.error("Term life cover cannot be negative.");
      return;
    }
    if (profile.insurance.health_cover_inr < 0) {
      toast.error("Health cover cannot be negative.");
      return;
    }

    setStep(2);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Review Your Financial Twin Data
            </h2>
            <Badge variant="secondary" className="gap-1 bg-primary/10 text-primary text-xs">
              <Sparkles className="w-3.5 h-3.5" /> From your Twin
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {twinUpdatedAt
              ? `Last updated on ${new Date(twinUpdatedAt).toLocaleDateString()}`
              : "Synchronized with your personal digital twin profile"}
          </p>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          asChild
          className="text-xs text-primary gap-1"
        >
          <Link href="/twin">
            Edit in Financial Twin <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </Button>
      </div>

      {/* Twin Gaps Warnings (if any) */}
      {twinGaps && twinGaps.length > 0 && (
        <div className="space-y-3">
          {twinGaps.map((gap, gIdx) => (
            <div
              key={gIdx}
              className="flex items-start justify-between gap-4 p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300 text-sm"
            >
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold">{gap.message}</p>
                  <p className="text-xs text-muted-foreground">
                    Adding this to your Financial Twin ensures accurate budgeting and debt calculations.
                  </p>
                </div>
              </div>
              <Button asChild size="sm" variant="outline" className="h-8 text-xs shrink-0 border-amber-500/40 hover:bg-amber-500/20">
                <Link href={gap.link}>Fix in Twin</Link>
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Skipped Goals Note */}
      {skippedGoals && skippedGoals.length > 0 && (
        <div className="p-4 rounded-2xl border bg-muted/40 text-xs text-muted-foreground space-y-1">
          <div className="flex items-center gap-2 font-medium text-foreground">
            <Info className="w-4 h-4 text-primary" />
            <span>Goals left out ({skippedGoals.length})</span>
          </div>
          <p>
            Goals without a future target date or past milestones were excluded:{" "}
            {skippedGoals.map((sg) => sg.name).join(", ")}. You can update their target dates in your Financial Twin.
          </p>
        </div>
      )}

      {/* Summary Cards of Twin Data */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Income & Living Expenses */}
        <div className="rounded-2xl border bg-card p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-sm text-foreground">Cash Flow & Savings</h3>
            </div>
            <button
              type="button"
              onClick={() => setAdjustingSection(adjustingSection === "cashflow" ? null : "cashflow")}
              className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
            >
              <Pencil className="w-3 h-3" /> Adjust for this plan
            </button>
          </div>

          {adjustingSection === "cashflow" ? (
            <div className="space-y-3 pt-1">
              <p className="text-[11px] text-muted-foreground italic">
                Edits here apply to this advisor plan only and do not modify your permanent Financial Twin.
              </p>
              <div className="space-y-1">
                <Label className="text-xs">Monthly Income (₹)</Label>
                <Input
                  type="number"
                  className="h-8 text-xs"
                  value={profile.monthly_income_inr || ""}
                  onChange={(e) => updateProfile({ monthly_income_inr: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Monthly Living Expenses (₹)</Label>
                <Input
                  type="number"
                  className="h-8 text-xs"
                  value={profile.monthly_expenses_inr || ""}
                  onChange={(e) => updateProfile({ monthly_expenses_inr: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Emergency Fund (₹)</Label>
                <Input
                  type="number"
                  className="h-8 text-xs"
                  value={profile.emergency_fund_inr || ""}
                  onChange={(e) => updateProfile({ emergency_fund_inr: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Monthly Inflow:</span>
                <span className="font-semibold text-foreground">{formatINR(profile.monthly_income_inr)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Living Outflow:</span>
                <span className="font-semibold text-foreground">{formatINR(profile.monthly_expenses_inr)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Liquid Emergency Fund:</span>
                <span className="font-semibold text-foreground">{formatINR(profile.emergency_fund_inr)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Demographics */}
        <div className="rounded-2xl border bg-card p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-sm text-foreground">Household Profile</h3>
            </div>
            <button
              type="button"
              onClick={() => setAdjustingSection(adjustingSection === "demographics" ? null : "demographics")}
              className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
            >
              <Pencil className="w-3 h-3" /> Adjust for this plan
            </button>
          </div>

          {adjustingSection === "demographics" ? (
            <div className="space-y-3 pt-1">
              <p className="text-[11px] text-muted-foreground italic">
                Temporary values for this calculation only.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Age</Label>
                  <Input
                    type="number"
                    className="h-8 text-xs"
                    value={profile.age || ""}
                    onChange={(e) => updateProfile({ age: parseInt(e.target.value, 10) || 0 })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Dependents</Label>
                  <Input
                    type="number"
                    className="h-8 text-xs"
                    value={profile.dependents || 0}
                    onChange={(e) => updateProfile({ dependents: parseInt(e.target.value, 10) || 0 })}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Age:</span>
                <span className="font-semibold text-foreground">{profile.age || "Not specified"} years</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Financial Dependents:</span>
                <span className="font-semibold text-foreground">{profile.dependents} person(s)</span>
              </div>
            </div>
          )}
        </div>

        {/* Liabilities */}
        <div className="rounded-2xl border bg-card p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-sm text-foreground">Active Loans ({profile.liabilities.length})</h3>
            </div>
            <button
              type="button"
              onClick={() => setAdjustingSection(adjustingSection === "loans" ? null : "loans")}
              className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
            >
              <Pencil className="w-3 h-3" /> Adjust for this plan
            </button>
          </div>

          {profile.liabilities.length === 0 ? (
            <p className="text-xs text-muted-foreground">No loans active in your Financial Twin.</p>
          ) : (
            <div className="space-y-2">
              {profile.liabilities.map((lia, idx) => {
                const outAmt = lia.outstanding_inr ?? lia.outstanding_amount ?? 0;
                const rate = lia.interest_rate_pct ?? lia.interest_rate ?? 0;
                const emi = lia.emi_inr ?? lia.emi_amount ?? 0;

                return (
                  <div key={idx} className="flex items-center justify-between text-xs py-1 border-b last:border-b-0">
                    <span className="font-medium capitalize">{lia.type.replace("_", " ")}</span>
                    <span className="text-muted-foreground">
                      {formatINR(outAmt)} @ {rate}% (EMI {formatINR(emi)})
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Goals */}
        <div className="rounded-2xl border bg-card p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-sm text-foreground">Financial Goals ({profile.goals.length})</h3>
            </div>
            <button
              type="button"
              onClick={() => setAdjustingSection(adjustingSection === "goals" ? null : "goals")}
              className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
            >
              <Pencil className="w-3 h-3" /> Adjust for this plan
            </button>
          </div>

          {profile.goals.length === 0 ? (
            <p className="text-xs text-muted-foreground">No future goals recorded in your Financial Twin.</p>
          ) : (
            <div className="space-y-2">
              {profile.goals.map((g, idx) => {
                const target = g.target_inr ?? g.target_amount ?? 0;
                return (
                  <div key={idx} className="flex items-center justify-between text-xs py-1 border-b last:border-b-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium">{g.name}</span>
                      {g.for_daughter && (
                        <Badge variant="outline" className="text-[10px] text-pink-600 border-pink-500/30">
                          Daughter
                        </Badge>
                      )}
                    </div>
                    <span className="text-muted-foreground">
                      {formatINR(target)} in {g.years} yrs
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Missing Fields Card */}
      <div className="rounded-3xl border-2 border-primary/30 bg-primary/5 p-6 sm:p-7 shadow-sm space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <h3 className="text-base font-bold text-foreground">
                A few things your Twin doesn&apos;t have
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              These details complete your suitability assessment, risk buffer, and tax deduction calculation.
            </p>
          </div>

          {hasUsedSavedAnswers && (
            <Badge variant="secondary" className="gap-1 bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs shrink-0">
              <CheckCircle2 className="w-3 h-3" /> Using your answers from last time
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Term Life Cover */}
          <div className="space-y-2">
            <Label htmlFor="term_cover_review" className="text-xs font-semibold">
              Existing Term Life Insurance Cover (₹)
            </Label>
            <Input
              id="term_cover_review"
              type="number"
              min="0"
              className="h-10 bg-background"
              value={profile.insurance?.term_cover_inr || ""}
              onChange={(e) =>
                updateProfile({
                  insurance: {
                    ...profile.insurance,
                    term_cover_inr: parseFloat(e.target.value) || 0,
                  },
                })
              }
              placeholder="e.g. 10000000 (0 if none)"
            />
            <p className="text-[11px] text-muted-foreground">
              Essential if you have dependents (recommended target: 10× income).
            </p>
          </div>

          {/* Health Cover */}
          <div className="space-y-2">
            <Label htmlFor="health_cover_review" className="text-xs font-semibold">
              Existing Health Insurance Cover (₹)
            </Label>
            <Input
              id="health_cover_review"
              type="number"
              min="0"
              className="h-10 bg-background"
              value={profile.insurance?.health_cover_inr || ""}
              onChange={(e) =>
                updateProfile({
                  insurance: {
                    ...profile.insurance,
                    health_cover_inr: parseFloat(e.target.value) || 0,
                  },
                })
              }
              placeholder="e.g. 1000000 (0 if none)"
            />
            <p className="text-[11px] text-muted-foreground">
              Medical cushion protecting your long-term savings.
            </p>
          </div>

          {/* Daughters under 10 */}
          <div className="space-y-2">
            <Label htmlFor="daughters_review" className="text-xs font-semibold">
              Daughters under 10 years old
            </Label>
            <Input
              id="daughters_review"
              type="number"
              min="0"
              className="h-10 bg-background"
              value={profile.daughters_under_10 !== undefined ? profile.daughters_under_10 : 0}
              onChange={(e) =>
                updateProfile({
                  daughters_under_10: parseInt(e.target.value, 10) || 0,
                })
              }
              placeholder="0"
            />
            <p className="text-[11px] text-muted-foreground">
              Enables recommendation of 8.2% Sukanya Samriddhi Yojana (SSY).
            </p>
          </div>

          {/* Tax Regime */}
          <div className="space-y-2">
            <Label htmlFor="tax_regime_review" className="text-xs font-semibold">
              Tax Regime
            </Label>
            <Select
              value={profile.tax_regime || "new"}
              onValueChange={(val: "new" | "old" | null) => {
                if (val) updateProfile({ tax_regime: val });
              }}
            >
              <SelectTrigger id="tax_regime_review" className="h-10 bg-background">
                <SelectValue placeholder="Select Regime" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">New Tax Regime (Default)</SelectItem>
                <SelectItem value="old">Old Tax Regime (Section 123 / 80C)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">
              {profile.tax_regime === "old"
                ? "Eligible for Section 123 (formerly 80C) deduction up to ₹1.5L."
                : "Standard new regime with concessional tax slabs."}
            </p>
          </div>
        </div>

        {/* Daughter Goal Checkboxes if user has daughters under 10 */}
        {profile.daughters_under_10 > 0 && profile.goals.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-primary/20">
            <p className="text-xs font-semibold text-foreground">
              Mark any goals dedicated for your daughter:
            </p>
            <div className="space-y-2">
              {profile.goals.map((goal, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`daughter_check_${idx}`}
                    checked={!!goal.for_daughter}
                    onChange={(e) => {
                      const next = [...profile.goals];
                      next[idx] = { ...goal, for_daughter: e.target.checked };
                      updateProfile({ goals: next });
                    }}
                    className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                  />
                  <label htmlFor={`daughter_check_${idx}`} className="text-xs text-foreground cursor-pointer">
                    {goal.name} (SSY eligible)
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => setStep(0)}
        >
          Change Start Option
        </Button>

        <Button
          type="button"
          size="lg"
          onClick={handleContinue}
          className="gap-2 px-8 font-semibold shadow-md"
        >
          Continue to Risk Assessment <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
