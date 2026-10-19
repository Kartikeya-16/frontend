import { create } from "zustand";
import { persist } from "zustand/middleware";
import axios from "axios";
import type {
  AdvisorProfile,
  QuestionnaireItem,
  AdvisorPlan,
  AdvisorMetaResponse,
  AdvisorLiability,
  AdvisorGoalInput,
  TwinGap,
} from "@/lib/types";
import {
  getQuestionnaire,
  getAdvisorMeta,
  getProfileDraft,
  createPlan,
} from "@/lib/api/advisor";

export type AdvisorStep = 0 | 1 | 2 | 3;
export type AdvisorMode = "twin" | "manual";

export interface SavedAnswers {
  term_cover_inr: number;
  health_cover_inr: number;
  daughters_under_10: number;
  tax_regime: "new" | "old";
  risk_answers: number[];
}

export const DEFAULT_PROFILE: AdvisorProfile = {
  age: 30,
  monthly_income_inr: 0,
  other_monthly_inflow_inr: 0,
  monthly_expenses_inr: 0,
  emergency_fund_inr: 0,
  liabilities: [],
  insurance: {
    term_cover_inr: 0,
    health_cover_inr: 0,
  },
  dependents: 0,
  daughters_under_10: 0,
  tax_regime: "new",
  goals: [],
  risk_answers: [],
};

interface AdvisorStoreState {
  currentStep: AdvisorStep;
  mode: AdvisorMode;
  profile: AdvisorProfile;
  twinFields: Set<string>;
  sourceMap: Record<string, string>;
  twinGaps: TwinGap[];
  twinUpdatedAt: string | null;
  skippedGoals: Array<{ goal_id: string; name: string; reason: string }>;
  hasTwin: boolean | null; // null = checking, false = 404
  questions: QuestionnaireItem[];
  meta: AdvisorMetaResponse | null;
  plan: AdvisorPlan | null;

  // Persisted user extra answers map: userId -> SavedAnswers
  userSavedAnswers: Record<string, SavedAnswers>;
  currentUserId: string | null;
  hasUsedSavedAnswers: boolean;

  isLoadingDraft: boolean;
  isLoadingQuestions: boolean;
  isLoadingPlan: boolean;
  error: string | null;
  errorStatus: number | null;

  setStep: (step: AdvisorStep) => void;
  setMode: (mode: AdvisorMode) => void;
  setCurrentUserId: (userId: string | null) => void;
  updateProfile: (partial: Partial<AdvisorProfile>) => void;
  addLiability: (liability: AdvisorLiability) => void;
  updateLiability: (index: number, liability: AdvisorLiability) => void;
  removeLiability: (index: number) => void;
  addGoal: (goal: AdvisorGoalInput) => void;
  updateGoal: (index: number, goal: AdvisorGoalInput) => void;
  removeGoal: (index: number) => void;
  setRiskAnswer: (questionIndex: number, answerValue: number) => void;

  initDraft: () => Promise<void>;
  fetchQuestions: () => Promise<void>;
  fetchMeta: () => Promise<void>;
  generatePlan: () => Promise<void>;
  resetPlan: () => void;
  startOver: () => void;
  clearSavedAnswers: () => void;
}

export const useAdvisorStore = create<AdvisorStoreState>()(
  persist(
    (set, get) => ({
      currentStep: 0,
      mode: "twin",
      profile: { ...DEFAULT_PROFILE },
      twinFields: new Set<string>(),
      sourceMap: {},
      twinGaps: [],
      twinUpdatedAt: null,
      skippedGoals: [],
      hasTwin: null,
      questions: [],
      meta: null,
      plan: null,

      userSavedAnswers: {},
      currentUserId: null,
      hasUsedSavedAnswers: false,

      isLoadingDraft: false,
      isLoadingQuestions: false,
      isLoadingPlan: false,
      error: null,
      errorStatus: null,

      setStep: (step) => set({ currentStep: step, error: null }),
      setMode: (mode) => set({ mode }),
      setCurrentUserId: (userId) => set({ currentUserId: userId }),

      updateProfile: (partial) => {
        set((state) => ({
          profile: {
            ...state.profile,
            ...partial,
          },
        }));
      },

      addLiability: (liability) => {
        set((state) => ({
          profile: {
            ...state.profile,
            liabilities: [...state.profile.liabilities, liability],
          },
        }));
      },

      updateLiability: (index, liability) => {
        set((state) => {
          const next = [...state.profile.liabilities];
          next[index] = liability;
          return {
            profile: {
              ...state.profile,
              liabilities: next,
            },
          };
        });
      },

      removeLiability: (index) => {
        set((state) => ({
          profile: {
            ...state.profile,
            liabilities: state.profile.liabilities.filter((_, i) => i !== index),
          },
        }));
      },

      addGoal: (goal) => {
        set((state) => ({
          profile: {
            ...state.profile,
            goals: [...state.profile.goals, goal],
          },
        }));
      },

      updateGoal: (index, goal) => {
        set((state) => {
          const next = [...state.profile.goals];
          next[index] = goal;
          return {
            profile: {
              ...state.profile,
              goals: next,
            },
          };
        });
      },

      removeGoal: (index) => {
        set((state) => ({
          profile: {
            ...state.profile,
            goals: state.profile.goals.filter((_, i) => i !== index),
          },
        }));
      },

      setRiskAnswer: (questionIndex, answerValue) => {
        set((state) => {
          const nextAnswers = [...state.profile.risk_answers];
          nextAnswers[questionIndex] = answerValue;
          return {
            profile: {
              ...state.profile,
              risk_answers: nextAnswers,
            },
          };
        });
      },

      initDraft: async () => {
        set({ isLoadingDraft: true, error: null, errorStatus: null });
        try {
          const res = await getProfileDraft();
          const p = res.profile;
          const twinFieldsSet = new Set<string>();

          if (res.source) {
            Object.keys(res.source).forEach((k) => twinFieldsSet.add(k));
          } else {
            if (p.monthly_income_inr > 0) twinFieldsSet.add("monthly_income_inr");
            if (p.monthly_expenses_inr > 0) twinFieldsSet.add("monthly_expenses_inr");
            if (p.emergency_fund_inr > 0) twinFieldsSet.add("emergency_fund_inr");
            if (p.age > 0) twinFieldsSet.add("age");
            if (p.dependents > 0) twinFieldsSet.add("dependents");
            if (p.liabilities?.length > 0) twinFieldsSet.add("liabilities");
            if (p.goals?.length > 0) twinFieldsSet.add("goals");
          }

          // Check if saved extra answers exist for user
          const { userSavedAnswers, currentUserId } = get();
          const saved = currentUserId ? userSavedAnswers[currentUserId] : null;

          const mergedInsurance = saved
            ? { term_cover_inr: saved.term_cover_inr, health_cover_inr: saved.health_cover_inr }
            : { term_cover_inr: p.insurance?.term_cover_inr || 0, health_cover_inr: p.insurance?.health_cover_inr || 0 };

          const mergedDaughters = saved ? saved.daughters_under_10 : (p.daughters_under_10 || 0);
          const mergedTaxRegime = saved ? saved.tax_regime : (p.tax_regime || "new");
          const mergedRiskAnswers = (saved?.risk_answers && saved.risk_answers.length > 0)
            ? saved.risk_answers
            : (p.risk_answers || []);

          set({
            profile: {
              ...DEFAULT_PROFILE,
              ...p,
              insurance: mergedInsurance,
              daughters_under_10: mergedDaughters,
              tax_regime: mergedTaxRegime,
              liabilities: p.liabilities || [],
              goals: p.goals || [],
              risk_answers: mergedRiskAnswers,
            },
            twinFields: twinFieldsSet,
            sourceMap: res.source || {},
            twinGaps: res.twin_gaps || [],
            twinUpdatedAt: res.twin_updated_at || null,
            skippedGoals: res.skipped_goals || [],
            hasTwin: true,
            hasUsedSavedAnswers: !!saved,
            isLoadingDraft: false,
          });
        } catch (err: unknown) {
          if (axios.isAxiosError(err)) {
            const status = err.response?.status;
            if (status === 404) {
              set({
                hasTwin: false,
                isLoadingDraft: false,
                error: "Create your Financial Twin first",
                errorStatus: 404,
              });
            } else if (status === 503) {
              set({
                isLoadingDraft: false,
                error: "Advisor is temporarily unavailable",
                errorStatus: 503,
              });
            } else {
              const detail = err.response?.data?.detail || err.message || "Failed to load financial draft";
              set({
                isLoadingDraft: false,
                error: typeof detail === "string" ? detail : JSON.stringify(detail),
                errorStatus: status || 500,
              });
            }
          } else {
            set({
              isLoadingDraft: false,
              error: "Failed to load financial draft",
              errorStatus: 500,
            });
          }
        }
      },

      fetchQuestions: async () => {
        set({ isLoadingQuestions: true });
        try {
          const res = await getQuestionnaire();
          set({ questions: res.questions, isLoadingQuestions: false });
        } catch {
          set({
            isLoadingQuestions: false,
            error: "Failed to load risk assessment questions.",
          });
        }
      },

      fetchMeta: async () => {
        try {
          const meta = await getAdvisorMeta();
          set({ meta });
        } catch {
          // Non-blocking
        }
      },

      generatePlan: async () => {
        const { profile, currentUserId, userSavedAnswers } = get();
        set({ isLoadingPlan: true, error: null, errorStatus: null });

        // Save missing fields in store for this user (never save tokens or full plan)
        if (currentUserId) {
          const updatedSaved: SavedAnswers = {
            term_cover_inr: profile.insurance.term_cover_inr,
            health_cover_inr: profile.insurance.health_cover_inr,
            daughters_under_10: profile.daughters_under_10,
            tax_regime: profile.tax_regime,
            risk_answers: profile.risk_answers,
          };
          set({
            userSavedAnswers: {
              ...userSavedAnswers,
              [currentUserId]: updatedSaved,
            },
            hasUsedSavedAnswers: true,
          });
        }

        try {
          const plan = await createPlan(profile);
          set({ plan, currentStep: 3, isLoadingPlan: false });
        } catch (err: unknown) {
          if (axios.isAxiosError(err)) {
            const status = err.response?.status;
            const detail = err.response?.data?.detail;
            let msg = "Failed to generate financial plan.";
            if (status === 422) {
              msg = typeof detail === "string"
                ? detail
                : (Array.isArray(detail)
                  ? detail.map((d: Record<string, unknown>) => String(d.msg || d)).join(", ")
                  : JSON.stringify(detail));
            } else if (status === 503) {
              msg = "Advisor is temporarily unavailable";
            } else if (typeof detail === "string") {
              msg = detail;
            }
            set({
              isLoadingPlan: false,
              error: msg,
              errorStatus: status || 500,
            });
          } else {
            set({
              isLoadingPlan: false,
              error: "Failed to generate financial plan.",
              errorStatus: 500,
            });
          }
        }
      },

      resetPlan: () => {
        set({ plan: null, currentStep: 1, error: null });
      },

      startOver: () => {
        set({
          currentStep: 0,
          plan: null,
          error: null,
          profile: { ...DEFAULT_PROFILE },
        });
      },

      clearSavedAnswers: () => {
        set({ userSavedAnswers: {}, hasUsedSavedAnswers: false });
      },
    }),
    {
      name: "arthsaathi_advisor_answers",
      partialize: (state) => ({
        userSavedAnswers: state.userSavedAnswers,
      }),
    }
  )
);
