import type { ScamAnalysisRequest, ScamAnalysisResponse } from "@/lib/types";

/**
 * Mock scam analysis — returns realistic sample data.
 * The real scam classifier backend hasn't been integrated yet
 * (ML-service-2 is currently a translation service).
 *
 * Swap this for a real API call when the scam endpoint is ready.
 */
export async function analyzeScam(data: ScamAnalysisRequest): Promise<ScamAnalysisResponse> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1200));

  const content = data.content.toLowerCase();

  // Simulate detection based on common scam patterns
  const isLikelyScam =
    content.includes("kyc") ||
    content.includes("otp") ||
    content.includes("block") ||
    content.includes("verify") ||
    content.includes("prize") ||
    content.includes("lottery") ||
    content.includes("crore") ||
    content.includes("click") ||
    content.includes("aapka") ||
    content.includes("turant");

  const hasHindi =
    content.includes("aapka") ||
    content.includes("karo") ||
    content.includes("abhi") ||
    content.includes("jayega") ||
    content.includes("turant") ||
    content.includes("kare");

  if (isLikelyScam) {
    return {
      scam_probability: 0.88 + Math.random() * 0.1,
      category: content.includes("kyc")
        ? "Fake KYC / Phishing"
        : content.includes("lottery") || content.includes("prize")
          ? "Lottery / Prize Scam"
          : "Phishing / Social Engineering",
      warning_signs: [
        "Creates artificial urgency",
        "Asks for personal/financial information",
        data.type === "url"
          ? "Suspicious URL — does not match the official domain"
          : "Contains deceptive call-to-action",
        "Uses threatening language about account access",
      ],
      recommendation:
        "Do not click any links or share personal details. Report this message to cybercrime.gov.in or call helpline 1930.",
      language_detected: hasHindi ? "Hindi + English (code-mixed)" : "English",
    };
  }

  return {
    scam_probability: 0.05 + Math.random() * 0.15,
    category: "Legitimate",
    warning_signs: [],
    recommendation: "This message appears to be safe, but always verify the sender independently.",
    language_detected: hasHindi ? "Hindi + English (code-mixed)" : "English",
  };
}
