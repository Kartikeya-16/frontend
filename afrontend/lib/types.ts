/**
 * Arthsaathi type definitions — mirrors backend Pydantic schemas.
 *
 * Enum values match the backend exactly (SCREAMING_CASE strings).
 * Response types include UUID id, user_id, and timestamps.
 */

/* ── Enums ── */

export enum OccupationType {
  SALARIED = "SALARIED",
  SELF_EMPLOYED = "SELF_EMPLOYED",
  BUSINESS = "BUSINESS",
  FREELANCER = "FREELANCER",
  STUDENT = "STUDENT",
  RETIRED = "RETIRED",
  OTHER = "OTHER",
}

export enum EducationLevel {
  HIGH_SCHOOL = "HIGH_SCHOOL",
  GRADUATE = "GRADUATE",
  POST_GRADUATE = "POST_GRADUATE",
  OTHER = "OTHER",
}

export enum MaritalStatus {
  SINGLE = "SINGLE",
  MARRIED = "MARRIED",
  DIVORCED = "DIVORCED",
  WIDOWED = "WIDOWED",
}

export enum RiskAppetite {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
}

export enum FrequencyType {
  MONTHLY = "MONTHLY",
  WEEKLY = "WEEKLY",
  ANNUAL = "ANNUAL",
  ONE_TIME = "ONE_TIME",
}

export enum ExpenseCategory {
  HOUSING = "HOUSING",
  FOOD = "FOOD",
  TRANSPORT = "TRANSPORT",
  UTILITIES = "UTILITIES",
  HEALTHCARE = "HEALTHCARE",
  EDUCATION = "EDUCATION",
  ENTERTAINMENT = "ENTERTAINMENT",
  CLOTHING = "CLOTHING",
  PERSONAL_CARE = "PERSONAL_CARE",
  INSURANCE = "INSURANCE",
  OTHER = "OTHER",
}

export enum AssetType {
  REAL_ESTATE = "REAL_ESTATE",
  VEHICLE = "VEHICLE",
  SAVINGS = "SAVINGS",
  STOCKS = "STOCKS",
  MUTUAL_FUNDS = "MUTUAL_FUNDS",
  GOLD = "GOLD",
  FIXED_DEPOSIT = "FIXED_DEPOSIT",
  CRYPTO = "CRYPTO",
  OTHER = "OTHER",
}

export enum LiabilityType {
  HOME_LOAN = "HOME_LOAN",
  CAR_LOAN = "CAR_LOAN",
  PERSONAL_LOAN = "PERSONAL_LOAN",
  EDUCATION_LOAN = "EDUCATION_LOAN",
  CREDIT_CARD = "CREDIT_CARD",
  OTHER = "OTHER",
}

export enum GoalType {
  EMERGENCY_FUND = "EMERGENCY_FUND",
  HOME_PURCHASE = "HOME_PURCHASE",
  VEHICLE_PURCHASE = "VEHICLE_PURCHASE",
  EDUCATION = "EDUCATION",
  RETIREMENT = "RETIREMENT",
  TRAVEL = "TRAVEL",
  WEDDING = "WEDDING",
  INVESTMENT = "INVESTMENT",
  OTHER = "OTHER",
}

export enum GoalPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
}

export enum GoalStatus {
  ACTIVE = "ACTIVE",
  ACHIEVED = "ACHIEVED",
  PAUSED = "PAUSED",
  CANCELLED = "CANCELLED",
}

export type HealthCategory = "POOR" | "FAIR" | "GOOD" | "EXCELLENT";

/* ── Auth ── */

export interface UserCreate {
  email: string;
  password: string;
  full_name?: string;
}

export interface UserLogin {
  email: string;
  password: string;
}

export interface UserResponse {
  id: string;
  email: string;
  full_name: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

/* ── Financial Twin ── */

export interface FinancialTwinCreate {
  occupation: string;
  occupation_type: OccupationType;
  monthly_income: number;
  state: string;
  city: string;
  age: number;
  education_level: EducationLevel;
  marital_status: MaritalStatus;
  dependents_count: number;
  has_elderly_parents: boolean;
  risk_appetite: RiskAppetite;
}

export interface FinancialTwinUpdate extends Partial<FinancialTwinCreate> {}

export interface FinancialTwinResponse extends FinancialTwinCreate {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

/* ── Income ── */

export interface IncomeCreate {
  source: string;
  amount: number;
  frequency: FrequencyType;
  description?: string;
}

export interface IncomeUpdate extends Partial<IncomeCreate> {}

export interface IncomeResponse extends IncomeCreate {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

/* ── Expenses ── */

export interface ExpenseCreate {
  category: ExpenseCategory;
  amount: number;
  frequency: FrequencyType;
  description?: string;
}

export interface ExpenseUpdate extends Partial<ExpenseCreate> {}

export interface ExpenseResponse extends ExpenseCreate {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

/* ── Assets ── */

export interface AssetCreate {
  asset_type: AssetType;
  name: string;
  current_value: number;
  description?: string;
}

export interface AssetUpdate extends Partial<AssetCreate> {}

export interface AssetResponse extends AssetCreate {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

/* ── Liabilities ── */

export interface LiabilityCreate {
  liability_type: LiabilityType;
  name: string;
  principal_amount: number;
  outstanding_amount: number;
  emi_amount?: number;
  interest_rate?: number;
  description?: string;
}

export interface LiabilityUpdate extends Partial<LiabilityCreate> {}

export interface LiabilityResponse extends LiabilityCreate {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

/* ── Financial Goals ── */

export interface FinancialGoalCreate {
  title: string;
  goal_type: GoalType;
  target_amount: number;
  current_savings: number;
  target_date?: string; // ISO date string
  priority: GoalPriority;
  status: GoalStatus;
}

export interface FinancialGoalUpdate extends Partial<FinancialGoalCreate> {}

export interface FinancialGoalResponse extends FinancialGoalCreate {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

/* ── Health Score (ML Service 1) ── */

export interface HealthScoreRequest {
  monthly_income: number;
  total_monthly_emis: number;
  total_monthly_expenses: number;
  liquid_savings: number;
  total_assets: number;
  total_liabilities: number;
  goals: { target_amount: number; current_savings: number }[];
}

export interface FeatureImportance {
  emi_to_income_ratio: number;
  savings_rate: number;
  emergency_fund_months: number;
  expense_to_income_ratio: number;
  asset_to_liability_ratio: number;
  goal_progress_avg: number;
}

export interface HealthScoreResponse {
  health_score: number;
  category: HealthCategory;
  feature_importance: FeatureImportance;
  insights: string[];
  model_version: string;
}

/* ── Scam Shield (mock until ML service ready) ── */

export interface ScamAnalysisRequest {
  type: "text" | "url" | "image" | "pdf";
  content: string;
}

export interface ScamAnalysisResponse {
  scam_probability: number;
  category: string;
  warning_signs: string[];
  recommendation: string;
  language_detected: string;
}

/* ── Scheme Navigator (Scheme Service 1) ── */

export interface SchemeUserProfile {
  gender: "male" | "female" | "transgender";
  age: number;
  state?: string;
  residence: "urban" | "rural";
  caste: "General" | "OBC" | "SC" | "ST" | "PVTG" | "DNT";
  disability: boolean;
  minority: boolean;
  is_student: boolean;
  bpl: boolean;
  annual_income?: number;
  applying_for_family: boolean;
  occupation?: string;
  occupation_type?: string;
}

export interface MatchedScheme {
  slug: string;
  name: string;
  category: string;
  state: string;
  description: string;
  benefits: string;
  apply_url?: string;
  official_url?: string;
  match_score: number;
  match_confidence: "high" | "medium" | "low";
  matched_criteria: string[];
  documents_required?: string | null;
  application_process?: string | null;
  eligibility_text?: string | null;
  ministry?: string | null;
  department?: string | null;
  beneficiary_type?: string | null;
  tags?: string | null;
}

export interface SchemeMatchResponse {
  total_matches: number;
  results: MatchedScheme[];
}

/* ── Bank Statements (Advisor Service / Feature 1) ── */

export interface TransactionResponse {
  id: string;
  statement_id: string;
  txn_date: string;
  narration: string;
  ref_no?: string | null;
  debit: string;
  credit: string;
  balance: string;
  category: string;
}

export interface StatementResponse {
  id: string;
  bank: string;
  period_start: string;
  period_end: string;
  txn_count: number;
  reconciled: boolean;
  created_at: string;
}

export interface StatementUploadResponse {
  id: string;
  bank: string;
  period_start: string;
  period_end: string;
  txn_count: number;
  reconciled: boolean;
  skipped_duplicates: number;
  preview: TransactionResponse[];
}

export interface PaginatedTransactionsResponse {
  items: TransactionResponse[];
  total: number;
  page: number;
  size: number;
  pages: number;
}
