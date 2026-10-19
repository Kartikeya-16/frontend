"use client";

import { Check, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AdvisorStep } from "@/store/advisor-store";

interface StepIndicatorProps {
  currentStep: AdvisorStep;
  onStepClick?: (step: AdvisorStep) => void;
}

const STEPS = [
  { step: 0 as AdvisorStep, title: "Start option", subtitle: "Twin or manual" },
  { step: 1 as AdvisorStep, title: "Your situation", subtitle: "Review or enter details" },
  { step: 2 as AdvisorStep, title: "Risk profile", subtitle: "5 questions" },
  { step: 3 as AdvisorStep, title: "Your plan", subtitle: "Asset allocation & actions" },
];

export function StepIndicator({ currentStep, onStepClick }: StepIndicatorProps) {
  return (
    <div className="w-full bg-card border rounded-2xl p-4 shadow-sm mb-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {STEPS.map((s, idx) => {
          const isCompleted = currentStep > s.step;
          const isCurrent = currentStep === s.step;
          const isClickable = onStepClick && s.step < currentStep;

          return (
            <div key={s.step} className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                disabled={!isClickable}
                onClick={() => isClickable && onStepClick(s.step)}
                className={cn(
                  "flex items-center gap-3 text-left transition-all",
                  isClickable && "cursor-pointer hover:opacity-80"
                )}
              >
                <div
                  className={cn(
                    "flex items-center justify-center w-9 h-9 rounded-xl font-semibold text-sm transition-all",
                    isCompleted && "bg-emerald-600 text-white shadow-emerald-500/20 shadow-md",
                    isCurrent && "bg-primary text-primary-foreground shadow-md ring-2 ring-primary/20",
                    !isCompleted && !isCurrent && "bg-muted text-muted-foreground"
                  )}
                >
                  {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : s.step}
                </div>
                <div>
                  <p
                    className={cn(
                      "text-sm font-medium transition-colors",
                      isCurrent ? "text-foreground font-semibold" : "text-muted-foreground"
                    )}
                  >
                    {s.title}
                  </p>
                  <p className="text-xs text-muted-foreground hidden lg:block">
                    {s.subtitle}
                  </p>
                </div>
              </button>
              {idx < STEPS.length - 1 && (
                <ChevronRight className="hidden sm:block w-4 h-4 text-muted-foreground/40 ml-auto sm:ml-2 shrink-0" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
