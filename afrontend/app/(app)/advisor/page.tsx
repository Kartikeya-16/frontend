"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useAdvisorStore } from "@/store/advisor-store";
import { useTwinStore } from "@/store/twin-store";
import { StepIndicator } from "@/components/advisor/step-indicator";
import { StepZeroChoice } from "@/components/advisor/step-zero-choice";
import { TwinReviewView } from "@/components/advisor/twin-review-view";
import { ProfileForm } from "@/components/advisor/profile-form";
import { RiskQuestionnaire } from "@/components/advisor/risk-questionnaire";
import { PlanView } from "@/components/advisor/plan-view";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Compass, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FinancialAdvisorPage() {
  const {
    currentStep,
    mode,
    setStep,
    initDraft,
    fetchMeta,
    setCurrentUserId,
    isLoadingDraft,
    error,
    errorStatus,
  } = useAdvisorStore();

  const twinProfile = useTwinStore((s) => s.profile);

  useEffect(() => {
    // If twin store has loaded user, synchronize userId
    if (twinProfile?.user_id) {
      setCurrentUserId(twinProfile.user_id);
    }
  }, [twinProfile?.user_id, setCurrentUserId]);

  useEffect(() => {
    initDraft();
    fetchMeta();
  }, [initDraft, fetchMeta]);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner / Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-primary/10 text-primary rounded-xl">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Financial Advisor
              </h1>
              <p className="text-sm text-muted-foreground">
                Personal financial planning, debt payoff and goal investing.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Global Error Banner (e.g. 503 Advisor Unavailable) */}
      {error && errorStatus === 503 && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-5 flex items-start gap-4 text-destructive">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-semibold text-sm">Advisor Service Unavailable</h4>
            <p className="text-xs text-destructive/80 leading-relaxed">
              Advisor is temporarily unavailable. Please verify the background microservice is active or try again shortly.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (currentStep === 3) {
                  useAdvisorStore.getState().generatePlan();
                } else {
                  initDraft();
                }
              }}
              className="mt-2 h-8 text-xs border-destructive/30 hover:bg-destructive/10 gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retry Connection
            </Button>
          </div>
        </div>
      )}

      {/* Step Indicator */}
      <StepIndicator
        currentStep={currentStep}
        onStepClick={(s) => setStep(s)}
      />

      {/* Step Content */}
      {isLoadingDraft && currentStep !== 0 ? (
        <div className="space-y-6 max-w-4xl mx-auto">
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {currentStep === 0 && (
            <motion.div
              key="step-0"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <StepZeroChoice />
            </motion.div>
          )}

          {currentStep === 1 && mode === "twin" && (
            <motion.div
              key="step-1-twin"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <TwinReviewView />
            </motion.div>
          )}

          {currentStep === 1 && mode === "manual" && (
            <motion.div
              key="step-1-manual"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <ProfileForm />
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <RiskQuestionnaire />
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <PlanView />
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
