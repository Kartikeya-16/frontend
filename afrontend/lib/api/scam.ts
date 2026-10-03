import { api } from "./client";
import type { ScamAnalysisRequest, ScamAnalysisResponse, ThreatIntelItem } from "@/lib/types";

/**
 * Client-side heuristic fallback when backend is unreachable.
 */
function localAnalyzeScam(data: ScamAnalysisRequest): ScamAnalysisResponse {
  const content = data.content.toLowerCase();

  const isKyc = content.includes("kyc") || content.includes("pan") || content.includes("yono") || content.includes("aadhaar") || content.includes("blocked") || content.includes("freeze");
  const isElectricity = content.includes("electricity") || content.includes("power") || content.includes("bijli") || content.includes("disconnect") || content.includes("9:30 pm");
  const isJob = content.includes("youtube like") || content.includes("part time") || content.includes("earn 5000") || content.includes("telegram") || content.includes("prepaid task");
  const isDigitalArrest = content.includes("cbi") || content.includes("police") || content.includes("drugs") || content.includes("parcel") || content.includes("arrest") || content.includes("customs");
  const isLottery = content.includes("lottery") || content.includes("kbc") || content.includes("prize") || content.includes("won 25") || content.includes("winner");
  const isUpi = content.includes("scan qr to receive") || content.includes("enter pin to receive") || content.includes("scan this qr") || content.includes("scan qr") || content.includes("upi");

  const hasHindi =
    content.includes("aapka") ||
    content.includes("karo") ||
    content.includes("abhi") ||
    content.includes("jayega") ||
    content.includes("turant") ||
    content.includes("kare") ||
    content.includes("bijli") ||
    content.includes("khata");

  if (isDigitalArrest) {
    return {
      scam_probability: 0.96,
      risk_level: "HIGH",
      category: "Digital Arrest / Law Enforcement Impersonation",
      warning_signs: [
        "High-Severity Threat: Fraudsters pose as Police / CBI / Customs alleging illegal courier parcels.",
        "Demands video call interrogation or funds transfer to avoid 'arrest'.",
        "Police and Indian courts NEVER issue digital arrest warrants over Skype/WhatsApp."
      ],
      recommendation: "Disconnect immediately. Do not transfer any money. Report directly to National Cybercrime Helpline 1930.",
      emergency_action: {
        helpline: "1930",
        cybercrime_portal: "https://cybercrime.gov.in",
        chakshu_portal: "https://sancharsaathi.gov.in/sfc/",
        report_guidelines: [
          "Call 1930 immediately to report the caller's number.",
          "File a formal report on cybercrime.gov.in under 'Financial Fraud'."
        ]
      },
      language_detected: hasHindi ? "Hindi + English (Hinglish)" : "English",
    };
  }

  if (isElectricity) {
    return {
      scam_probability: 0.92,
      risk_level: "HIGH",
      category: "Utility Bill Disconnection Threat",
      warning_signs: [
        "Sudden power disconnection threat (often mentioning 9:30 PM tonight).",
        "Instructs to call a personal 10-digit mobile number instead of official electricity board discom.",
        "Official discoms never send disconnection SMS from personal phone numbers."
      ],
      recommendation: "Do not call the number or click any link. Check your electricity bill status exclusively through your official discom portal or electricity app.",
      emergency_action: {
        helpline: "1930",
        cybercrime_portal: "https://cybercrime.gov.in",
        chakshu_portal: "https://sancharsaathi.gov.in/sfc/",
        report_guidelines: [
          "Report the scam SMS on the DoT Chakshu portal (sancharsaathi.gov.in)."
        ]
      },
      language_detected: hasHindi ? "Hindi + English (Hinglish)" : "English",
    };
  }

  if (isKyc || content.includes("bit.ly") || content.includes(".top") || content.includes(".xyz")) {
    return {
      scam_probability: 0.94,
      risk_level: "HIGH",
      category: "Fake KYC / Account Freeze Scam",
      warning_signs: [
        "Creates artificial urgency claiming your bank account or SIM will be blocked within 24 hours.",
        "Contains a suspicious unverified URL or shortened redirect link.",
        "Requests sensitive credentials, Aadhaar, or PAN updates over third-party link."
      ],
      recommendation: "Never share OTP, passwords, or KYC documents over SMS links. Log in only via your bank official website or certified mobile banking app.",
      emergency_action: {
        helpline: "1930",
        cybercrime_portal: "https://cybercrime.gov.in",
        chakshu_portal: "https://sancharsaathi.gov.in/sfc/",
        report_guidelines: [
          "Call 1930 and inform your bank's fraud control department."
        ]
      },
      language_detected: hasHindi ? "Hindi + English (Hinglish)" : "English",
    };
  }

  if (isJob) {
    return {
      scam_probability: 0.90,
      risk_level: "HIGH",
      category: "Task / Part-Time Job Scam",
      warning_signs: [
        "Promises ₹3,000–₹10,000 daily earnings for liking videos or posting hotel ratings.",
        "Directs communication to encrypted Telegram channels.",
        "Demands upfront security deposits or 'prepaid tasks' before allowing payouts."
      ],
      recommendation: "Refuse prepaid recharge tasks. Genuine corporate employers never ask job applicants to pay advance fees.",
      emergency_action: {
        helpline: "1930",
        cybercrime_portal: "https://cybercrime.gov.in",
        chakshu_portal: "https://sancharsaathi.gov.in/sfc/",
        report_guidelines: ["Block and report the Telegram/WhatsApp numbers on cybercrime.gov.in."]
      },
      language_detected: hasHindi ? "Hindi + English (Hinglish)" : "English",
    };
  }

  if (isLottery) {
    return {
      scam_probability: 0.88,
      risk_level: "HIGH",
      category: "Lottery / Prize Reward Fraud",
      warning_signs: [
        "Unsolicited claim of winning multi-lakh lottery without entering.",
        "Requires advance processing fee or tax deposit sent via UPI."
      ],
      recommendation: "Do not send processing charges. Genuine lotteries never demand advance transfer into personal accounts.",
      emergency_action: {
        helpline: "1930",
        cybercrime_portal: "https://cybercrime.gov.in",
        chakshu_portal: "https://sancharsaathi.gov.in/sfc/",
        report_guidelines: ["Report fraudulent UPI handles to NPCI and cybercrime.gov.in."]
      },
      language_detected: hasHindi ? "Hindi + English (Hinglish)" : "English",
    };
  }

  if (isUpi) {
    return {
      scam_probability: 0.85,
      risk_level: "HIGH",
      category: "UPI Reverse Payment / QR Code Fraud",
      warning_signs: [
        "Claims that scanning a QR code or entering your PIN will credit money to your account.",
        "CRITICAL: Scanning QR code or entering UPI PIN only DEBITS money from your bank account."
      ],
      recommendation: "Never scan QR codes or enter UPI PINs to receive money. Receiving funds requires zero PIN input.",
      emergency_action: {
        helpline: "1930",
        cybercrime_portal: "https://cybercrime.gov.in",
        chakshu_portal: "https://sancharsaathi.gov.in/sfc/",
        report_guidelines: ["Call 1930 immediately to freeze fraudulent beneficiary transactions."]
      },
      language_detected: hasHindi ? "Hindi + English (Hinglish)" : "English",
    };
  }

  return {
    scam_probability: 0.08,
    risk_level: "SAFE",
    category: "Legitimate / Verified",
    warning_signs: [],
    recommendation: "No high-risk phishing or extortion patterns were detected. Always remain vigilant with personal credentials.",
    emergency_action: {
      helpline: "1930",
      cybercrime_portal: "https://cybercrime.gov.in",
      chakshu_portal: "https://sancharsaathi.gov.in/sfc/",
      report_guidelines: ["National Cyber Crime Helpline: 1930 (Toll-Free, 24x7)"]
    },
    language_detected: hasHindi ? "Hindi + English (Hinglish)" : "English",
  };
}

/**
 * Analyzes SMS, message text, or URL links through the backend scam shield endpoint.
 */
export async function analyzeScam(data: ScamAnalysisRequest): Promise<ScamAnalysisResponse> {
  try {
    const res = await api.post<ScamAnalysisResponse>("/scam/analyze", data, { timeout: 6000 });
    if (res.data) {
      return res.data;
    }
  } catch (err) {
    console.warn("Backend /scam/analyze endpoint unavailable, using local intelligent engine fallback:", err);
  }
  return localAnalyzeScam(data);
}

/**
 * Uploads screenshot or PDF document for OCR text extraction and scam inspection.
 */
export async function analyzeScamFile(file: File): Promise<ScamAnalysisResponse> {
  try {
    const formData = new FormData();
    formData.append("file", file);
    const res = await api.post<ScamAnalysisResponse>("/scam/analyze-file", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 10000,
    });
    if (res.data) {
      return res.data;
    }
  } catch (err) {
    console.warn("Backend /scam/analyze-file endpoint unavailable, using fallback:", err);
  }
  return localAnalyzeScam({
    type: "image",
    content: file.name,
  });
}

/**
 * Fetches real-time active financial scam bulletin in India.
 */
export async function fetchThreatIntelligence(): Promise<ThreatIntelItem[]> {
  try {
    const res = await api.get<{ status: string; threats: ThreatIntelItem[] }>("/scam/threat-intel", { timeout: 5000 });
    if (res.data?.threats) {
      return res.data.threats;
    }
  } catch (err) {
    console.warn("Could not fetch live threat intelligence from backend:", err);
  }

  return [
    {
      id: "threat-1",
      title: "Digital Arrest & Fake CBI/Police Extortion",
      severity: "CRITICAL",
      summary: "Fraudsters pose as law enforcement officers claiming your Aadhaar is linked to narcotics parcels sent via FedEx/Customs, coercing video-call 'digital arrest'.",
      safety_rule: "Indian Police / CBI never conduct arrests on video calls or demand funds transfer for verification."
    },
    {
      id: "threat-2",
      title: "Part-Time Video Like / Telegram Task Fraud",
      severity: "HIGH",
      summary: "Victims earn small rewards initially, then get coerced into depositing ₹50,000–₹5,00,000 into 'VIP prepaid tasks' with locked withdrawals.",
      safety_rule: "Never pay upfront security deposits or recharge fees to unlock earned task wages."
    },
    {
      id: "threat-3",
      title: "Urgent Electricity Disconnection Notice",
      severity: "HIGH",
      summary: "SMS sent from personal 10-digit numbers stating electricity power supply will be cut off at 9:30 PM tonight due to unpaid bills.",
      safety_rule: "Power discoms never send sudden cutoff warnings from individual mobile numbers."
    },
    {
      id: "threat-4",
      title: "UPI Reverse Payment / QR Code Trap",
      severity: "MEDIUM",
      summary: "Scammers on marketplaces send QR codes claiming 'Scan this code to receive your product payment'.",
      safety_rule: "Scanning a QR code or entering your UPI PIN always DEBITS money from your account."
    }
  ];
}
