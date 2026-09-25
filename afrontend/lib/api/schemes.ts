import { api, schemeApi } from "./client";
import type { SchemeUserProfile, SchemeMatchResponse } from "@/lib/types";

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
      profile
    );
    return res.data;
  } catch {
    const resDirect = await schemeApi.post<SchemeMatchResponse>(
      `/schemes/match?limit=${limit}`,
      profile
    );
    return resDirect.data;
  }
}

/**
 * Retrieves single scheme full details by unique slug from scheme-service-1 (via proxy or direct).
 */
export async function getSchemeBySlug(slug: string): Promise<any> {
  try {
    const res = await api.get(`/schemes/${encodeURIComponent(slug)}`);
    return res.data;
  } catch {
    const res = await schemeApi.get(`/schemes/${encodeURIComponent(slug)}`);
    return res.data;
  }
}
