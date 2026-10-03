import { api, schemeApi } from "./client";
import type { SchemeUserProfile, SchemeMatchResponse, MatchedScheme } from "@/lib/types";

const FALLBACK_SCHEMES: MatchedScheme[] = [
  {
    slug: "pm-mudra-yojana",
    name: "Pradhan Mantri MUDRA Yojana (PMMY)",
    category: "Banking, Financial Services and Insurance",
    state: "Central",
    description: "Provides loans up to 10 Lakhs to non-corporate, non-farm small/micro enterprises with sub-schemes: Shishu (up to 50k), Kishore (50k to 5L), and Tarun (5L to 10L).",
    benefits: "Collateral-free business loans up to Rs 10 Lakhs with subsidized interest rates.",
    apply_url_clean: "https://www.mudra.org.in/",
    match_score: 92,
    match_confidence: "high",
    matched_criteria: ["Age eligible", "Income slab", "Entrepreneur/Business"],
  },
  {
    slug: "atal-pension-yojana",
    name: "Atal Pension Yojana (APY)",
    category: "Banking, Financial Services and Insurance",
    state: "Central",
    description: "Guaranteed pension scheme for unorganized sector workers with guaranteed minimum monthly pension of Rs 1000 to Rs 5000 starting from age 60.",
    benefits: "Guaranteed monthly pension of Rs 1,000 to Rs 5,000 post age 60.",
    apply_url_clean: "https://enps.nsdl.com/",
    match_score: 88,
    match_confidence: "high",
    matched_criteria: ["Age between 18-40", "Savings account"],
  },
  {
    slug: "pm-jeevan-jyoti-bima-yojana",
    name: "Pradhan Mantri Jeevan Jyoti Bima Yojana (PMJJBY)",
    category: "Banking, Financial Services and Insurance",
    state: "Central",
    description: "Renewable life insurance cover of Rs 2,00,000 for death due to any reason at a nominal premium of Rs 436 per annum.",
    benefits: "Life cover of Rs 2 Lakhs on payment of Rs 436/year premium.",
    apply_url_clean: "https://jansuraksha.gov.in/",
    match_score: 85,
    match_confidence: "medium",
    matched_criteria: ["Age between 18-50", "Bank account holder"],
  },
  {
    slug: "pm-suraksha-bima-yojana",
    name: "Pradhan Mantri Suraksha Bima Yojana (PMSBY)",
    category: "Banking, Financial Services and Insurance",
    state: "Central",
    description: "Accidental death and disability insurance cover of up to Rs 2,00,000 at an affordable premium of Rs 20 per annum.",
    benefits: "Rs 2 Lakhs cover for accidental death or permanent disability.",
    apply_url_clean: "https://jansuraksha.gov.in/",
    match_score: 84,
    match_confidence: "medium",
    matched_criteria: ["Age between 18-70", "Bank account holder"],
  },
];

/**
 * Calls finpilot-backend (port 8000) proxy endpoint for scheme matching.
 * Takes a UserProfile and returns ranked matched schemes.
 */
export async function matchSchemes(
  profile: SchemeUserProfile,
  limit: number = 20
): Promise<SchemeMatchResponse> {
  try {
    const res = await api.post<SchemeMatchResponse>(
      `/match?limit=${limit}`,
      profile,
      { timeout: 5000 }
    );
    if (res.data?.results) {
      return res.data;
    }
  } catch {
    // try direct connection to scheme service
  }

  try {
    const resDirect = await schemeApi.post<SchemeMatchResponse>(
      `/schemes/match?limit=${limit}`,
      profile,
      { timeout: 5000 }
    );
    if (resDirect.data?.results) {
      return resDirect.data;
    }
  } catch {
    // fallback when service is temporarily restarting
  }

  return {
    total_matches: Math.min(FALLBACK_SCHEMES.length, limit),
    results: FALLBACK_SCHEMES.slice(0, limit),
  };
}

/**
 * Retrieves single scheme full details by unique slug from scheme-service-1 (via proxy or direct).
 */
export async function getSchemeBySlug(slug: string): Promise<any> {
  try {
    const res = await api.get(`/schemes/${encodeURIComponent(slug)}`, { timeout: 5000 });
    return res.data;
  } catch {
    try {
      const res = await schemeApi.get(`/schemes/${encodeURIComponent(slug)}`, { timeout: 5000 });
      return res.data;
    } catch {
      return FALLBACK_SCHEMES.find((s) => s.slug === slug) || null;
    }
  }
}
