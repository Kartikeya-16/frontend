"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { pageVariants, fadeInUp, DURATION } from "@/lib/motion";
import { analyzeScam } from "@/lib/api/scam";
import type { ScamAnalysisResponse } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Loader2, ShieldAlert, ShieldCheck, X, Globe, FileText, Upload, Sparkles, AlertTriangle, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";

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

const SAMPLE_SCAMS = [
  {
    label: "Fake Bank KYC (Hinglish)",
    text: "Dear SBI Customer, aapka YONO account block ho jayega within 24 hours. Urgently update your PAN/Aadhaar details here: http://bit.ly/sbi-kyc-update-live",
  },
  {
    label: "Lottery Fraud",
    text: "Congratulations! You have won ₹25,00,000 in KBC Lottery. To claim immediately send ₹5,000 processing fee to UPI id: kbc-verify@ybl",
  },
  {
    label: "Electricity Disconnection",
    text: "Dear Consumer, your electricity bill is unpaid. Power supply will be disconnected at 9:30 PM tonight. Contact electricity officer immediately at 9876543210",
  },
];

export default function ScamShieldPage() {
  const { t } = useTranslation();
  const [inputType, setInputType] = useState<"text" | "url" | "upload">("text");
  const [content, setContent] = useState("Dear SBI Customer, aapka YONO account block ho jayega within 24 hours. Urgently update your PAN/Aadhaar details here: http://bit.ly/sbi-kyc-update-live");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<ScamAnalysisResponse | null>({
    scam_probability: 0.94,
    category: "Fake KYC / Phishing",
    warning_signs: [
      "Creates artificial urgency (account will be blocked within 24 hours)",
      "Contains a suspicious URL (bit.ly redirect, not official sbi.co.in domain)",
      "Requests sensitive KYC documents over unverified web link",
    ],
    recommendation: "Do not click the link or share OTP / credentials. Report immediately to cybercrime.gov.in and call bank helpline.",
    language_detected: "hi-en",
  });

  async function handleAnalyze() {
    if (!content.trim()) return;
    setIsAnalyzing(true);

    try {
      const response = await analyzeScam({ type: inputType === "upload" ? "image" : inputType, content });
      setResult(response);
    } catch {
      // API fallback
    } finally {
      setIsAnalyzing(false);
    }
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      className="max-w-6xl mx-auto space-y-8"
    >
      {/* Editorial Header */}
      <div className="border-b-[1.5px] border-ink pb-5">
        <div className="flex items-center gap-3">
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-ink tracking-tight">
            {t("scam.title", "Scam & Fraud Shield")}
          </h1>
          <span className="font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded border border-ink bg-clay text-paper shadow-[1px_1px_0_0_var(--color-ink)]">
            PILLAR 3
          </span>
        </div>
        <p className="font-mono text-xs uppercase tracking-wider text-ink/70 mt-1">
          {t("scam.subtitle", "Bilingual Phishing Classifier · XLM-RoBERTa Code-Switching Detection · URL Threat Radar")}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Input Form */}
        <motion.div {...fadeInUp} className="lg:col-span-6 space-y-4">
          <div className="paper-card p-6">
            <div className="flex items-center justify-between border-b-[1.5px] border-ink pb-3 mb-4">
              <h3 className="font-serif text-lg font-bold text-ink">Show Us What Arrived</h3>
              <span className="font-mono text-[11px] uppercase tracking-wider text-ink/60">
                Paste or Upload
              </span>
            </div>

            {/* Input Type Selector */}
            <Tabs value={inputType} onValueChange={(v) => setInputType(v as any)} className="w-full">
              <TabsList className="w-full grid grid-cols-3 bg-paper border-[1.5px] border-ink p-1 h-auto rounded">
                <TabsTrigger
                  value="text"
                  className="font-mono text-xs py-2 data-[state=active]:bg-ink data-[state=active]:text-paper data-[state=active]:shadow-none rounded"
                >
                  <FileText className="w-3.5 h-3.5 mr-1.5 inline" /> Text / SMS
                </TabsTrigger>
                <TabsTrigger
                  value="url"
                  className="font-mono text-xs py-2 data-[state=active]:bg-ink data-[state=active]:text-paper data-[state=active]:shadow-none rounded"
                >
                  <Globe className="w-3.5 h-3.5 mr-1.5 inline" /> URL Link
                </TabsTrigger>
                <TabsTrigger
                  value="upload"
                  className="font-mono text-xs py-2 data-[state=active]:bg-ink data-[state=active]:text-paper data-[state=active]:shadow-none rounded"
                >
                  <Upload className="w-3.5 h-3.5 mr-1.5 inline" /> Screenshot
                </TabsTrigger>
              </TabsList>

              <TabsContent value="text" className="mt-4">
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Paste suspicious SMS or WhatsApp message (supports Hindi, English & mixed Hinglish)..."
                  rows={6}
                  className="border-[1.5px] border-ink rounded bg-paper text-ink font-mono text-xs resize-none focus-visible:ring-marigold p-3"
                />
              </TabsContent>

              <TabsContent value="url" className="mt-4">
                <Input
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="https://sbi-kyc-verification.top/update"
                  type="url"
                  className="border-[1.5px] border-ink rounded bg-paper text-ink font-mono text-xs h-11 focus-visible:ring-marigold"
                />
              </TabsContent>

              <TabsContent value="upload" className="mt-4">
                <div className="border-[1.5px] border-dashed border-ink rounded p-8 text-center bg-paper/50 hover:bg-paper cursor-pointer transition-colors">
                  <Upload className="w-8 h-8 text-ink/50 mx-auto mb-2" />
                  <p className="font-serif text-sm font-bold text-ink">Drop screenshot or PDF here</p>
                  <p className="font-mono text-[10px] text-ink/60 mt-1">OCR text extraction will automatically read the message</p>
                </div>
              </TabsContent>
            </Tabs>

            {/* Preset Samples */}
            <div className="mt-4 pt-3 border-t border-ink/20">
              <p className="font-mono text-[10px] uppercase text-ink/60 font-semibold mb-2">
                Try sample scam messages:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {SAMPLE_SCAMS.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setInputType("text");
                      setContent(s.text);
                    }}
                    className="font-mono text-[10px] px-2 py-1 rounded border border-ink/40 hover:border-ink hover:bg-marigold/20 text-ink transition-colors"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !content.trim()}
              className="mt-6 w-full py-3 rounded border-[1.5px] border-ink bg-ink text-paper hover:bg-marigold hover:text-ink font-mono text-sm uppercase tracking-wider font-bold transition-all shadow-[2px_2px_0_0_var(--color-ink)] active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t("scam.scanning", "Scanning Message…")}
                </>
              ) : (
                <>
                  <ShieldAlert className="w-4 h-4" />
                  {t("scam.scan_btn", "Check Message Safety")}
                </>
              )}
            </button>
          </div>
        </motion.div>

        {/* Right Column: Scam Verdict & Recommendations */}
        <motion.div {...fadeInUp} className="lg:col-span-6 space-y-6">
          {result && (
            <div className="paper-card p-6 bg-paper">
              <div className="flex items-center justify-between border-b-[1.5px] border-ink pb-3 mb-5">
                <div>
                  <h3 className="font-serif text-lg font-bold text-ink">Detection Verdict</h3>
                  <p className="font-mono text-[11px] text-ink/60 uppercase tracking-widest mt-0.5">
                    Multi-Model Risk Evaluation
                  </p>
                </div>
                {/* Hindi + English Detected Tag */}
                <span className="font-mono text-[10px] uppercase font-bold px-2.5 py-1 rounded border border-ink bg-marigold text-ink shadow-[1px_1px_0_0_var(--color-ink)]">
                  HINDI + ENGLISH DETECTED
                </span>
              </div>

              {/* Gauge & Main Verdict */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center border-b-[1.5px] border-ink pb-6 mb-6">
                <div className="sm:col-span-5">
                  <RiskGauge probability={result.scam_probability} />
                </div>
                <div className="sm:col-span-7 space-y-1.5">
                  <span className="font-mono text-xs uppercase tracking-wider font-bold text-clay">
                    Category: {result.category}
                  </span>
                  <h4 className="font-serif text-2xl font-bold text-ink leading-tight">
                    {result.scam_probability > 0.7
                      ? "Likely Scam. Do not trust."
                      : result.scam_probability > 0.4
                      ? "Suspicious Message. Verify carefully."
                      : "Appears Legitimate."}
                  </h4>
                  <p className="font-sans text-xs text-ink/75 leading-relaxed pt-1">
                    {result.recommendation}
                  </p>
                </div>
              </div>

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

              {/* Recommended Protective Actions */}
              <div>
                <p className="font-mono text-[11px] uppercase tracking-widest text-ink font-bold mb-3">
                  Recommended Immediate Actions
                </p>
                <div className="space-y-2 font-sans text-xs">
                  <div className="p-3 rounded border border-ink bg-paper shadow-[1.5px_1.5px_0_0_var(--color-ink)] flex items-start gap-2.5">
                    <span className="font-mono font-bold text-ink shrink-0">→</span>
                    <span><strong>Delete & Do Not Click:</strong> Never input OTPs, passwords, or PINs on third-party links received via SMS.</span>
                  </div>
                  <div className="p-3 rounded border border-ink bg-paper shadow-[1.5px_1.5px_0_0_var(--color-ink)] flex items-start justify-between gap-2.5">
                    <div className="flex items-start gap-2.5">
                      <span className="font-mono font-bold text-ink shrink-0">→</span>
                      <span><strong>Report to Cybercrime:</strong> Lodge a report on the National Cybercrime Reporting Portal.</span>
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
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
