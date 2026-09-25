/**
 * Arthsaathi Mock Data & Demo Mode Dataset — §12
 *
 * Grounded in realistic Indian financial figures.
 * Used when NEXT_PUBLIC_USE_MOCKS !== "false" so the full app is testable out of the box.
 */

export const USE_MOCKS = false;

export const mockUser = {
  id: "b6a1e6b0-2f3e-4a3b-9c1e-7e2a2f4d9a11",
  email: "priya.demo@arthsaathi.app",
  full_name: "Priya Sharma",
};

export const mockProfile = {
  age: 29,
  city: "Thane",
  state: "Maharashtra",
  education: "GRADUATE",
  marital_status: "MARRIED",
  dependents: 2,
  has_elderly_parents: false,
  risk_appetite: "MEDIUM",
  occupation_type: "SALARIED",
  occupation_description: "School Teacher",
  monthly_income: 80000,
};

export const mockIncomeSources = [
  { id: "inc-1", source_name: "SALARY", amount: 80000, frequency: "MONTHLY", description: "School salary" },
];

export const mockExpenses = [
  { id: "exp-1", category: "HOUSING", amount: 18000, description: "Rent" },
  { id: "exp-2", category: "FOOD", amount: 9000, description: "Groceries + dining" },
  { id: "exp-3", category: "TRANSPORT", amount: 3500, description: "Auto + petrol" },
  { id: "exp-4", category: "UTILITIES", amount: 2800, description: "Electricity, internet, mobile" },
  { id: "exp-5", category: "EDUCATION", amount: 6000, description: "Child school fees" },
  { id: "exp-6", category: "INSURANCE", amount: 2200, description: "LIC premium" },
];

export const mockAssets = [
  { id: "ast-1", type: "SAVINGS", value: 80000, description: "Bank account" },
  { id: "ast-2", type: "GOLD", value: 150000, description: "Family gold" },
  { id: "ast-3", type: "MUTUAL_FUNDS", value: 40000, description: "SIP, 2 years" },
];

export const mockLiabilities = [
  {
    id: "lia-1",
    type: "PERSONAL_LOAN",
    lender_name: "SBI Personal Loan",
    original_principal: 300000,
    outstanding_amount: 210000,
    monthly_emi: 10000,
    annual_interest_rate: 13.5,
  },
];

export const mockGoals = [
  { id: "goal-1", name: "Emergency Fund", type: "EMERGENCY_FUND", target_amount: 270000, current_savings: 80000, target_date: "2026-11-01", priority: "HIGH", status: "ACTIVE", progress: 0.3 },
  { id: "goal-2", name: "Home Purchase", type: "HOME_PURCHASE", target_amount: 2000000, current_savings: 200000, target_date: "2031-06-01", priority: "MEDIUM", status: "ACTIVE", progress: 0.1 },
  { id: "goal-3", name: "Child Education", type: "CHILD_EDUCATION", target_amount: 500000, current_savings: 120000, target_date: "2034-04-01", priority: "HIGH", status: "ACTIVE", progress: 0.24 },
];

export const mockHealthScore = {
  health_score: 82.33,
  category: "EXCELLENT" as const,
  feature_importance: {
    emi_to_income_ratio: 0.356,
    savings_rate: 0.319,
    emergency_fund_months: 0.234,
  },
  insights: [
    "Your EMIs consume 55% of income. Consider prepaying your personal loan to reduce EMI burden before taking any new debt.",
    "Excellent financial behavior! Keep maintaining low debt levels and a strong savings habit.",
  ],
};

export const mockGoalFeasibility = [
  { goal_id: "goal-1", required_monthly: 13571, available_monthly: 14000, status: "ON_TRACK", recommendation: "You are on track to fully fund your emergency fund in about 14 months." },
  { goal_id: "goal-2", required_monthly: 30000, available_monthly: 14000, status: "NOT_FEASIBLE", recommendation: "To achieve this goal you need to save ₹30,000/month but only ₹14,000 is available. Consider extending the timeline to 8 years or finding an additional income source." },
];

export const mockScamShieldResult = {
  scam_probability: 94,
  category: "Fake KYC / Phishing",
  warning_signs: [
    "Creates artificial urgency (account will be blocked)",
    "Contains a suspicious URL, not the official bank domain",
    "Requests sensitive information (OTP, password)",
  ],
  recommendation: "Do not click the link or share any OTP. Report to cybercrime.gov.in and call your bank official number to verify.",
  language_detected: "hi-en" as const,
};

export const mockSchemes = [
  {
    id: "scheme-1",
    scheme_name: "PM Mudra Yojana — Shishu Category",
    eligible: true,
    benefit: "Loan up to ₹50,000 at a subsidized interest rate",
    documents_needed: ["Aadhaar Card", "PAN Card", "6 months bank statement"],
    how_to_apply: "Visit nearest PSU bank or apply at mudra.org.in",
    deadline: "No deadline — ongoing scheme",
    category: "BUSINESS",
  },
  {
    id: "scheme-2",
    scheme_name: "Ayushman Bharat",
    eligible: false,
    benefit: "₹5 lakh health insurance cover for eligible families",
    documents_needed: ["Aadhaar Card", "Ration Card", "Income Certificate"],
    how_to_apply: "Check eligibility at pmjay.gov.in or nearest empanelled hospital",
    deadline: "No deadline — ongoing scheme",
    category: "HEALTH",
  },
  {
    id: "scheme-3",
    scheme_name: "Sukanya Samriddhi Yojana",
    eligible: true,
    benefit: "High-interest savings scheme for a girl child, tax-free returns",
    documents_needed: ["Birth Certificate", "Aadhaar Card", "Guardian ID proof"],
    how_to_apply: "Open an account at any post office or authorised bank branch",
    deadline: "Account must be opened before the child turns 10",
    category: "EDUCATION",
  },
];
