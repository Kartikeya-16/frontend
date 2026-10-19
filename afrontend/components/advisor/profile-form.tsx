"use client";

import { useState } from "react";
import Link from "next/link";
import { useAdvisorStore } from "@/store/advisor-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Trash2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building,
  Target,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

const LIABILITY_TYPES = [
  { value: "home_loan", label: "Home Loan" },
  { value: "car_loan", label: "Car Loan" },
  { value: "education_loan", label: "Education Loan" },
  { value: "personal_loan", label: "Personal Loan" },
  { value: "credit_card", label: "Credit Card Debt" },
  { value: "other", label: "Other Loan" },
];

export function ProfileForm() {
  const {
    profile,
    twinFields,
    hasTwin,
    updateProfile,
    addLiability,
    updateLiability,
    removeLiability,
    addGoal,
    updateGoal,
    removeGoal,
    setStep,
  } = useAdvisorStore();

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validateAndProceed = () => {
    const errs: Record<string, string> = {};

    // Validate Age
    if (profile.age === undefined || profile.age === null || profile.age < 16 || profile.age > 100) {
      errs.age = "Age must be between 16 and 100 years.";
    }

    // Money non-negative
    if (profile.monthly_income_inr < 0) errs.income = "Income cannot be negative.";
    if (profile.monthly_expenses_inr < 0) errs.expenses = "Expenses cannot be negative.";
    if (profile.emergency_fund_inr < 0) errs.emergency = "Emergency fund cannot be negative.";
    if (profile.dependents < 0) errs.dependents = "Dependents cannot be negative.";
    if (profile.daughters_under_10 < 0) errs.daughters = "Daughters count cannot be negative.";
    if (profile.daughters_under_10 > profile.dependents) {
      errs.daughters = "Daughters under 10 cannot exceed total dependents.";
    }

    // Liabilities validation
    profile.liabilities.forEach((lia, idx) => {
      const out = lia.outstanding_inr ?? lia.outstanding_amount ?? 0;
      const rate = lia.interest_rate_pct ?? lia.interest_rate ?? 0;
      const emi = lia.emi_inr ?? lia.emi_amount ?? 0;

      if (out < 0) errs[`lia_out_${idx}`] = "Outstanding amount cannot be negative.";
      if (rate < 0 || rate > 60) errs[`lia_rate_${idx}`] = "Interest rate must be between 0% and 60%.";
      if (emi < 0) errs[`lia_emi_${idx}`] = "EMI cannot be negative.";
    });

    // Goals validation
    if (profile.goals.length > 10) {
      errs.goals_count = "A maximum of 10 financial goals is allowed.";
    }

    profile.goals.forEach((g, idx) => {
      const target = g.target_inr ?? g.target_amount ?? 0;
      const savings = g.current_savings_inr ?? g.current_savings ?? 0;

      if (!g.name || !g.name.trim()) errs[`goal_name_${idx}`] = "Goal name is required.";
      if (target <= 0) errs[`goal_target_${idx}`] = "Target amount must be greater than zero.";
      if (savings < 0) errs[`goal_savings_${idx}`] = "Current savings cannot be negative.";
      if (g.years <= 0 || g.years > 50) {
        errs[`goal_years_${idx}`] = "Goal horizon must be between 1 and 50 years.";
      }
    });

    setValidationErrors(errs);

    if (Object.keys(errs).length > 0) {
      const firstKey = Object.keys(errs)[0];
      toast.error(errs[firstKey]);
      return;
    }

    setStep(2);
  };

  const handleAddDefaultLiability = () => {
    addLiability({
      type: "home_loan",
      outstanding_inr: 0,
      outstanding_amount: 0,
      interest_rate_pct: 8.5,
      interest_rate: 8.5,
      emi_inr: 0,
      emi_amount: 0,
    });
  };

  const handleAddDefaultGoal = () => {
    if (profile.goals.length >= 10) {
      toast.error("You can add at most 10 goals.");
      return;
    }
    const newId = `goal_${Date.now()}`;
    addGoal({
      goal_id: newId,
      name: "",
      target_inr: 500000,
      target_amount: 500000,
      years: 5,
      current_savings_inr: 0,
      current_savings: 0,
      for_daughter: false,
    });
  };

  // If user has no twin (404)
  if (hasTwin === false) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-amber-500/20 text-amber-500 rounded-xl">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">
                Create your Financial Twin first
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Arthsaathi uses your Financial Twin to automatically pre-fill your salary,
                expenses, savings, loans, and goals for seamless planning.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button asChild className="bg-primary hover:bg-primary/90">
                  <Link href="/twin">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Set Up Financial Twin
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => useAdvisorStore.setState({ hasTwin: true })}
                >
                  Fill in manually
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header Info */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              1. Your Financial Situation
            </h2>
            <Badge variant="outline" className="text-xs">Manual Scenario</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Enter hypothetical cash flow, loans, insurance, and long-term milestones.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setStep(0)}>
          Change Start Option
        </Button>
      </div>

      {/* Cash Flow Card */}
      <div className="rounded-2xl border bg-card p-6 shadow-sm space-y-6">
        <div className="flex items-center gap-2 border-b pb-4">
          <Building className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Monthly Cash Flow & Reserves</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Monthly Income */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="monthly_income" className="text-sm font-medium">
                Monthly Income (₹)
              </Label>
              {twinFields.has("monthly_income_inr") && (
                <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary">
                  from your Twin
                </Badge>
              )}
            </div>
            <Input
              id="monthly_income"
              type="number"
              min="0"
              value={profile.monthly_income_inr || ""}
              onChange={(e) => updateProfile({ monthly_income_inr: parseFloat(e.target.value) || 0 })}
              placeholder="e.g. 150000"
            />
            {validationErrors.income && (
              <p className="text-xs text-rose-500">{validationErrors.income}</p>
            )}
          </div>

          {/* Other Monthly Inflow */}
          <div className="space-y-2">
            <Label htmlFor="other_inflow" className="text-sm font-medium">
              Other Monthly Inflows (₹)
            </Label>
            <Input
              id="other_inflow"
              type="number"
              min="0"
              value={profile.other_monthly_inflow_inr || ""}
              onChange={(e) => updateProfile({ other_monthly_inflow_inr: parseFloat(e.target.value) || 0 })}
              placeholder="Rental, dividends, etc. (0 if none)"
            />
          </div>

          {/* Monthly Expenses */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="monthly_expenses" className="text-sm font-medium">
                Monthly Living Expenses (₹)
              </Label>
              {twinFields.has("monthly_expenses_inr") && (
                <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary">
                  from your Twin
                </Badge>
              )}
            </div>
            <Input
              id="monthly_expenses"
              type="number"
              min="0"
              value={profile.monthly_expenses_inr || ""}
              onChange={(e) => updateProfile({ monthly_expenses_inr: parseFloat(e.target.value) || 0 })}
              placeholder="Groceries, utilities, rent (excl. loan EMIs)"
            />
            <p className="text-[11px] text-muted-foreground">
              Exclude loan EMIs — loans are tracked separately below.
            </p>
            {validationErrors.expenses && (
              <p className="text-xs text-rose-500">{validationErrors.expenses}</p>
            )}
          </div>

          {/* Emergency Fund */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="emergency_fund" className="text-sm font-medium">
                Emergency Fund & Liquid Cash (₹)
              </Label>
              {twinFields.has("emergency_fund_inr") && (
                <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary">
                  from your Twin
                </Badge>
              )}
            </div>
            <Input
              id="emergency_fund"
              type="number"
              min="0"
              value={profile.emergency_fund_inr || ""}
              onChange={(e) => updateProfile({ emergency_fund_inr: parseFloat(e.target.value) || 0 })}
              placeholder="Cash, savings accounts & sweep FDs"
            />
            {validationErrors.emergency && (
              <p className="text-xs text-rose-500">{validationErrors.emergency}</p>
            )}
          </div>
        </div>
      </div>

      {/* Demographics, Insurance & Tax Card */}
      <div className="rounded-2xl border bg-card p-6 shadow-sm space-y-6">
        <div className="flex items-center gap-2 border-b pb-4">
          <ShieldCheck className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Demographics, Protection & Tax</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* Age */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="age" className="text-sm font-medium">
                Age
              </Label>
              {twinFields.has("age") && (
                <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary">
                  from your Twin
                </Badge>
              )}
            </div>
            <Input
              id="age"
              type="number"
              min="16"
              max="100"
              value={profile.age || ""}
              onChange={(e) => updateProfile({ age: parseInt(e.target.value, 10) || 0 })}
              placeholder="e.g. 32"
            />
            {validationErrors.age && (
              <p className="text-xs text-rose-500">{validationErrors.age}</p>
            )}
          </div>

          {/* Dependents */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="dependents" className="text-sm font-medium">
                Total Dependents
              </Label>
              {twinFields.has("dependents") && (
                <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary">
                  from your Twin
                </Badge>
              )}
            </div>
            <Input
              id="dependents"
              type="number"
              min="0"
              value={profile.dependents !== undefined ? profile.dependents : 0}
              onChange={(e) => updateProfile({ dependents: parseInt(e.target.value, 10) || 0 })}
              placeholder="0"
            />
          </div>

          {/* Daughters under 10 */}
          <div className="space-y-2">
            <Label htmlFor="daughters" className="text-sm font-medium">
              Daughters under 10
            </Label>
            <Input
              id="daughters"
              type="number"
              min="0"
              value={profile.daughters_under_10 !== undefined ? profile.daughters_under_10 : 0}
              onChange={(e) => updateProfile({ daughters_under_10: parseInt(e.target.value, 10) || 0 })}
              placeholder="0"
            />
            <p className="text-[11px] text-muted-foreground">
              Qualifies for 8.2% Sukanya Samriddhi Yojana (SSY).
            </p>
            {validationErrors.daughters && (
              <p className="text-xs text-rose-500">{validationErrors.daughters}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-2">
          {/* Term Life Cover */}
          <div className="space-y-2">
            <Label htmlFor="term_cover" className="text-sm font-medium">
              Term Life Cover (₹)
            </Label>
            <Input
              id="term_cover"
              type="number"
              min="0"
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
              Target is 10× annual income if you have dependents.
            </p>
          </div>

          {/* Health Cover */}
          <div className="space-y-2">
            <Label htmlFor="health_cover" className="text-sm font-medium">
              Health Cover (₹)
            </Label>
            <Input
              id="health_cover"
              type="number"
              min="0"
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
              Target is ₹5-10L cushion for medical emergencies.
            </p>
          </div>

          {/* Tax Regime */}
          <div className="space-y-2">
            <Label htmlFor="tax_regime" className="text-sm font-medium">
              Tax Regime
            </Label>
            <Select
              value={profile.tax_regime || "new"}
              onValueChange={(val: "new" | "old" | null) => { if (val) updateProfile({ tax_regime: val }); }}
            >
              <SelectTrigger id="tax_regime">
                <SelectValue placeholder="Select Regime" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">New Tax Regime (Default)</SelectItem>
                <SelectItem value="old">Old Tax Regime (Section 123 / 80C)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">
              {profile.tax_regime === "old"
                ? "Eligible for Section 123 (formerly 80C) deductions up to ₹1.5L."
                : "Lower slab rates, no Section 123 deduction deductions."}
            </p>
          </div>
        </div>
      </div>

      {/* Liabilities Card */}
      <div className="rounded-2xl border bg-card p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Loans & Liabilities</h3>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddDefaultLiability}
            className="h-8 gap-1"
          >
            <Plus className="w-4 h-4" /> Add Loan
          </Button>
        </div>

        {profile.liabilities.length === 0 ? (
          <div className="text-center py-6 border border-dashed rounded-xl bg-muted/20">
            <p className="text-sm text-muted-foreground">No active debts or loans recorded.</p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleAddDefaultLiability}
              className="mt-2 text-primary"
            >
              + Add a liability
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {profile.liabilities.map((lia, idx) => {
              const outAmt = lia.outstanding_inr ?? lia.outstanding_amount ?? 0;
              const rateVal = lia.interest_rate_pct ?? lia.interest_rate ?? 0;
              const emiVal = lia.emi_inr ?? lia.emi_amount ?? 0;

              return (
                <div
                  key={idx}
                  className="p-4 rounded-xl border bg-background/50 grid grid-cols-1 sm:grid-cols-4 gap-4 items-end relative"
                >
                  <div className="space-y-1 sm:col-span-1">
                    <Label className="text-xs">Loan Type</Label>
                    <Select
                      value={lia.type || "other"}
                      onValueChange={(val) => {
                        if (val)
                          updateLiability(idx, {
                            ...lia,
                            type: val,
                          });
                      }}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LIABILITY_TYPES.map((lt) => (
                          <SelectItem key={lt.value} value={lt.value}>
                            {lt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Outstanding (₹)</Label>
                    <Input
                      type="number"
                      min="0"
                      className="h-9"
                      value={outAmt || ""}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        updateLiability(idx, {
                          ...lia,
                          outstanding_inr: val,
                          outstanding_amount: val,
                        });
                      }}
                      placeholder="e.g. 4000000"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Interest Rate (%)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="60"
                      className="h-9"
                      value={rateVal || ""}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        updateLiability(idx, {
                          ...lia,
                          interest_rate_pct: val,
                          interest_rate: val,
                        });
                      }}
                      placeholder="e.g. 8.5"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="space-y-1 flex-1">
                      <Label className="text-xs">Monthly EMI (₹)</Label>
                      <Input
                        type="number"
                        min="0"
                        className="h-9"
                        value={emiVal || ""}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          updateLiability(idx, {
                            ...lia,
                            emi_inr: val,
                            emi_amount: val,
                          });
                        }}
                        placeholder="e.g. 35000"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeLiability(idx)}
                      className="text-destructive hover:bg-destructive/10 h-9 w-9 shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Goals Card */}
      <div className="rounded-2xl border bg-card p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Financial Goals</h3>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddDefaultGoal}
            className="h-8 gap-1"
          >
            <Plus className="w-4 h-4" /> Add Goal
          </Button>
        </div>

        {profile.goals.length === 0 ? (
          <div className="text-center py-6 border border-dashed rounded-xl bg-muted/20">
            <p className="text-sm text-muted-foreground">No financial goals set yet.</p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleAddDefaultGoal}
              className="mt-2 text-primary"
            >
              + Add a financial goal
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {profile.goals.map((goal, idx) => {
              const targetVal = goal.target_inr ?? goal.target_amount ?? 0;
              const savingsVal = goal.current_savings_inr ?? goal.current_savings ?? 0;

              return (
                <div
                  key={goal.goal_id || idx}
                  className="p-4 rounded-xl border bg-background/50 space-y-3 relative"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
                    <div className="space-y-1 sm:col-span-1">
                      <Label className="text-xs">Goal Name</Label>
                      <Input
                        className="h-9"
                        value={goal.name}
                        onChange={(e) => updateGoal(idx, { ...goal, name: e.target.value })}
                        placeholder="e.g. Child Higher Education"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Target in Today&apos;s ₹</Label>
                      <Input
                        type="number"
                        min="1"
                        className="h-9"
                        value={targetVal || ""}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          updateGoal(idx, {
                            ...goal,
                            target_inr: val,
                            target_amount: val,
                          });
                        }}
                        placeholder="e.g. 2500000"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Years Horizon</Label>
                      <Input
                        type="number"
                        min="1"
                        max="50"
                        className="h-9"
                        value={goal.years || ""}
                        onChange={(e) =>
                          updateGoal(idx, {
                            ...goal,
                            years: parseFloat(e.target.value) || 0,
                          })
                        }
                        placeholder="e.g. 15"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="space-y-1 flex-1">
                        <Label className="text-xs">Current Savings (₹)</Label>
                        <Input
                          type="number"
                          min="0"
                          className="h-9"
                          value={savingsVal || ""}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            updateGoal(idx, {
                              ...goal,
                              current_savings_inr: val,
                              current_savings: val,
                            });
                          }}
                          placeholder="e.g. 100000"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeGoal(idx)}
                        className="text-destructive hover:bg-destructive/10 h-9 w-9 shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Daughter Checkbox if user has daughters under 10 */}
                  {profile.daughters_under_10 > 0 && (
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id={`daughter_goal_${idx}`}
                        checked={!!goal.for_daughter}
                        onChange={(e) =>
                          updateGoal(idx, {
                            ...goal,
                            for_daughter: e.target.checked,
                          })
                        }
                        className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                      />
                      <label
                        htmlFor={`daughter_goal_${idx}`}
                        className="text-xs font-medium text-foreground cursor-pointer"
                      >
                        This goal is for my daughter (unlocks Sukanya Samriddhi Yojana recommendation)
                      </label>
                    </div>
                  )}
                </div>
              );
            })}
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
          Back
        </Button>

        <Button
          type="button"
          size="lg"
          onClick={validateAndProceed}
          className="gap-2 px-8 font-semibold shadow-md"
        >
          Continue to Risk Assessment <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
