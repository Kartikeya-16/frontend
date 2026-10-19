"use client";

import { useEffect } from "react";
import { useAdvisorStore } from "@/store/advisor-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, ShieldCheck, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function RiskQuestionnaire() {
  const {
    questions,
    profile,
    setRiskAnswer,
    setStep,
    generatePlan,
    isLoadingQuestions,
    isLoadingPlan,
    fetchQuestions,
    error,
  } = useAdvisorStore();

  useEffect(() => {
    if (questions.length === 0) {
      fetchQuestions();
    }
  }, [questions.length, fetchQuestions]);

  const answers = profile.risk_answers || [];
  const allAnswered =
    questions.length > 0 &&
    questions.every((_, idx) => answers[idx] !== undefined && answers[idx] !== null);

  const handleGeneratePlan = async () => {
    if (!allAnswered) {
      toast.error("Please answer all suitability questions before submitting.");
      return;
    }
    await generatePlan();
  };

  if (isLoadingQuestions) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading risk profile questions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            2. Risk & Asset Allocation Assessment
          </h2>
          <p className="text-sm text-muted-foreground">
            Risk profile - 5 questions to determine appropriate equity & debt ratios.
          </p>
        </div>
        <Badge variant="outline" className="gap-1.5 border-primary/30 text-primary">
          <ShieldCheck className="w-3.5 h-3.5" /> Suitability Assessment
        </Badge>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Questions list */}
      <div className="space-y-6">
        {questions.map((q, qIdx) => {
          const currentAnswer = answers[qIdx];
          const optionKeys = Object.keys(q.options || {});

          return (
            <div
              key={q.id || qIdx}
              className="rounded-2xl border bg-card p-6 shadow-sm space-y-4 transition-all"
            >
              <div className="flex items-start gap-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 text-primary font-bold text-sm shrink-0">
                  {qIdx + 1}
                </span>
                <h3 className="font-medium text-foreground leading-snug pt-0.5">
                  {q.text}
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-10">
                {optionKeys.map((scoreKey) => {
                  const scoreVal = parseInt(scoreKey, 10);
                  const isSelected = currentAnswer === scoreVal;

                  return (
                    <button
                      key={scoreKey}
                      type="button"
                      onClick={() => setRiskAnswer(qIdx, scoreVal)}
                      className={cn(
                        "text-left p-3.5 rounded-xl border text-sm transition-all flex items-center justify-between",
                        isSelected
                          ? "border-primary bg-primary/10 text-foreground font-semibold ring-2 ring-primary/20 shadow-sm"
                          : "border-border/60 hover:border-border hover:bg-muted/40 text-muted-foreground"
                      )}
                    >
                      <span>{q.options[scoreKey]}</span>
                      <div
                        className={cn(
                          "w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ml-2",
                          isSelected
                            ? "border-primary bg-primary text-white"
                            : "border-muted-foreground/40"
                        )}
                      >
                        {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Navigation */}
      <div className="flex items-center justify-between pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={() => setStep(1)}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Profile
        </Button>

        <Button
          type="button"
          size="lg"
          disabled={!allAnswered || isLoadingPlan}
          onClick={handleGeneratePlan}
          className="gap-2 px-8 font-semibold shadow-md"
        >
          {isLoadingPlan ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating Custom Plan...
            </>
          ) : (
            <>
              Build My Financial Plan <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
