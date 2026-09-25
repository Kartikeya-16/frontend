"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { TRANSITION } from "@/lib/motion";
import { Check } from "lucide-react";

interface StepWizardProps {
  steps: string[];
  currentStep: number;
}

export function StepWizard({ steps, currentStep }: StepWizardProps) {
  const percent = Math.round(((currentStep + 1) / steps.length) * 100);

  return (
    <div className="w-full space-y-4">
      {/* Top progress overview bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="font-bold text-ink">
            Step {currentStep + 1} of {steps.length}: <span className="text-emerald underline decoration-marigold">{steps[currentStep]}</span>
          </span>
          <span className="font-bold text-ink/70">
            {percent}% Completed
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-ink/10 border border-ink/20 overflow-hidden relative">
          <motion.div
            initial={false}
            animate={{ width: `${percent}%` }}
            transition={TRANSITION.component}
            className="h-full bg-gradient-to-r from-marigold to-emerald rounded-full"
          />
        </div>
      </div>

      {/* Step nodes and connecting lines */}
      <div className="flex items-center gap-1 w-full pt-1">
        {steps.map((label, i) => {
          const isCompleted = i < currentStep;
          const isActive = i === currentStep;

          return (
            <div key={label} className="flex items-center flex-1 last:flex-none">
              {/* Dot */}
              <div className="flex flex-col items-center gap-1.5">
                <motion.div
                  initial={false}
                  animate={{
                    scale: isActive ? 1.15 : 1,
                    backgroundColor: isCompleted
                      ? "var(--color-emerald)"
                      : isActive
                        ? "var(--color-marigold)"
                        : "var(--color-paper)",
                  }}
                  transition={TRANSITION.micro}
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono font-bold shrink-0 border transition-shadow",
                    isCompleted
                      ? "text-paper border-ink shadow-[1px_1px_0_0_var(--color-ink)]"
                      : isActive
                        ? "text-ink border-[2px] border-ink shadow-[2px_2px_0_0_var(--color-ink)]"
                        : "text-ink/40 border-ink/30"
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4 stroke-[3]" />
                  ) : (
                    <span>{i + 1}</span>
                  )}
                </motion.div>
                <span
                  className={cn(
                    "text-[10px] leading-tight text-center max-w-[68px] hidden sm:block font-mono",
                    isActive
                      ? "text-ink font-bold"
                      : isCompleted
                        ? "text-ink/75 font-medium"
                        : "text-ink/40"
                  )}
                >
                  {label}
                </span>
              </div>

              {/* Connecting line */}
              {i < steps.length - 1 && (
                <div className="flex-1 mx-1.5 h-1 rounded-full bg-ink/15 relative overflow-hidden self-start mt-3.5">
                  <motion.div
                    initial={false}
                    animate={{ scaleX: isCompleted ? 1 : 0 }}
                    transition={TRANSITION.component}
                    className="absolute inset-0 bg-emerald origin-left"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
