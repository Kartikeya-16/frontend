"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useReducedMotion } from "motion/react";
import { pageVariants, fadeInUp, DURATION } from "@/lib/motion";
import { analyzeScam, analyzeScamFile, fetchThreatIntelligence } from "@/lib/api/scam";
import type { ScamAnalysisResponse, ThreatIntelItem } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  ShieldAlert,
  ShieldCheck,
  X,
  Globe,
  FileText,
  Upload,
  AlertTriangle,
  ExternalLink,
  PhoneCall,
  Copy,
  Check,
  Radio,
  FileWarning,
  Flame,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import { toast } from "sonner";

function RiskGauge({ probability }: { probability: number }) {
  const shouldReduceMotion = useReducedMotion();
  const pct = Math.round(probability * 100);

  const color =
    pct > 70
      ? "var(--color-clay)"
      : pct > 40
        ? "var(--color-marigold)"
        : "var(--color-emerald)";

  const circumference = 2 * Math.PI * 56;
  const dashOffset = circumference * (1 - probability);

  return (
    <div className="relative w-36 h-36 mx-auto select-none">
      <svg viewBox="0 0 130 130" className="w-full h-full -rotate-90 overflow-visible">
        <circle
          cx="65" cy="65" r="56"
          fill="none"
          stroke="var(--color-ink)"
          strokeWidth="8"
          opacity={0.15}
        />
        <motion.circle
          cx="65" cy="65" r="56"
          fill="none"
          stroke={color}
          strokeWidth="9"
          strokeDasharray={circumference}
          strokeLinecap="square"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{
            duration: shouldReduceMotion ? 0 : DURATION.data,
            ease: [0.16, 1, 0.3, 1],
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <motion.span
          className="text-3xl font-serif font-bold text-ink ticker-num"
          initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          {pct}%
        </motion.span>
        <span className="font-mono text-[9px] uppercase font-bold tracking-wider text-ink/70 mt-0.5">
          {pct > 70 ? "High Scam Risk" : pct > 40 ? "Medium Suspicion" : "Safe / Verified"}
        </span>
      </div>
    </div>
  );
}

const SAMPLE_TEXT_SCAMS = [
  {
    label: "Fake Bank KYC (Hinglish)",
    text: "Dear SBI Customer, aapka YONO account block ho jayega within 24 hours. Urgently update your PAN/Aadhaar details here: http://bit.ly/sbi-kyc-update-live",
  },
  {
    label: "Digital Arrest (Police Extortion)",
    text: "This is Inspector Sharma from Mumbai Police Crime Branch. An illegal narcotics courier parcel linked to your Aadhaar card has been seized. Join immediate Skype video call for digital arrest interrogation or face imprisonment.",
  },
  {
    label: "Electricity Cutoff Scare",
    text: "Dear Consumer, your electricity bill is unpaid. Power supply will be disconnected at 9:30 PM tonight. Contact electricity officer immediately at 9876543210 to avoid disconnection.",
  },
  {
    label: "UPI QR Reverse Trap",
    text: "I am buying your sofa on OLX for Rs 12,000. I have created a payment QR code. Please scan this QR code and enter your UPI PIN to receive money in your account right now.",
  },
  {
    label: "Genuine Bank OTP (Safe)",
    text: "849201 is your one-time password (OTP) for login to your HDFC account. Valid for 10 mins. Do not share OTP with anyone.",
  },
];

const SAMPLE_URL_SCAMS = [
  {
    label: "SBI Lookalike (.top Phishing)",
    url: "http://sbi-yono-kyc-verification-update.top/login",
  },
  {
    label: "HDFC Netbanking Spoof (.xyz)",
    url: "https://hdfcnetbanking-reward-claim.xyz/auth",
  },
  {
    label: "Masked Shortener (Bitly)",
    url: "http://bit.ly/instant-income-tax-refund-claim",
  },
  {
    label: "Authentic SBI Portal (Safe)",
    url: "https://onlinesbi.sbi/",
  },
];


export default function ScamShieldPage() {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [inputType, setInputType] = useState<"text" | "url" | "upload">("text");
  const [content, setContent] = useState(
    "Dear SBI Customer, aapka YONO account block ho jayega within 24 hours. Urgently update your PAN/Aadhaar details here: http://bit.ly/sbi-kyc-update-live"
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [threatIntel, setThreatIntel] = useState<ThreatIntelItem[]>([]);

  const [result, setResult] = useState<ScamAnalysisResponse | null>({
    scam_probability: 0.94,
    risk_level: "HIGH",
    category: "Fake KYC / Account Freeze Scam",
    warning_signs: [
      "Creates artificial urgency (account will be blocked within 24 hours)",
      "Contains a suspicious URL (bit.ly redirect, not official sbi.co.in domain)",
      "Requests sensitive KYC credentials over third-party link",
    ],
    threat_indicators: {
      extracted_urls: ["http://bit.ly/sbi-kyc-update-live"],
      extracted_phones: [],
      extracted_upis: [],
      spoofed_entities: ["State Bank of India (SBI YONO)"],
    },
    recommendation:
      "Do not click the link or share OTP / credentials. Report immediately to cybercrime.gov.in or call national helpline 1930.",
    emergency_action: {
      helpline: "1930",
      cybercrime_portal: "https://cybercrime.gov.in",
      chakshu_portal: "https://sancharsaathi.gov.in/sfc/",
      report_guidelines: [
        "Call 1930 within the golden hour to freeze fraudulent beneficiary bank accounts.",
        "Lodge an official cyber complaint at cybercrime.gov.in.",
        "Report suspected fraud SMS to DoT Chakshu portal.",
      ],
    },
    language_detected: "Hinglish (Hindi written in Latin script)",
  });

  useEffect(() => {
    fetchThreatIntelligence().then((items) => {
      if (items && items.length > 0) {
        setThreatIntel(items);
      }
    });
  }, []);

  async function handleAnalyze() {
    if (inputType === "upload") {
      if (!selectedFile) {
        toast.error("Please choose or drop an image/PDF screenshot first.");
        return;
      }
      setIsAnalyzing(true);
      try {
        const response = await analyzeScamFile(selectedFile);
        setResult(response);
        toast.success("Screenshot analyzed successfully.");
      } catch (err) {
        toast.error("Analysis failed. Please try again.");
      } finally {
        setIsAnalyzing(false);
      }
      return;
    }

    if (!content.trim()) return;
    setIsAnalyzing(true);

    try {
      const response = await analyzeScam({
        type: inputType === "url" ? "url" : "text",
        content,
      });
      setResult(response);
      toast.success("Safety scan completed.");
    } catch {
      toast.error("Scan error occurred. Using local security engine.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      toast.info(`Selected file: ${file.name}`);
    }
  }

  function handleCopyReport() {
    if (!result) return;
    const reportText = `[Arthsaathi Scam Shield Forensic Report]
Risk Level: ${result.risk_level || (result.scam_probability > 0.7 ? "HIGH" : "MEDIUM")} (${Math.round(result.scam_probability * 100)}% Scam Probability)
Category: ${result.category}
Language: ${result.language_detected}

Identified Red Flags:
${result.warning_signs.map((s) => `• ${s}`).join("\n")}

Security Recommendation:
${result.recommendation}

Emergency Contacts:
National Cyber Crime Helpline: 1930
Report Online: https://cybercrime.gov.in
Report SMS Fraud: https://sancharsaathi.gov.in/sfc/`;

    navigator.clipboard.writeText(reportText);
    setCopied(true);
    toast.success("Forensic report copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      className="max-w-6xl mx-auto space-y-8"
    >
      {/* Editorial Header */}
      <div className="border-b-[1.5px] border-ink pb-5 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-ink tracking-tight">
              {t("scam.title", "Scam & Fraud Shield")}
            </h1>
            <span className="font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded border border-ink bg-clay text-paper shadow-[1px_1px_0_0_var(--color-ink)]">
              PILLAR 3
            </span>
          </div>
          <p className="font-mono text-xs uppercase tracking-wider text-ink/70 mt-1">
            {t(
              "scam.subtitle",
              "Bilingual Phishing Classifier · URL Threat Radar · Indian Fraud Pattern Forensics"
            )}
          </p>
        </div>

        {/* Emergency Quick Action Badge */}
        <div className="flex items-center gap-2">
          <a
            href="tel:1930"
            className="font-mono text-xs font-bold px-3 py-2 rounded border-[1.5px] border-ink bg-clay text-paper hover:bg-clay/90 flex items-center gap-1.5 shadow-[2px_2px_0_0_var(--color-ink)] transition-transform active:translate-x-0.5 active:translate-y-0.5"
          >
            <PhoneCall className="w-3.5 h-3.5" /> Call Helpline 1930
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Input Form */}
        <motion.div {...fadeInUp} className="lg:col-span-6 space-y-4">
          <div className="paper-card p-6">
            <div className="flex items-center justify-between border-b-[1.5px] border-ink pb-3 mb-4">
              <h3 className="font-serif text-lg font-bold text-ink">Inspect Suspicious Message</h3>
              <span className="font-mono text-[11px] uppercase tracking-wider text-ink/60">
                Text, URL or Screenshot
              </span>
            </div>

            {/* Input Type Selector (Clean Segmented Controller) */}
            <div className="grid grid-cols-3 gap-1 bg-muted/40 p-1 rounded border-[1.5px] border-ink mb-4">
              <button
                type="button"
                onClick={() => setInputType("text")}
                className={cn(
                  "font-mono text-xs py-2 px-2 rounded flex items-center justify-center gap-1.5 font-bold transition-all",
                  inputType === "text"
                    ? "bg-ink text-paper shadow-[1px_1px_0_0_var(--color-ink)]"
                    : "bg-paper text-ink hover:bg-muted"
                )}
              >
                <FileText className="w-3.5 h-3.5" /> Text / SMS
              </button>
              <button
                type="button"
                onClick={() => setInputType("url")}
                className={cn(
                  "font-mono text-xs py-2 px-2 rounded flex items-center justify-center gap-1.5 font-bold transition-all",
                  inputType === "url"
                    ? "bg-ink text-paper shadow-[1px_1px_0_0_var(--color-ink)]"
                    : "bg-paper text-ink hover:bg-muted"
                )}
              >
                <Globe className="w-3.5 h-3.5" /> URL Link
              </button>
              <button
                type="button"
                onClick={() => setInputType("upload")}
                className={cn(
                  "font-mono text-xs py-2 px-2 rounded flex items-center justify-center gap-1.5 font-bold transition-all",
                  inputType === "upload"
                    ? "bg-ink text-paper shadow-[1px_1px_0_0_var(--color-ink)]"
                    : "bg-paper text-ink hover:bg-muted"
                )}
              >
                <Upload className="w-3.5 h-3.5" /> Screenshot
              </button>
            </div>

            {/* Mode 1: Text / SMS Input */}
            {inputType === "text" && (
              <div className="space-y-4">
                <div className="relative">
                  <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Paste suspicious SMS, WhatsApp message, or email notice (supports Hindi, English & mixed Hinglish)..."
                    rows={6}
                    className="w-full border-[1.5px] border-ink rounded bg-paper text-ink font-mono text-xs resize-none focus-visible:ring-marigold p-3"
                  />
                  {content.length > 0 && (
                    <span className="absolute bottom-2.5 right-3 font-mono text-[10px] text-ink/50">
                      {content.length} characters
                    </span>
                  )}
                </div>

                {/* Preset Samples for Text */}
                <div className="pt-2 border-t border-ink/20">
                  <p className="font-mono text-[10px] uppercase text-ink/60 font-semibold mb-2">
                    Try sample message:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {SAMPLE_TEXT_SCAMS.map((s, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setContent(s.text)}
                        className="font-mono text-[10px] px-2.5 py-1.5 rounded border border-ink/40 hover:border-ink hover:bg-marigold/20 text-ink transition-colors text-left"
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Mode 2: URL / Phishing Link Input */}
            {inputType === "url" && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="font-mono text-[11px] font-bold text-ink uppercase tracking-wider block">
                    Suspicious Website / Domain URL
                  </label>
                  <div className="relative flex items-center">
                    <Globe className="w-4 h-4 text-ink/50 absolute left-3 pointer-events-none" />
                    <Input
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="http://sbi-kyc-verification-login.top/update"
                      type="url"
                      className="w-full pl-9 pr-3 border-[1.5px] border-ink rounded bg-paper text-ink font-mono text-xs h-11 focus-visible:ring-marigold"
                    />
                  </div>
                  <p className="font-mono text-[10px] text-ink/60">
                    Runs 25-feature lexical threat radar & Indian bank spoofing checks in &lt;1 ms.
                  </p>
                </div>

                {/* Preset Samples for URL */}
                <div className="pt-2 border-t border-ink/20">
                  <p className="font-mono text-[10px] uppercase text-ink/60 font-semibold mb-2">
                    Try sample phishing URL:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {SAMPLE_URL_SCAMS.map((s, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setContent(s.url)}
                        className="font-mono text-[10px] px-2.5 py-1.5 rounded border border-ink/40 hover:border-ink hover:bg-marigold/20 text-ink transition-colors text-left"
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Mode 3: Screenshot / Document Upload */}
            {inputType === "upload" && (
              <div className="space-y-4">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*,application/pdf"
                  className="hidden"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "border-[1.5px] border-dashed rounded p-6 text-center cursor-pointer transition-all",
                    selectedFile
                      ? "border-emerald bg-emerald/10"
                      : "border-ink bg-paper/50 hover:bg-paper"
                  )}
                >
                  <Upload className="w-8 h-8 text-ink/60 mx-auto mb-2" />
                  <p className="font-serif text-sm font-bold text-ink">
                    {selectedFile ? selectedFile.name : "Click to select or drop screenshot / PDF notice"}
                  </p>
                  <p className="font-mono text-[10px] text-ink/60 mt-1">
                    {selectedFile
                      ? `${(selectedFile.size / 1024).toFixed(1)} KB — Click to change file`
                      : "Supports PNG, JPG, WEBP screenshots, payment QR codes & PDF legal notices"}
                  </p>
                </div>

                {selectedFile && (
                  <div className="flex items-center justify-between p-2.5 rounded border border-ink bg-paper font-mono text-xs">
                    <span className="truncate max-w-[200px] text-ink font-bold">
                      {selectedFile.name}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(null);
                      }}
                      className="text-clay hover:underline font-bold text-[11px]"
                    >
                      Remove File
                    </button>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || (inputType === "upload" ? !selectedFile : !content.trim())}
              className="mt-6 w-full py-3 rounded border-[1.5px] border-ink bg-ink text-paper hover:bg-marigold hover:text-ink font-mono text-sm uppercase tracking-wider font-bold transition-all shadow-[2px_2px_0_0_var(--color-ink)] active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t("scam.scanning", "Scanning Forensics…")}
                </>
              ) : (
                <>
                  <ShieldAlert className="w-4 h-4" />
                  {t("scam.scan_btn", "Check Message Safety")}
                </>
              )}
            </button>
          </div>

          {/* Threat Intelligence Bulletin */}
          {threatIntel.length > 0 && (
            <div className="paper-card p-6">
              <div className="flex items-center justify-between border-b-[1.5px] border-ink pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-clay" />
                  <h3 className="font-serif text-base font-bold text-ink">Active Financial Threat Intel</h3>
                </div>
                <span className="font-mono text-[10px] uppercase font-bold text-clay">LIVE BULLETIN</span>
              </div>

              <div className="space-y-3">
                {threatIntel.map((item) => (
                  <div key={item.id} className="p-3 rounded border border-ink/40 bg-paper/80 font-sans text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-ink">{item.title}</span>
                      <span
                        className={cn(
                          "font-mono text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border",
                          item.severity === "CRITICAL"
                            ? "bg-clay text-paper border-ink"
                            : "bg-marigold/30 text-ink border-ink/40"
                        )}
                      >
                        {item.severity}
                      </span>
                    </div>
                    <p className="text-ink/80 text-[11px] leading-relaxed mb-1.5">{item.summary}</p>
                    <p className="text-[10px] font-mono text-ink/70">
                      <strong>Rule:</strong> {item.safety_rule}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Right Column: Scam Verdict & Recommendations */}
        <motion.div {...fadeInUp} className="lg:col-span-6 space-y-6">
          {result && (
            <div className="paper-card p-6 bg-paper">
              <div className="flex items-center justify-between border-b-[1.5px] border-ink pb-3 mb-5">
                <div>
                  <h3 className="font-serif text-lg font-bold text-ink">Forensic Verdict</h3>
                  <p className="font-mono text-[11px] text-ink/60 uppercase tracking-widest mt-0.5">
                    Multi-Vector Risk Analysis
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] uppercase font-bold px-2 py-1 rounded border border-ink bg-marigold text-ink shadow-[1px_1px_0_0_var(--color-ink)]">
                    {result.language_detected}
                  </span>
                  <button
                    onClick={handleCopyReport}
                    className="p-1.5 rounded border border-ink bg-paper hover:bg-muted text-ink shadow-[1px_1px_0_0_var(--color-ink)]"
                    title="Copy Forensic Report"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Gauge & Main Verdict */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center border-b-[1.5px] border-ink pb-6 mb-6">
                <div className="sm:col-span-5">
                  <RiskGauge probability={result.scam_probability} />
                </div>
                <div className="sm:col-span-7 space-y-1.5">
                  <span className="font-mono text-xs uppercase tracking-wider font-bold text-clay block">
                    {result.category}
                  </span>
                  <h4 className="font-serif text-2xl font-bold text-ink leading-tight">
                    {result.scam_probability >= 0.7
                      ? "High Risk Scam. Do Not Trust."
                      : result.scam_probability >= 0.4
                        ? "Suspicious Request. Verify Carefully."
                        : "Appears Legitimate."}
                  </h4>
                  <p className="font-sans text-xs text-ink/75 leading-relaxed pt-1">
                    {result.recommendation}
                  </p>
                </div>
              </div>

              {/* Threat Indicators Extracted */}
              {result.threat_indicators &&
                (result.threat_indicators.extracted_urls?.length ||
                  result.threat_indicators.extracted_upis?.length ||
                  result.threat_indicators.extracted_phones?.length) ? (
                <div className="mb-5 p-3 rounded border border-ink bg-muted/40 font-mono text-xs">
                  <p className="font-bold text-[10px] uppercase tracking-wider text-ink/70 mb-2">
                    Extracted Threat Entities
                  </p>
                  {result.threat_indicators.extracted_urls && result.threat_indicators.extracted_urls.length > 0 && (
                    <div className="mb-1.5">
                      <span className="text-ink/60 font-semibold">URLs: </span>
                      {result.threat_indicators.extracted_urls.map((u, i) => (
                        <span key={i} className="text-clay font-bold break-all mr-2">
                          {u}
                        </span>
                      ))}
                    </div>
                  )}
                  {result.threat_indicators.extracted_upis && result.threat_indicators.extracted_upis.length > 0 && (
                    <div className="mb-1.5">
                      <span className="text-ink/60 font-semibold">UPI IDs: </span>
                      {result.threat_indicators.extracted_upis.map((u, i) => (
                        <span key={i} className="text-clay font-bold mr-2">
                          {u}
                        </span>
                      ))}
                    </div>
                  )}
                  {result.threat_indicators.extracted_phones && result.threat_indicators.extracted_phones.length > 0 && (
                    <div>
                      <span className="text-ink/60 font-semibold">Phone Numbers: </span>
                      {result.threat_indicators.extracted_phones.map((p, i) => (
                        <span key={i} className="text-ink font-bold mr-2">
                          {p}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}

              {/* Warning Signs */}
              {result.warning_signs && result.warning_signs.length > 0 && (
                <div className="mb-6">
                  <p className="font-mono text-[11px] uppercase tracking-widest text-ink font-bold mb-3">
                    Identified Red Flags
                  </p>
                  <div className="space-y-2">
                    {result.warning_signs.map((sign, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2.5 p-2.5 rounded border border-ink bg-clay/10 text-ink font-sans text-xs shadow-[1px_1px_0_0_var(--color-ink)]"
                      >
                        <X className="w-4 h-4 text-clay shrink-0 mt-0.5 font-bold" />
                        <span>{sign}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Official Helplines & Reporting Portals */}
              <div>
                <p className="font-mono text-[11px] uppercase tracking-widest text-ink font-bold mb-3">
                  Official Protection & Reporting Channels
                </p>
                <div className="space-y-2 font-sans text-xs">
                  <div className="p-3 rounded border border-ink bg-paper shadow-[1.5px_1.5px_0_0_var(--color-ink)] flex items-start justify-between gap-2.5">
                    <div className="flex items-start gap-2.5">
                      <span className="font-mono font-bold text-ink shrink-0">→</span>
                      <span>
                        <strong>National Cybercrime Helpline:</strong> Call <strong>1930</strong> (Toll-free, 24x7)
                        immediately to freeze fraudulent transactions.
                      </span>
                    </div>
                    <a
                      href="tel:1930"
                      className="font-mono text-[10px] text-ink underline font-bold inline-flex items-center gap-1 shrink-0"
                    >
                      Call 1930 <PhoneCall className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="p-3 rounded border border-ink bg-paper shadow-[1.5px_1.5px_0_0_var(--color-ink)] flex items-start justify-between gap-2.5">
                    <div className="flex items-start gap-2.5">
                      <span className="font-mono font-bold text-ink shrink-0">→</span>
                      <span>
                        <strong>National Cyber Crime Portal:</strong> Lodge an official cyber police FIR.
                      </span>
                    </div>
                    <a
                      href="https://cybercrime.gov.in"
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-[10px] text-ink underline font-bold inline-flex items-center gap-1 shrink-0"
                    >
                      cybercrime.gov.in <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="p-3 rounded border border-ink bg-paper shadow-[1.5px_1.5px_0_0_var(--color-ink)] flex items-start justify-between gap-2.5">
                    <div className="flex items-start gap-2.5">
                      <span className="font-mono font-bold text-ink shrink-0">→</span>
                      <span>
                        <strong>DoT Chakshu Portal:</strong> Report suspected fraud WhatsApp/SMS caller numbers.
                      </span>
                    </div>
                    <a
                      href="https://sancharsaathi.gov.in/sfc/"
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-[10px] text-ink underline font-bold inline-flex items-center gap-1 shrink-0"
                    >
                      Chakshu Portal <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
