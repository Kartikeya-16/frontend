import { create } from "zustand";
import {
  type FinancialTwinResponse,
  type IncomeResponse,
  type ExpenseResponse,
  type AssetResponse,
  type LiabilityResponse,
  type FinancialGoalResponse,
  type HealthScoreResponse,
  AssetType,
  FrequencyType,
} from "@/lib/types";
import {
  getFinancialTwin,
  getIncomes,
  getExpenses,
  getAssets,
  getLiabilities,
  getGoals,
} from "@/lib/api/twin";
import { getHealthScore } from "@/lib/api/planner";

export type TwinTabKey = "profile" | "income" | "expenses" | "assets" | "liabilities" | "goals";

export interface TwinHealthScore {
  score?: number;
  health_score?: number;
  category?: any;
  insights?: string[];
  feature_importance?: any;
  model_version?: string;
  [key: string]: any;
}

export interface TwinState {
  profile: FinancialTwinResponse | null;
  incomeSources: IncomeResponse[];
  expenses: ExpenseResponse[];
  assets: AssetResponse[];
  liabilities: LiabilityResponse[];
  goals: FinancialGoalResponse[];
  healthScore: TwinHealthScore | null;
  isLoading: boolean;
  isInitialized: boolean;
  hasOnboarded: boolean;
  activeTab: TwinTabKey;

  setActiveTab: (tab: TwinTabKey) => void;
  setTwin: (data: Partial<TwinState>) => void;
  fetchAllTwinData: () => Promise<void>;
  refreshHealthScore: () => Promise<void>;
}

export const useTwinStore = create<TwinState>((set, get) => ({
  profile: null,
  incomeSources: [],
  expenses: [],
  assets: [],
  liabilities: [],
  goals: [],
  healthScore: null,
  isLoading: false,
  isInitialized: false,
  hasOnboarded: false,
  activeTab: "profile",

  setActiveTab: (tab) => set({ activeTab: tab }),

  setTwin: (data) => set((state) => ({ ...state, ...data })),

  fetchAllTwinData: async () => {
    set({ isLoading: true });
    try {
      const [profileRes, incomesRes, expensesRes, assetsRes, liabilitiesRes, goalsRes] =
        await Promise.allSettled([
          getFinancialTwin(),
          getIncomes(),
          getExpenses(),
          getAssets(),
          getLiabilities(),
          getGoals(),
        ]);

      const profile = profileRes.status === "fulfilled" ? profileRes.value : null;
      const incomeSources = incomesRes.status === "fulfilled" ? incomesRes.value || [] : [];
      const expenses = expensesRes.status === "fulfilled" ? expensesRes.value || [] : [];
      const assets = assetsRes.status === "fulfilled" ? assetsRes.value || [] : [];
      const liabilities = liabilitiesRes.status === "fulfilled" ? liabilitiesRes.value || [] : [];
      const goals = goalsRes.status === "fulfilled" ? goalsRes.value || [] : [];

      const hasOnboarded = !!profile;

      set({
        profile,
        incomeSources,
        expenses,
        assets,
        liabilities,
        goals,
        hasOnboarded,
        isInitialized: true,
        isLoading: false,
      });

      if (profile) {
        get().refreshHealthScore().catch(() => {});
      }
    } catch (err) {
      console.error("Failed to load financial twin data:", err);
      set({ isInitialized: true, isLoading: false });
    }
  },

  refreshHealthScore: async () => {
    const { profile, incomeSources, expenses, assets, liabilities, goals } = get();
    if (!profile) return;

    try {
      const totalAssets = assets.reduce(
        (sum, a) => sum + (Number(a.current_value) || 0),
        0
      );
      const totalLiabilities = liabilities.reduce(
        (sum, l) => sum + (Number(l.outstanding_amount) || 0),
        0
      );
      const totalMonthlyEmis = liabilities.reduce(
        (sum, l) => sum + (Number(l.emi_amount) || 0),
        0
      );

      const totalMonthlyIncome =
        incomeSources.length > 0
          ? incomeSources.reduce((sum, inc) => {
              const amt = Number(inc.amount) || 0;
              switch (inc.frequency) {
                case FrequencyType.ANNUAL:
                  return sum + amt / 12;
                case FrequencyType.WEEKLY:
                  return sum + amt * 4.33;
                case FrequencyType.ONE_TIME:
                  return sum;
                default:
                  return sum + amt;
              }
            }, 0)
          : Number(profile.monthly_income) || 0;

      const totalMonthlyExpenses = expenses.reduce((sum, exp) => {
        const amt = Number(exp.amount) || 0;
        switch (exp.frequency) {
          case FrequencyType.ANNUAL:
            return sum + amt / 12;
          case FrequencyType.WEEKLY:
            return sum + amt * 4.33;
          case FrequencyType.ONE_TIME:
            return sum;
          default:
            return sum + amt;
        }
      }, 0);

      const liquidSavings = assets
        .filter(
          (a) =>
            a.asset_type === AssetType.SAVINGS ||
            a.asset_type === AssetType.FIXED_DEPOSIT
        )
        .reduce((sum, a) => sum + (Number(a.current_value) || 0), 0);

      const scoreRes = await getHealthScore({
        monthly_income: totalMonthlyIncome,
        total_monthly_emis: totalMonthlyEmis,
        total_monthly_expenses: totalMonthlyExpenses,
        liquid_savings: liquidSavings,
        total_assets: totalAssets,
        total_liabilities: totalLiabilities,
        goals: goals.map((g) => ({
          target_amount: Number(g.target_amount) || 0,
          current_savings: Number(g.current_savings) || 0,
        })),
      });

      // Augment with .score alias for components checking either property
      const augmented = {
        ...scoreRes,
        score: scoreRes.health_score,
      };

      set({ healthScore: augmented });
    } catch (err) {
      console.warn("Could not calculate ML health score:", err);
    }
  },
}));
