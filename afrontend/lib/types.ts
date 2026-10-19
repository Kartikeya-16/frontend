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
  emi_to_income_ratio?: number;
  savings_rate?: number;
  emergency_fund_months?: number;
  expense_to_income_ratio?: number;
  asset_to_liability_ratio?: number;
  goal_progress_avg?: number;
  [key: string]: number | undefined;
}

export interface HealthScoreResponse {
  health_score: number;
  category: HealthCategory;
  feature_importance: FeatureImportance;
  insights: string[];
  model_version: string;
}

/* ── Scam Shield (mock until ML service ready) ── */

export interface ScamThreatIndicators {
  extracted_urls?: string[];
  extracted_upis?: string[];
  extracted_phones?: string[];
  spoofed_entities?: string[];
}

export interface ScamEmergencyAction {
  helpline: string;
  cybercrime_portal: string;
  chakshu_portal: string;
  report_guidelines: string[];
}

export interface ScamAnalysisRequest {
  type: "text" | "url" | "image" | "pdf";
  content: string;
}

export interface ScamAnalysisResponse {
  scam_probability: number;
  risk_level?: "HIGH" | "MEDIUM" | "SAFE" | string;
  category: string;
  warning_signs: string[];
  threat_indicators?: ScamThreatIndicators;
  recommendation: string;
  emergency_action?: ScamEmergencyAction;
  language_detected: string;
}

export interface ThreatIntelItem {
  id: string;
  title: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  summary: string;
  safety_rule: string;
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
  apply_url_clean?: string;
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

/* ── Financial Advisor (Feature 2) ── */

export interface AdvisorLiability {
  type: string;
  outstanding_inr?: number;
  outstanding_amount?: number;
  interest_rate_pct?: number;
  interest_rate?: number;
  emi_inr?: number;
  emi_amount?: number;
  payoff_order?: number;
}

export interface AdvisorGoalInput {
  goal_id: string;
  name: string;
  target_inr?: number;
  target_amount?: number;
  years: number;
  current_savings_inr?: number;
  current_savings?: number;
  for_daughter?: boolean;
}

export interface AdvisorInsurance {
  term_cover_inr: number;
  health_cover_inr: number;
}

export interface AdvisorProfile {
  age: number;
  monthly_income_inr: number;
  other_monthly_inflow_inr: number;
  monthly_expenses_inr: number;
  emergency_fund_inr: number;
  liabilities: AdvisorLiability[];
  insurance: AdvisorInsurance;
  dependents: number;
  daughters_under_10: number;
  tax_regime: "new" | "old";
  goals: AdvisorGoalInput[];
  risk_answers: number[];
}

export interface TwinGap {
  field: string;
  message: string;
  link: string;
}

export interface ProfileDraftResponse {
  profile: AdvisorProfile;
  missing_fields: string[];
  skipped_goals: Array<{
    goal_id: string;
    name: string;
    reason: string;
  }>;
  source?: Record<string, string>;
  twin_gaps?: TwinGap[];
  twin_updated_at?: string | null;
}

export interface QuestionnaireOption {
  [key: string]: string;
}

export interface QuestionnaireItem {
  id: string;
  text: string;
  options: Record<string, string>;
}

export interface QuestionnaireResponse {
  questions: QuestionnaireItem[];
}

export interface AdvisorMetaResponse {
  data_freshness: {
    fd_rates_as_of: string;
    small_savings_quarter: string;
    small_savings_valid_to: string;
    stale: boolean;
  };
  assumptions: {
    inflation_pct: number;
    equity_return_pct: number;
    debt_return_pct: number;
    min_monthly_sip_inr: number;
  };
  disclaimer: string;
}

export interface ActionProduct {
  name: string;
  category: string;
  yield_or_rate?: string;
  lock_in?: string;
  why?: string;
  [key: string]: unknown;
}

export interface AdvisorAction {
  priority: number;
  code: string;
  status: "do_now" | "next" | string;
  title: string;
  amount_inr: number;
  reasons: string[];
  products: ActionProduct[];
  payoff_order?: number;
}

export interface GoalInstrument {
  category_id: string;
  name: string;
  role: "equity" | "debt" | "gold" | string;
  reason: string;
  assumed_return_pct?: number;
}

export interface TopFdOption {
  bank_id: string;
  bank_name: string;
  bank_type: "sfb" | "psu" | "private" | string;
  product: string;
  tenure_bucket: string;
  tenure_years: number;
  rate_general_pct: number;
  rate_senior_pct: number;
  lock_in_years: number;
  tax_deduction_eligible: boolean;
  dicgc_cover_inr: number;
  deposit_size_band: string;
  source_url: string;
  as_of_date: string;
  notes: string;
  note?: string;
}

export interface GoalFdOptions {
  tenure: string;
  top_fds: TopFdOption[];
  dicgc_note?: string;
}

export interface PlanGoalDetail {
  goal_id: string;
  bucket: "short" | "medium" | "long" | string;
  equity_share_pct: number;
  required_monthly_sip_inr: number;
  inflated_target_inr: number;
  expected_return_pct: number;
  split_monthly_inr: {
    equity: number;
    debt: number;
  };
  name: string;
  years: number;
  target_today_inr: number;
  instruments: GoalInstrument[];
  fd_options: GoalFdOptions;
}

export interface EligibleSmallSavingsScheme {
  scheme_id: string;
  name: string;
  rate_pct: number;
  lock_in_years: number;
  tax_deduction_eligible: boolean;
  interest_taxable: boolean;
  sovereign_backed: boolean;
}

export interface TaxSavingOption {
  instrument: string;
  name: string;
  rate_pct: number;
  lock_in_years: number;
  why: string;
}

export interface TaxSavingSection {
  section: string;
  limit_inr: number;
  note: string;
  options: TaxSavingOption[];
}

export interface AdvisorPlanSummary {
  monthly_surplus_inr: number;
  emergency_fund_months: number;
  flags: string[];
  first_action: string;
  risk_score: number;
  risk_profile: string;
  goals: Array<{
    goal_id: string;
    bucket: string;
    equity_share_pct: number;
    required_monthly_sip_inr: number;
  }>;
  total_required_monthly_sip_inr: number;
  goals_affordable: boolean;
  eligible_small_savings: string[];
  tax_saving_relevant: boolean;
  inflow_inr: number;
  outflow_inr: number;
  emergency_fund_target_inr: number;
}

export interface AdvisorRiskSummary {
  score: number;
  profile: string;
  questionnaire_profile: string;
  capped_by: string | null;
}

export interface PostOfficeTdRate {
  scheme_id: string;
  name: string;
  tenure_years: number;
  rate_pct: number;
  tax_deduction_eligible: boolean;
  sovereign_backed: boolean;
}

export interface FdRecommendations {
  rate_type: "general" | "senior" | string;
  profile: string;
  sfb_hidden: boolean;
  by_tenure: {
    "1y": TopFdOption[];
    "3y": TopFdOption[];
    "5y": TopFdOption[];
    [key: string]: TopFdOption[];
  };
  tax_saver: TopFdOption[];
  post_office_td: PostOfficeTdRate[];
  dicgc_cover_inr: number;
  safety_note: string;
  as_of: string;
}

export interface AdvisorPlan {
  summary: AdvisorPlanSummary;
  risk: AdvisorRiskSummary;
  actions: AdvisorAction[];
  goals: PlanGoalDetail[];
  fd_recommendations?: FdRecommendations;
  eligible_small_savings: EligibleSmallSavingsScheme[];
  tax_saving: TaxSavingSection | null;
  assumptions: {
    inflation_pct: number;
    equity_return_pct: number;
    debt_return_pct: number;
    min_monthly_sip_inr: number;
  };
  data_freshness: {
    fd_rates_as_of: string;
    small_savings_quarter: string;
    small_savings_valid_to: string;
    stale: boolean;
  };
  disclaimer: string;
}
