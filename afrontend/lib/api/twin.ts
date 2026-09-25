import { api } from "./client";
import {
  GoalStatus,
  GoalPriority,
  type FinancialTwinCreate,
  type FinancialTwinUpdate,
  type FinancialTwinResponse,
  type IncomeCreate,
  type IncomeResponse,
  type ExpenseCreate,
  type ExpenseResponse,
  type AssetCreate,
  type AssetResponse,
  type LiabilityCreate,
  type LiabilityResponse,
  type FinancialGoalCreate,
  type FinancialGoalResponse,
} from "@/lib/types";

/* ── Financial Twin (profile) ── */

export async function getFinancialTwin(): Promise<FinancialTwinResponse | null> {
  try {
    const res = await api.get<FinancialTwinResponse>("/financial-twin");
    return res.data;
  } catch (err: any) {
    if (err?.response?.status === 404) {
      return null;
    }
    throw err;
  }
}

export async function createFinancialTwin(data: FinancialTwinCreate): Promise<FinancialTwinResponse> {
  const res = await api.post<FinancialTwinResponse>("/financial-twin", data);
  return res.data;
}

export async function updateFinancialTwin(data: FinancialTwinUpdate): Promise<FinancialTwinResponse> {
  const res = await api.put<FinancialTwinResponse>("/financial-twin", data);
  return res.data;
}

/* ── Income ── */

export async function getIncomes(): Promise<IncomeResponse[]> {
  const res = await api.get<IncomeResponse[]>("/income");
  return res.data;
}

export async function addIncome(data: IncomeCreate): Promise<IncomeResponse> {
  const res = await api.post<IncomeResponse>("/income", data);
  return res.data;
}

export async function updateIncome(id: string, data: Partial<IncomeCreate>): Promise<IncomeResponse> {
  const res = await api.put<IncomeResponse>(`/income/${id}`, data);
  return res.data;
}

export async function deleteIncome(id: string): Promise<void> {
  await api.delete(`/income/${id}`);
}

/* ── Expenses ── */

export async function getExpenses(): Promise<ExpenseResponse[]> {
  const res = await api.get<ExpenseResponse[]>("/expenses");
  return res.data;
}

export async function addExpense(data: ExpenseCreate): Promise<ExpenseResponse> {
  const res = await api.post<ExpenseResponse>("/expenses", data);
  return res.data;
}

export async function updateExpense(id: string, data: Partial<ExpenseCreate>): Promise<ExpenseResponse> {
  const res = await api.put<ExpenseResponse>(`/expenses/${id}`, data);
  return res.data;
}

export async function deleteExpense(id: string): Promise<void> {
  await api.delete(`/expenses/${id}`);
}

/* ── Assets ── */

export async function getAssets(): Promise<AssetResponse[]> {
  const res = await api.get<AssetResponse[]>("/assets");
  return res.data;
}

export async function addAsset(data: AssetCreate): Promise<AssetResponse> {
  const res = await api.post<AssetResponse>("/assets", data);
  return res.data;
}

export async function updateAsset(id: string, data: Partial<AssetCreate>): Promise<AssetResponse> {
  const res = await api.put<AssetResponse>(`/assets/${id}`, data);
  return res.data;
}

export async function deleteAsset(id: string): Promise<void> {
  await api.delete(`/assets/${id}`);
}

/* ── Liabilities ── */

export async function getLiabilities(): Promise<LiabilityResponse[]> {
  const res = await api.get<LiabilityResponse[]>("/liabilities");
  return res.data;
}

export async function addLiability(data: LiabilityCreate): Promise<LiabilityResponse> {
  const payload = {
    ...data,
    principal_amount: Number(data.principal_amount) || 0,
    outstanding_amount: Number(data.outstanding_amount) || 0,
    emi_amount: data.emi_amount ? Number(data.emi_amount) : undefined,
    interest_rate: data.interest_rate ? Number(data.interest_rate) : undefined,
  };
  const res = await api.post<LiabilityResponse>("/liabilities", payload);
  return res.data;
}

export async function updateLiability(id: string, data: Partial<LiabilityCreate>): Promise<LiabilityResponse> {
  const payload = {
    ...data,
    principal_amount: data.principal_amount !== undefined ? Number(data.principal_amount) || 0 : undefined,
    outstanding_amount: data.outstanding_amount !== undefined ? Number(data.outstanding_amount) || 0 : undefined,
    emi_amount: data.emi_amount !== undefined ? (data.emi_amount ? Number(data.emi_amount) : undefined) : undefined,
    interest_rate: data.interest_rate !== undefined ? (data.interest_rate ? Number(data.interest_rate) : undefined) : undefined,
  };
  const res = await api.put<LiabilityResponse>(`/liabilities/${id}`, payload);
  return res.data;
}

export async function deleteLiability(id: string): Promise<void> {
  await api.delete(`/liabilities/${id}`);
}

/* ── Financial Goals ── */

export async function getGoals(): Promise<FinancialGoalResponse[]> {
  const res = await api.get<FinancialGoalResponse[]>("/goals");
  return res.data;
}

export async function addGoal(data: FinancialGoalCreate): Promise<FinancialGoalResponse> {
  const payload = {
    ...data,
    title: data.title?.trim() || "Financial Goal",
    target_amount: Number(data.target_amount) || 0,
    current_savings: Number(data.current_savings) || 0,
    target_date: data.target_date && data.target_date.trim() !== "" ? data.target_date : undefined,
    status: data.status || GoalStatus.ACTIVE,
    priority: data.priority || GoalPriority.MEDIUM,
  };
  const res = await api.post<FinancialGoalResponse>("/goals", payload);
  return res.data;
}

export async function updateGoal(id: string, data: Partial<FinancialGoalCreate>): Promise<FinancialGoalResponse> {
  const payload = {
    ...data,
    title: data.title !== undefined ? (data.title.trim() || "Financial Goal") : undefined,
    target_amount: data.target_amount !== undefined ? Number(data.target_amount) || 0 : undefined,
    current_savings: data.current_savings !== undefined ? Number(data.current_savings) || 0 : undefined,
    target_date: data.target_date && data.target_date.trim() !== "" ? data.target_date : undefined,
  };
  const res = await api.put<FinancialGoalResponse>(`/goals/${id}`, payload);
  return res.data;
}

export async function deleteGoal(id: string): Promise<void> {
  await api.delete(`/goals/${id}`);
}
