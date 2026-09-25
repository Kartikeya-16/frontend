"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { StepWizard } from "@/components/forms/step-wizard";
import { TwinPreviewMini } from "@/components/twin-visualization/twin-preview-mini";

import { fadeInUp, TRANSITION } from "@/lib/motion";
import {
  OccupationType,
  EducationLevel,
  MaritalStatus,
  RiskAppetite,
  FrequencyType,
  ExpenseCategory,
  AssetType,
  LiabilityType,
  GoalType,
  GoalPriority,
  GoalStatus,
} from "@/lib/types";
import type {
  FinancialTwinCreate,
  IncomeCreate,
  ExpenseCreate,
  AssetCreate,
  LiabilityCreate,
  FinancialGoalCreate,
} from "@/lib/types";
import { createFinancialTwin, updateFinancialTwin, addIncome, addExpense, addAsset, addLiability, addGoal } from "@/lib/api/twin";
import { useTwinStore } from "@/store/twin-store";
import type {
  FinancialTwinResponse,
  IncomeResponse,
  ExpenseResponse,
  AssetResponse,
  LiabilityResponse,
  FinancialGoalResponse,
  HealthCategory,
} from "@/lib/types";

const STEPS = [
  "Profile",
  "Occupation",
  "Income",
  "Expenses",
  "Assets",
  "Liabilities",
  "Goals",
];

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
  "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim",
  "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand",
  "West Bengal", "Delhi", "Chandigarh", "Puducherry", "Jammu & Kashmir",
  "Ladakh", "Andaman & Nicobar", "Dadra & Nagar Haveli", "Lakshadweep",
];

function enumToLabel(val: string) {
  return val.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()).toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
}

export default function OnboardingPage() {
  const router = useRouter();
  const setTwin = useTwinStore((s) => s.setTwin);
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 0: Personal Profile & Demographics
  const [fullName, setFullName] = useState("");
  const [gender, setGender] = useState<"female" | "male" | "transgender">("female");
  const [caste, setCaste] = useState<"General" | "OBC" | "SC" | "ST" | "PVTG" | "DNT">("General");
  const [residence, setResidence] = useState<"urban" | "rural">("urban");
  const [isStudent, setIsStudent] = useState(false);
  const [isDisability, setIsDisability] = useState(false);
  const [isMinority, setIsMinority] = useState(false);
  const [age, setAge] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [educationLevel, setEducationLevel] = useState<EducationLevel>(EducationLevel.GRADUATE);
  const [maritalStatus, setMaritalStatus] = useState<MaritalStatus>(MaritalStatus.SINGLE);
  const [dependentsCount, setDependentsCount] = useState("0");
  const [hasElderlyParents, setHasElderlyParents] = useState(false);
  const [riskAppetite, setRiskAppetite] = useState<RiskAppetite>(RiskAppetite.MEDIUM);

  // Step 1: Occupation
  const [occupation, setOccupation] = useState("");
  const [occupationType, setOccupationType] = useState<OccupationType>(OccupationType.SALARIED);
  const [monthlyIncome, setMonthlyIncome] = useState("");

  // Step 2: Income sources
  const [incomes, setIncomes] = useState<IncomeCreate[]>([
    { source: "Salary", amount: 0, frequency: FrequencyType.MONTHLY },
  ]);

  // Step 3: Expenses
  const [expenses, setExpenses] = useState<ExpenseCreate[]>([
    { category: ExpenseCategory.HOUSING, amount: 0, frequency: FrequencyType.MONTHLY },
  ]);

  // Step 4: Assets
  const [assets, setAssets] = useState<AssetCreate[]>([]);

  // Step 5: Liabilities
  const [liabilities, setLiabilities] = useState<LiabilityCreate[]>([]);

  // Step 6: Goals
  const [goals, setGoals] = useState<FinancialGoalCreate[]>([]);

  function canProceed() {
    switch (step) {
      case 0:
        return !!(fullName.trim() && age.trim() && !isNaN(Number(age)) && Number(age) >= 18 && city.trim() && state.trim());
      case 1:
        return !!(occupation.trim() && monthlyIncome.trim() && !isNaN(Number(monthlyIncome)) && Number(monthlyIncome) > 0);
      case 2:
        return incomes.length > 0 && incomes.every((i) => i.source.trim() && i.amount > 0);
      case 3:
        return expenses.length > 0 && expenses.every((e) => e.amount > 0);
      default:
        return true;
    }
  }

  function handleContinue() {
    if (step === 0) {
      if (!fullName.trim()) {
        toast.error("Please enter your full name to continue");
        return;
      }
      if (!age || isNaN(Number(age)) || Number(age) < 18) {
        toast.error("Please enter a valid age (18+) to continue");
        return;
      }
      if (!city.trim()) {
        toast.error("Please enter your city to continue");
        return;
      }
      if (!state) {
        toast.error("Please select your state to continue");
        return;
      }
    } else if (step === 1) {
      if (!occupation.trim()) {
        toast.error("Please enter your occupation to continue");
        return;
      }
      if (!monthlyIncome || isNaN(Number(monthlyIncome)) || Number(monthlyIncome) <= 0) {
        toast.error("Please enter a valid monthly income to continue");
        return;
      }
      // Auto-sync monthly income to primary income if it hasn't been configured yet
      if (incomes.length === 1 && incomes[0].amount === 0) {
        setIncomes([{ source: "Salary", amount: parseFloat(monthlyIncome) || 0, frequency: FrequencyType.MONTHLY }]);
      }
    } else if (step === 2) {
      if (incomes.length === 0 || !incomes.every((i) => i.source && i.amount > 0)) {
        toast.error("Please ensure each income source has a description and amount greater than 0");
        return;
      }
    } else if (step === 3) {
      if (expenses.length === 0 || !expenses.every((e) => e.amount > 0)) {
        toast.error("Please ensure each expense has an amount greater than 0");
        return;
      }
    }

    // Persist current progress demographics immediately to localStorage
    const numIncome = parseFloat(monthlyIncome) || 0;
    const currentDemo = {
      full_name: fullName.trim() || undefined,
      gender,
      caste,
      residence,
      is_student: isStudent || occupationType === OccupationType.STUDENT,
      disability: isDisability,
      minority: isMinority,
      state: state || "Maharashtra",
      city: city || "Mumbai",
      age: parseInt(age) || 28,
      annual_income: numIncome * 12,
      occupation: occupation || "Professional",
      occupation_type: occupationType,
      dependents_count: parseInt(dependentsCount) || 0,
      bpl: numIncome * 12 < 120000,
    };
    if (typeof window !== "undefined") {
      localStorage.setItem("arthsaathi_user_demographics", JSON.stringify(currentDemo));
    }

    setStep(step + 1);
  }

  async function handleFinish() {
    setIsSubmitting(true);
    const numIncome = parseFloat(monthlyIncome) || 0;
    const twinData: FinancialTwinCreate = {
      occupation: occupation || "Professional",
      occupation_type: occupationType,
      monthly_income: numIncome,
      state: state || "Maharashtra",
      city: city || "Mumbai",
      age: parseInt(age) || 28,
      education_level: educationLevel,
      marital_status: maritalStatus,
      dependents_count: parseInt(dependentsCount) || 0,
      has_elderly_parents: hasElderlyParents,
      risk_appetite: riskAppetite,
    };

    const validIncomes: IncomeResponse[] = incomes
      .filter((i) => i.amount > 0)
      .map((i, idx) => ({
        ...i,
        id: `inc-${Date.now()}-${idx}`,
        user_id: "user-current",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

    const validExpenses: ExpenseResponse[] = expenses
      .filter((e) => e.amount > 0)
      .map((e, idx) => ({
        ...e,
        id: `exp-${Date.now()}-${idx}`,
        user_id: "user-current",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

    const validAssets: AssetResponse[] = assets
      .filter((a) => a.current_value > 0)
      .map((a, idx) => ({
        ...a,
        id: `ast-${Date.now()}-${idx}`,
        user_id: "user-current",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

    const validLiabilities: LiabilityResponse[] = liabilities
      .filter((l) => l.outstanding_amount > 0)
      .map((l, idx) => ({
        ...l,
        id: `liab-${Date.now()}-${idx}`,
        user_id: "user-current",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

    const validGoals: FinancialGoalResponse[] = goals
      .filter((g) => Number(g.target_amount) > 0)
      .map((g, idx) => ({
        ...g,
        id: `goal-${Date.now()}-${idx}`,
        title: g.title?.trim() || enumToLabel(g.goal_type) || "Financial Goal",
        target_amount: Number(g.target_amount),
        current_savings: Number(g.current_savings) || 0,
        priority: g.priority || GoalPriority.MEDIUM,
        status: g.status || GoalStatus.ACTIVE,
        target_date: g.target_date && g.target_date.trim() !== "" ? g.target_date : undefined,
        user_id: "user-current",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

    if (typeof window !== "undefined" && validGoals.length > 0) {
      localStorage.setItem("arthsaathi_saved_goals", JSON.stringify(validGoals));
    }

    // Calculate initial health score
    const totalExp = validExpenses.reduce((s, e) => s + Number(e.amount), 0);
    const totalEmi = validLiabilities.reduce((s, l) => s + Number(l.emi_amount || 0), 0);
    const savingsRatio = numIncome > 0 ? (numIncome - totalExp - totalEmi) / numIncome : 0;
    const emiRatio = numIncome > 0 ? totalEmi / numIncome : 0;

    let initialScore = 70;
    if (savingsRatio >= 0.3) initialScore += 12;
    else if (savingsRatio >= 0.15) initialScore += 6;
    else initialScore -= 10;

    if (emiRatio <= 0.25) initialScore += 10;
    else if (emiRatio > 0.4) initialScore -= 15;

    const clampedScore = Math.min(95, Math.max(30, initialScore));
    let cat: HealthCategory = "GOOD";
    if (clampedScore < 50) cat = "POOR";
    else if (clampedScore < 70) cat = "FAIR";
    else if (clampedScore < 85) cat = "GOOD";
    else cat = "EXCELLENT";

    const customTwinResponse: FinancialTwinResponse = {
      ...twinData,
      id: `twin-${Date.now()}`,
      user_id: "user-current",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Persist full user demographic profile for Government Scheme Matcher and personalization
    const userDemographics = {
      full_name: fullName.trim() || undefined,
      gender,
      caste,
      residence,
      is_student: isStudent || occupationType === OccupationType.STUDENT,
      disability: isDisability,
      minority: isMinority,
      state: state || "Maharashtra",
      city: city || "Mumbai",
      age: parseInt(age) || 28,
      annual_income: numIncome * 12,
      dependents_count: parseInt(dependentsCount) || 0,
      bpl: numIncome * 12 < 120000,
    };
    if (typeof window !== "undefined") {
      localStorage.setItem("arthsaathi_user_demographics", JSON.stringify(userDemographics));
    }

    try {
      // Save profile to backend (or update if user is re-onboarding)
      try {
        await createFinancialTwin(twinData);
      } catch (twinErr: any) {
        if (twinErr?.response?.status === 409) {
          await updateFinancialTwin(twinData);
        } else {
          throw twinErr;
        }
      }

      // Save all child financial items with Promise.allSettled so individual items don't abort the entire submission
      await Promise.allSettled([
        ...incomes.filter((i) => i.amount > 0).map((i) => addIncome(i)),
        ...expenses.filter((e) => e.amount > 0).map((e) => addExpense(e)),
        ...assets.filter((a) => a.current_value > 0).map((a) => addAsset(a)),
        ...liabilities.filter((l) => l.outstanding_amount > 0).map((l) => addLiability(l)),
        ...validGoals.map((g) =>
          addGoal({
            title: g.title,
            goal_type: g.goal_type,
            target_amount: g.target_amount,
            current_savings: g.current_savings,
            priority: g.priority,
            status: g.status,
            target_date: g.target_date,
          })
        ),
      ]);
      // Refetch live financial twin and trigger live ML health score calculation
      await useTwinStore.getState().fetchAllTwinData();
    } catch {
      // Backend offline or local fallback; save in store so user seamlessly progresses!
      setTwin({
        profile: customTwinResponse,
        incomeSources: validIncomes.length > 0 ? validIncomes : [
          {
            id: "inc-def-1",
            user_id: "user-current",
            source: twinData.occupation || "Primary Income",
            amount: twinData.monthly_income,
            frequency: FrequencyType.MONTHLY,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
        expenses: validExpenses,
        assets: validAssets,
        liabilities: validLiabilities,
        goals: validGoals,
        healthScore: {
          score: clampedScore,
          category: cat,
          insights: [
            `Savings capacity is ${(savingsRatio * 100).toFixed(0)}% of your monthly income.`,
            `EMIs account for ${(emiRatio * 100).toFixed(0)}% of income (healthy limit is <40%).`,
            "Continue allocating monthly surplus towards your top priority goals.",
          ],
          feature_importance: {
            savings_rate: 0.35,
            emergency_fund_ratio: 0.25,
            debt_to_income: 0.20,
            asset_diversification: 0.12,
            goal_progress: 0.08,
          },
        },
        hasOnboarded: true,
        isLoading: false,
      });
    }

    toast.success("Your Financial Twin is ready!");
    router.push("/dashboard");
    setIsSubmitting(false);
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-heading text-2xl font-bold text-ink">
            Build Your Financial Twin
          </h1>
          <p className="text-muted-foreground mt-1">
            Tell us about your financial life — every step fills in your Twin
          </p>
        </div>

        {/* Step indicator */}
        <div className="mb-8">
          <StepWizard steps={STEPS} currentStep={step} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form area */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={TRANSITION.component}
              >
                <Card className="p-6">
                  <h2 className="font-heading text-lg font-semibold mb-4">
                    {STEPS[step]}
                  </h2>

                  {/* Step 0: Personal Profile */}
                  {step === 0 && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Full Name <span className="text-destructive">*</span></Label>
                        <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Priya Sharma" />
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-2">
                          <Label>Gender</Label>
                          <Select value={gender} onValueChange={(v) => setGender(v as any)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="female">Female</SelectItem>
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="transgender">Transgender</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Social Category</Label>
                          <Select value={caste} onValueChange={(v) => setCaste(v as any)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="General">General</SelectItem>
                              <SelectItem value="OBC">OBC</SelectItem>
                              <SelectItem value="SC">SC</SelectItem>
                              <SelectItem value="ST">ST</SelectItem>
                              <SelectItem value="PVTG">PVTG</SelectItem>
                              <SelectItem value="DNT">DNT</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Area Type</Label>
                          <Select value={residence} onValueChange={(v) => setResidence(v as any)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="urban">Urban</SelectItem>
                              <SelectItem value="rural">Rural</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Age <span className="text-destructive">*</span></Label>
                          <Input
                            type="number"
                            value={age}
                            onChange={(e) => setAge(e.target.value)}
                            placeholder="e.g. 25"
                            min="18"
                            max="120"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>City <span className="text-destructive">*</span></Label>
                          <Input
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            placeholder="e.g. Mumbai"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>State <span className="text-destructive">*</span></Label>
                        <Select value={state} onValueChange={(val) => setState(val || "")}>
                          <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                          <SelectContent>
                            {INDIAN_STATES.map((s) => (
                              <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Education</Label>
                          <Select value={educationLevel} onValueChange={(v) => setEducationLevel(v as EducationLevel)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {Object.values(EducationLevel).map((v) => (
                                <SelectItem key={v} value={v}>{enumToLabel(v)}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Marital status</Label>
                          <Select value={maritalStatus} onValueChange={(v) => setMaritalStatus(v as MaritalStatus)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {Object.values(MaritalStatus).map((v) => (
                                <SelectItem key={v} value={v}>{enumToLabel(v)}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Dependents</Label>
                          <Input type="number" value={dependentsCount} onChange={(e) => setDependentsCount(e.target.value)} min="0" />
                        </div>
                        <div className="space-y-2">
                          <Label>Risk appetite</Label>
                          <Select value={riskAppetite} onValueChange={(v) => setRiskAppetite(v as RiskAppetite)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {Object.values(RiskAppetite).map((v) => (
                                <SelectItem key={v} value={v}>{enumToLabel(v)}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-1">
                        <div className="flex items-center gap-2">
                          <Switch checked={hasElderlyParents} onCheckedChange={setHasElderlyParents} id="elderly" />
                          <Label htmlFor="elderly" className="text-xs">Elderly parents to support</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch checked={isStudent} onCheckedChange={setIsStudent} id="student" />
                          <Label htmlFor="student" className="text-xs">Currently a student</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch checked={isDisability} onCheckedChange={setIsDisability} id="disability" />
                          <Label htmlFor="disability" className="text-xs">Person with disability (PwD)</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch checked={isMinority} onCheckedChange={setIsMinority} id="minority" />
                          <Label htmlFor="minority" className="text-xs">Minority community</Label>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 1: Occupation */}
                  {step === 1 && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Occupation title <span className="text-destructive">*</span></Label>
                        <Input value={occupation} onChange={(e) => setOccupation(e.target.value)} placeholder="e.g. Software Engineer" />
                      </div>
                      <div className="space-y-2">
                        <Label>Occupation type</Label>
                        <Select value={occupationType} onValueChange={(v) => setOccupationType(v as OccupationType)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {Object.values(OccupationType).map((v) => (
                              <SelectItem key={v} value={v}>{enumToLabel(v)}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Monthly income (₹) <span className="text-destructive">*</span></Label>
                        <Input type="number" value={monthlyIncome} onChange={(e) => setMonthlyIncome(e.target.value)} placeholder="e.g. 50000" min="0" />
                      </div>
                    </div>
                  )}

                  {/* Step 2: Income Sources */}
                  {step === 2 && (
                    <div className="space-y-4">
                      {incomes.map((income, idx) => (
                        <div key={idx} className="flex gap-3 items-end">
                          <div className="flex-1 space-y-1">
                            <Label>Source</Label>
                            <Input value={income.source} onChange={(e) => {
                              const next = [...incomes];
                              next[idx] = { ...next[idx], source: e.target.value };
                              setIncomes(next);
                            }} placeholder="Salary" />
                          </div>
                          <div className="w-32 space-y-1">
                            <Label>Amount (₹) <span className="text-destructive">*</span></Label>
                            <Input type="number" placeholder="e.g. 50000" value={income.amount || ""} onChange={(e) => {
                              const next = [...incomes];
                              next[idx] = { ...next[idx], amount: parseFloat(e.target.value) || 0 };
                              setIncomes(next);
                            }} />
                          </div>
                          <div className="w-32 space-y-1">
                            <Label>Frequency</Label>
                            <Select value={income.frequency} onValueChange={(v) => {
                              const next = [...incomes];
                              next[idx] = { ...next[idx], frequency: v as FrequencyType };
                              setIncomes(next);
                            }}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {Object.values(FrequencyType).map((v) => (
                                  <SelectItem key={v} value={v}>{enumToLabel(v)}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          {incomes.length > 1 && (
                            <Button variant="ghost" size="icon" onClick={() => setIncomes(incomes.filter((_, i) => i !== idx))}>
                              <Trash2 className="w-4 h-4 text-signal-red" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button variant="outline" size="sm" onClick={() => setIncomes([...incomes, { source: "", amount: 0, frequency: FrequencyType.MONTHLY }])}>
                        <Plus className="w-4 h-4 mr-1" /> Add another source
                      </Button>
                    </div>
                  )}

                  {/* Step 3: Expenses */}
                  {step === 3 && (
                    <div className="space-y-4">
                      {expenses.map((exp, idx) => (
                        <div key={idx} className="flex gap-3 items-end">
                          <div className="flex-1 space-y-1">
                            <Label>Category</Label>
                            <Select value={exp.category} onValueChange={(v) => {
                              const next = [...expenses];
                              next[idx] = { ...next[idx], category: v as ExpenseCategory };
                              setExpenses(next);
                            }}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {Object.values(ExpenseCategory).map((v) => (
                                  <SelectItem key={v} value={v}>{enumToLabel(v)}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="w-32 space-y-1">
                            <Label>Amount (₹) <span className="text-destructive">*</span></Label>
                            <Input type="number" placeholder="e.g. 15000" value={exp.amount || ""} onChange={(e) => {
                              const next = [...expenses];
                              next[idx] = { ...next[idx], amount: parseFloat(e.target.value) || 0 };
                              setExpenses(next);
                            }} />
                          </div>
                          <div className="w-32 space-y-1">
                            <Label>Frequency</Label>
                            <Select value={exp.frequency} onValueChange={(v) => {
                              const next = [...expenses];
                              next[idx] = { ...next[idx], frequency: v as FrequencyType };
                              setExpenses(next);
                            }}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {Object.values(FrequencyType).map((v) => (
                                  <SelectItem key={v} value={v}>{enumToLabel(v)}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          {expenses.length > 1 && (
                            <Button variant="ghost" size="icon" onClick={() => setExpenses(expenses.filter((_, i) => i !== idx))}>
                              <Trash2 className="w-4 h-4 text-signal-red" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button variant="outline" size="sm" onClick={() => setExpenses([...expenses, { category: ExpenseCategory.FOOD, amount: 0, frequency: FrequencyType.MONTHLY }])}>
                        <Plus className="w-4 h-4 mr-1" /> Add expense
                      </Button>
                    </div>
                  )}

                  {/* Step 4: Assets */}
                  {step === 4 && (
                    <div className="space-y-4">
                      {assets.length === 0 && (
                        <p className="text-sm text-muted-foreground py-4 text-center">
                          No assets added yet. You can skip this step or add your first asset.
                        </p>
                      )}
                      {assets.map((asset, idx) => (
                        <div key={idx} className="flex gap-3 items-end">
                          <div className="w-36 space-y-1">
                            <Label>Type</Label>
                            <Select value={asset.asset_type} onValueChange={(v) => {
                              const next = [...assets];
                              next[idx] = { ...next[idx], asset_type: v as AssetType };
                              setAssets(next);
                            }}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {Object.values(AssetType).map((v) => (
                                  <SelectItem key={v} value={v}>{enumToLabel(v)}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex-1 space-y-1">
                            <Label>Name</Label>
                            <Input value={asset.name} onChange={(e) => {
                              const next = [...assets];
                              next[idx] = { ...next[idx], name: e.target.value };
                              setAssets(next);
                            }} placeholder="SBI FD" />
                          </div>
                          <div className="w-32 space-y-1">
                            <Label>Value (₹)</Label>
                            <Input type="number" value={asset.current_value || ""} onChange={(e) => {
                              const next = [...assets];
                              next[idx] = { ...next[idx], current_value: parseFloat(e.target.value) || 0 };
                              setAssets(next);
                            }} />
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => setAssets(assets.filter((_, i) => i !== idx))}>
                            <Trash2 className="w-4 h-4 text-signal-red" />
                          </Button>
                        </div>
                      ))}
                      <Button variant="outline" size="sm" onClick={() => setAssets([...assets, { asset_type: AssetType.SAVINGS, name: "", current_value: 0 }])}>
                        <Plus className="w-4 h-4 mr-1" /> Add asset
                      </Button>
                    </div>
                  )}

                  {/* Step 5: Liabilities */}
                  {step === 5 && (
                    <div className="space-y-4">
                      {liabilities.length === 0 && (
                        <p className="text-sm text-muted-foreground py-4 text-center">
                          No liabilities? Great! You can skip this step.
                        </p>
                      )}
                      {liabilities.map((liability, idx) => (
                        <div key={idx} className="space-y-3 p-4 rounded-lg bg-muted/50">
                          <div className="flex gap-3 items-end">
                            <div className="w-36 space-y-1">
                              <Label>Type</Label>
                              <Select value={liability.liability_type} onValueChange={(v) => {
                                const next = [...liabilities];
                                next[idx] = { ...next[idx], liability_type: v as LiabilityType };
                                setLiabilities(next);
                              }}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {Object.values(LiabilityType).map((v) => (
                                    <SelectItem key={v} value={v}>{enumToLabel(v)}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex-1 space-y-1">
                              <Label>Name</Label>
                              <Input value={liability.name} onChange={(e) => {
                                const next = [...liabilities];
                                next[idx] = { ...next[idx], name: e.target.value };
                                setLiabilities(next);
                              }} placeholder="HDFC Home Loan" />
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setLiabilities(liabilities.filter((_, i) => i !== idx))}>
                              <Trash2 className="w-4 h-4 text-signal-red" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="space-y-1">
                              <Label>Principal (₹)</Label>
                              <Input type="number" value={liability.principal_amount || ""} onChange={(e) => {
                                const next = [...liabilities];
                                next[idx] = { ...next[idx], principal_amount: parseFloat(e.target.value) || 0 };
                                setLiabilities(next);
                              }} />
                            </div>
                            <div className="space-y-1">
                              <Label>Outstanding (₹)</Label>
                              <Input type="number" value={liability.outstanding_amount || ""} onChange={(e) => {
                                const next = [...liabilities];
                                next[idx] = { ...next[idx], outstanding_amount: parseFloat(e.target.value) || 0 };
                                setLiabilities(next);
                              }} />
                            </div>
                            <div className="space-y-1">
                              <Label>EMI (₹)</Label>
                              <Input type="number" value={liability.emi_amount || ""} onChange={(e) => {
                                const next = [...liabilities];
                                next[idx] = { ...next[idx], emi_amount: parseFloat(e.target.value) || 0 };
                                setLiabilities(next);
                              }} />
                            </div>
                            <div className="space-y-1">
                              <Label>Rate (%)</Label>
                              <Input type="number" value={liability.interest_rate || ""} onChange={(e) => {
                                const next = [...liabilities];
                                next[idx] = { ...next[idx], interest_rate: parseFloat(e.target.value) || 0 };
                                setLiabilities(next);
                              }} />
                            </div>
                          </div>
                        </div>
                      ))}
                      <Button variant="outline" size="sm" onClick={() => setLiabilities([...liabilities, { liability_type: LiabilityType.PERSONAL_LOAN, name: "", principal_amount: 0, outstanding_amount: 0 }])}>
                        <Plus className="w-4 h-4 mr-1" /> Add liability
                      </Button>
                    </div>
                  )}

                  {/* Step 6: Goals */}
                  {step === 6 && (
                    <div className="space-y-4">
                      {goals.length === 0 && (
                        <p className="text-sm text-muted-foreground py-4 text-center">
                          Add your financial goals — saving for a house, emergency fund, travel…
                        </p>
                      )}
                      {goals.map((goal, idx) => (
                        <div key={idx} className="space-y-3 p-4 rounded-lg bg-muted/50">
                          <div className="flex gap-3 items-end">
                            <div className="flex-1 space-y-1">
                              <Label>Goal title</Label>
                              <Input value={goal.title} onChange={(e) => {
                                const next = [...goals];
                                next[idx] = { ...next[idx], title: e.target.value };
                                setGoals(next);
                              }} placeholder="Buy a house" />
                            </div>
                            <div className="w-36 space-y-1">
                              <Label>Type</Label>
                              <Select value={goal.goal_type} onValueChange={(v) => {
                                const next = [...goals];
                                next[idx] = { ...next[idx], goal_type: v as GoalType };
                                setGoals(next);
                              }}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {Object.values(GoalType).map((v) => (
                                    <SelectItem key={v} value={v}>{enumToLabel(v)}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setGoals(goals.filter((_, i) => i !== idx))}>
                              <Trash2 className="w-4 h-4 text-signal-red" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="space-y-1">
                              <Label>Target (₹)</Label>
                              <Input type="number" value={goal.target_amount || ""} onChange={(e) => {
                                const next = [...goals];
                                next[idx] = { ...next[idx], target_amount: parseFloat(e.target.value) || 0 };
                                setGoals(next);
                              }} />
                            </div>
                            <div className="space-y-1">
                              <Label>Saved (₹)</Label>
                              <Input type="number" value={goal.current_savings || ""} onChange={(e) => {
                                const next = [...goals];
                                next[idx] = { ...next[idx], current_savings: parseFloat(e.target.value) || 0 };
                                setGoals(next);
                              }} />
                            </div>
                            <div className="space-y-1">
                              <Label>Priority</Label>
                              <Select value={goal.priority} onValueChange={(v) => {
                                const next = [...goals];
                                next[idx] = { ...next[idx], priority: v as GoalPriority };
                                setGoals(next);
                              }}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {Object.values(GoalPriority).map((v) => (
                                    <SelectItem key={v} value={v}>{enumToLabel(v)}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1">
                              <Label>Target date</Label>
                              <Input type="date" value={goal.target_date || ""} onChange={(e) => {
                                const next = [...goals];
                                next[idx] = { ...next[idx], target_date: e.target.value };
                                setGoals(next);
                              }} />
                            </div>
                          </div>
                        </div>
                      ))}
                      <Button variant="outline" size="sm" onClick={() => setGoals([...goals, { title: "", goal_type: GoalType.EMERGENCY_FUND, target_amount: 0, current_savings: 0, priority: GoalPriority.MEDIUM, status: GoalStatus.ACTIVE }])}>
                        <Plus className="w-4 h-4 mr-1" /> Add goal
                      </Button>
                    </div>
                  )}
                </Card>

                {/* Navigation buttons */}
                <div className="flex justify-between mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setStep(step - 1)}
                    disabled={step === 0}
                  >
                    Back
                  </Button>

                  {step < STEPS.length - 1 ? (
                    <div className="flex flex-col items-end gap-1">
                      <Button onClick={handleContinue} disabled={!canProceed()}>
                        Continue
                      </Button>
                      {!canProceed() && (
                        <p className="text-xs text-muted-foreground">
                          Fill required fields (<span className="text-destructive">*</span>) to continue
                        </p>
                      )}
                    </div>
                  ) : (
                    <Button onClick={handleFinish} disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating Twin…
                        </>
                      ) : (
                        "Create My Twin"
                      )}
                    </Button>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Mini Twin preview sidebar */}
          <div className="hidden lg:block">
            <div className="sticky top-8">
              <Card className="p-6">
                <h3 className="font-heading text-sm font-semibold text-center mb-4">
                  Your Twin
                </h3>
                <TwinPreviewMini
                  currentStep={step}
                  totalSteps={STEPS.length}
                />
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
