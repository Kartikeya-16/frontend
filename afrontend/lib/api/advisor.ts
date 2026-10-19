import { api } from "./client";
import type {
  QuestionnaireResponse,
  AdvisorMetaResponse,
  ProfileDraftResponse,
  AdvisorProfile,
  AdvisorPlan,
} from "@/lib/types";

/**
 * Fetch the 5 risk questionnaire questions from the advisor service proxy.
 */
export async function getQuestionnaire(): Promise<QuestionnaireResponse> {
  const res = await api.get<QuestionnaireResponse>("/advisor/questionnaire");
  return res.data;
}

/**
 * Fetch reference metadata, assumptions, and data freshness.
 */
export async function getAdvisorMeta(): Promise<AdvisorMetaResponse> {
  const res = await api.get<AdvisorMetaResponse>("/advisor/meta");
  return res.data;
}

/**
 * Build a profile draft from the logged-in user's Financial Twin.
 * May reject with 404 if the user has not created a twin.
 */
export async function getProfileDraft(): Promise<ProfileDraftResponse> {
  const res = await api.get<ProfileDraftResponse>("/advisor/profile-draft");
  return res.data;
}

/**
 * Submit financial profile and questionnaire answers to generate a prioritized plan.
 */
export async function createPlan(profile: AdvisorProfile): Promise<AdvisorPlan> {
  const res = await api.post<AdvisorPlan>("/advisor/plan", profile);
  return res.data;
}
