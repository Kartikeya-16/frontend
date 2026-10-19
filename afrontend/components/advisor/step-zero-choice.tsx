"use client";

import Link from "next/link";
import { useAdvisorStore } from "@/store/advisor-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  PenTool,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function StepZeroChoice() {
  const {
    hasTwin,
    isLoadingDraft,
    setMode,
    setStep,
    initDraft,
  } = useAdvisorStore();

  const handleChooseTwin = async () => {
    setMode("twin");
    await initDraft();
    const currentHasTwin = useAdvisorStore.getState().hasTwin;
    if (currentHasTwin !== false) {
      setStep(1);
    }
  };

  const handleChooseManual = () => {
    setMode("manual");
    useAdvisorStore.setState({
      profile: {
        age: 30,
        monthly_income_inr: 0,
        other_monthly_inflow_inr: 0,
        monthly_expenses_inr: 0,
        emergency_fund_inr: 0,
        liabilities: [],
        insurance: { term_cover_inr: 0, health_cover_inr: 0 },
        dependents: 0,
        daughters_under_10: 0,
        tax_regime: "new",
        goals: [],
        risk_answers: [],
      },
      twinFields: new Set(),
      twinGaps: [],
      sourceMap: {},
      skippedGoals: [],
    });
    setStep(1);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto py-4">
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          How do you want to start?
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
          Choose whether to generate your financial roadmap directly from your saved Financial Twin or test custom scenarios manually.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        {/* Option 1: Use Financial Twin */}
        <div
          className={cn(
            "rounded-3xl border-2 p-7 transition-all flex flex-col justify-between relative bg-card shadow-sm hover:shadow-md",
            hasTwin === false
              ? "border-muted bg-muted/20 opacity-90"
              : "border-primary/50 hover:border-primary ring-1 ring-primary/10"
          )}
        >
          {hasTwin !== false && (
            <Badge className="absolute -top-3 right-6 bg-primary text-primary-foreground font-semibold px-3 py-1 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 mr-1" /> Recommended
            </Badge>
          )}

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3.5 rounded-2xl bg-primary/10 text-primary">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">
                  Use my Financial Twin
                </h3>
                <p className="text-xs text-muted-foreground">
                  Instant import from your verified profile
                </p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">
              We&apos;ll use the income, expenses, savings, loans, and goals you already added to your Financial Twin. You only need to verify and answer a few risk questions.
            </p>

            {hasTwin === false && (
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-2 text-xs text-amber-800 dark:text-amber-300">
                <div className="flex items-center gap-2 font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
                  <span>You haven&apos;t created your Financial Twin yet.</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Create your Twin to unlock 1-click automated roadmap planning.
                </p>
                <div className="pt-1">
                  <Button asChild size="sm" className="h-8 gap-1 font-medium bg-amber-600 hover:bg-amber-700 text-white">
                    <Link href="/twin">
                      <Sparkles className="w-3.5 h-3.5 mr-1" /> Create Financial Twin
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="pt-6">
            <Button
              type="button"
              disabled={hasTwin === false || isLoadingDraft}
              onClick={handleChooseTwin}
              className="w-full h-11 font-semibold gap-2 shadow-sm"
            >
              {isLoadingDraft ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Fetching Twin Data...
                </>
              ) : (
                <>
                  Continue with Twin <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Option 2: Enter Details Manually */}
        <div className="rounded-3xl border-2 border-border/80 hover:border-foreground/30 p-7 transition-all flex flex-col justify-between bg-card shadow-sm hover:shadow-md">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3.5 rounded-2xl bg-muted text-foreground">
                <PenTool className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">
                  Enter details manually
                </h3>
                <p className="text-xs text-muted-foreground">
                  Hypothetical scenario planning
                </p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">
              Try a different financial scenario or evaluate goals without modifying your saved Financial Twin data. Starts with a blank form.
            </p>
          </div>

          <div className="pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleChooseManual}
              className="w-full h-11 font-semibold gap-2"
            >
              Enter Manually <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
