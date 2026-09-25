"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Building2,
  Landmark,
  MapPin,
  Loader2,
  Globe,
  Share2,
} from "lucide-react";
import { toast } from "sonner";
import { getSchemeBySlug } from "@/lib/api/schemes";
import { useLanguageStore } from "@/store/language-store";
import { pageVariants, fadeInUp, staggerContainer } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { FormattedSchemeText } from "@/components/ui/formatted-scheme-text";

interface SchemeDetailProps {
  params: Promise<{ slug: string }>;
}

export default function SchemeDetailPage({ params }: SchemeDetailProps) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  const [scheme, setScheme] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkedDocs, setCheckedDocs] = useState<Record<number, boolean>>({});

  // Translation support
  const { selectedLang, supportedLanguages, translateBatch } = useLanguageStore();
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedContent, setTranslatedContent] = useState<{
    name?: string;
    benefit?: string;
    description?: string;
    eligibility?: string;
    process?: string;
  } | null>(null);
  const [isTranslatedActive, setIsTranslatedActive] = useState(false);

  useEffect(() => {
    async function fetchDetail() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getSchemeBySlug(slug);
        if (!data || data.detail) {
          setError("Scheme not found in database.");
        } else {
          setScheme(data);
        }
      } catch (err: any) {
        setError(err?.message || "Failed to load scheme details.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchDetail();
  }, [slug]);

  const parsedDocs: string[] = (() => {
    if (!scheme?.documents_required) {
      return ["Aadhaar Card", "Identity & Address Proof", "Income Certificate / Bank Passbook"];
    }
    const clean = String(scheme.documents_required)
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/\*\*/g, "")
      .trim();
    if (!clean || clean.toLowerCase() === "nan" || clean.toLowerCase() === "none") {
      return ["Aadhaar Card", "Identity & Address Proof", "Income Certificate / Bank Passbook"];
    }
    const list = clean
      .split(/\r?\n|•|;|(?<=\D)\d+[\.\)]\s+/)
      .map((s) => s.replace(/^\s*\d+[\.\)]\s*/, "").trim())
      .filter((s) => s.length > 2);

    return list.length > 0 ? list : [clean];
  })();


  const toggleDocCheck = (idx: number) => {
    setCheckedDocs((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleTranslate = async () => {
    if (isTranslatedActive) {
      setIsTranslatedActive(false);
      return;
    }
    if (selectedLang === "eng_Latn") {
      toast.info("Select a vernacular language in the sidebar first.");
      return;
    }
    if (!scheme) return;

    setIsTranslating(true);
    try {
      const texts = [
        scheme.name || "",
        scheme.benefits || "",
        scheme.description || "",
        scheme.eligibility_text || "",
        scheme.application_process || "",
      ];
      const translated = await translateBatch(texts, selectedLang, "eng_Latn");
      setTranslatedContent({
        name: translated[0] || scheme.name,
        benefit: translated[1] || scheme.benefits,
        description: translated[2] || scheme.description,
        eligibility: translated[3] || scheme.eligibility_text,
        process: translated[4] || scheme.application_process,
      });
      setIsTranslatedActive(true);
      toast.success(`Translated to ${supportedLanguages[selectedLang] || selectedLang}`);
    } catch {
      toast.error("Translation request failed.");
    } finally {
      setIsTranslating(false);
    }
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Scheme link copied to clipboard!");
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-ink" />
        <p className="font-mono text-xs uppercase tracking-wider text-ink/70">
          Fetching scheme record from Machine Learning Scheme Engine...
        </p>
      </div>
    );
  }

  if (error || !scheme) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-4 paper-card p-8">
        <h2 className="font-serif text-2xl font-bold text-ink">Scheme Not Found</h2>
        <p className="font-sans text-xs text-ink/70">
          The requested government scheme ({slug}) could not be retrieved from the database.
        </p>
        <Link
          href="/schemes"
          className="inline-flex items-center gap-2 px-4 py-2 rounded border border-ink bg-paper font-mono text-xs font-bold uppercase text-ink shadow-[2px_2px_0_0_var(--color-ink)] hover:bg-marigold transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Scheme Navigator
        </Link>
      </div>
    );
  }

  const displayName = isTranslatedActive && translatedContent?.name ? translatedContent.name : scheme.name;
  const displayBenefit = isTranslatedActive && translatedContent?.benefit ? translatedContent.benefit : scheme.benefits;
  const displayDesc = isTranslatedActive && translatedContent?.description ? translatedContent.description : scheme.description;
  const displayElig = isTranslatedActive && translatedContent?.eligibility ? translatedContent.eligibility : scheme.eligibility_text;
  const displayProc = isTranslatedActive && translatedContent?.process ? translatedContent.process : scheme.application_process;

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      className="max-w-4xl mx-auto space-y-6 pb-12"
    >
      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between border-b-[1.5px] border-ink pb-4">
        <Link
          href="/schemes"
          className="inline-flex items-center gap-1.5 font-mono text-xs font-bold uppercase text-ink hover:text-ink/70 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Scheme Navigator
        </Link>

        <div className="flex items-center gap-2">
          {selectedLang !== "eng_Latn" && (
            <button
              onClick={handleTranslate}
              disabled={isTranslating}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1 rounded border border-ink font-mono text-xs uppercase font-bold transition-all shadow-[1.5px_1.5px_0_0_var(--color-ink)]",
                isTranslatedActive
                  ? "bg-marigold text-ink"
                  : "bg-paper text-ink hover:bg-paper-light"
              )}
            >
              {isTranslating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Globe className="w-3 h-3" />}
              {isTranslatedActive ? "Original English" : `Translate (${supportedLanguages[selectedLang] || "Vernacular"})`}
            </button>
          )}

          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1 px-3 py-1 rounded border border-ink bg-paper font-mono text-xs uppercase font-bold text-ink shadow-[1.5px_1.5px_0_0_var(--color-ink)] hover:bg-paper-light"
            title="Share scheme link"
          >
            <Share2 className="w-3.5 h-3.5" /> Share
          </button>
        </div>
      </div>

      <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
        {/* Informative Loading State for Neural Translation */}
        {isTranslating && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="p-4 rounded border-2 border-ink bg-marigold/20 flex items-start gap-3 shadow-[2px_2px_0_0_var(--color-ink)]"
          >
            <Loader2 className="w-5 h-5 animate-spin text-ink shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-serif text-sm font-bold text-ink">
                Translating this page for the first time — this may take a moment
              </p>
              <p className="font-sans text-xs text-ink/80 leading-relaxed">
                Running IndicTrans2 neural translation across title, benefits, description, and eligibility criteria in a single batched request. Translations are persistently cached for instant access on your next visit.
              </p>
            </div>
          </motion.div>
        )}

        {/* Scheme Header Card */}
        <motion.div variants={fadeInUp}>
          <div className="paper-card p-6 sm:p-8 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[11px] uppercase font-bold px-2 py-0.5 rounded border border-ink bg-paper text-ink shadow-[1px_1px_0_0_var(--color-ink)]">
                {scheme.category || "General Welfare"}
              </span>
              <span className="font-mono text-[11px] uppercase font-bold px-2 py-0.5 rounded border border-ink bg-paper text-ink shadow-[1px_1px_0_0_var(--color-ink)] flex items-center gap-1">
                <MapPin className="w-3 h-3 text-ink/70" /> {scheme.state || "Central Government"}
              </span>
              {scheme.beneficiary_type && (
                <span className="font-mono text-[11px] uppercase font-bold px-2 py-0.5 rounded border border-ink/30 bg-paper/60 text-ink/80">
                  {scheme.beneficiary_type}
                </span>
              )}
            </div>

            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink leading-tight">
              {displayName}
            </h1>

            {/* Ministry & Department */}
            {(scheme.ministry || scheme.department) && (
              <div className="pt-2 border-t border-ink/15 flex flex-wrap gap-x-6 gap-y-2 text-xs font-mono text-ink/70">
                {scheme.ministry && (
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-ink/60" />
                    <strong>Ministry:</strong> {scheme.ministry}
                  </span>
                )}
                {scheme.department && (
                  <span className="flex items-center gap-1.5">
                    <Landmark className="w-3.5 h-3.5 text-ink/60" />
                    <strong>Department:</strong> {scheme.department}
                  </span>
                )}
              </div>
            )}
          </div>
        </motion.div>

        {/* Benefits Overview */}
        <motion.div variants={fadeInUp}>
          <div className="paper-card p-6 border-l-4 border-l-emerald">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-5 h-5 text-emerald" />
              <h2 className="font-serif text-lg font-bold text-ink">Scheme Benefits & Assistance</h2>
            </div>
            <FormattedSchemeText
              text={displayBenefit || "Financial and social welfare support under official government guidelines."}
              className="text-ink/90"
            />
          </div>
        </motion.div>

        {/* Scheme Description */}
        {displayDesc && (
          <motion.div variants={fadeInUp}>
            <div className="paper-card p-6">
              <h2 className="font-serif text-lg font-bold text-ink mb-3">Description & Objectives</h2>
              <FormattedSchemeText text={displayDesc} className="text-ink/80" />
            </div>
          </motion.div>
        )}

        {/* Eligibility Criteria */}
        <motion.div variants={fadeInUp}>
          <div className="paper-card p-6">
            <h2 className="font-serif text-lg font-bold text-ink mb-3">Eligibility Requirements</h2>
            {displayElig ? (
              <div className="bg-paper/60 p-4 rounded border border-ink/20">
                <FormattedSchemeText text={displayElig} className="text-ink/85" />
              </div>
            ) : (
              <p className="font-sans text-xs text-ink/70">
                Open to eligible Indian residents subject to verification by the administering department.
              </p>
            )}

            {/* Demographic Parameters Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-ink/15 font-mono text-xs">
              <div className="p-2.5 rounded border border-ink/20 bg-paper">
                <span className="text-ink/60 text-[10px] uppercase block">Target Gender</span>
                <strong className="text-ink capitalize">{scheme.eligibility_gender || "All"}</strong>
              </div>
              <div className="p-2.5 rounded border border-ink/20 bg-paper">
                <span className="text-ink/60 text-[10px] uppercase block">Age Limit</span>
                <strong className="text-ink">
                  {scheme.eligibility_age_min || scheme.eligibility_age_max
                    ? `${scheme.eligibility_age_min || 0} - ${scheme.eligibility_age_max || "No Max"} yrs`
                    : "No age restriction"}
                </strong>
              </div>
              <div className="p-2.5 rounded border border-ink/20 bg-paper">
                <span className="text-ink/60 text-[10px] uppercase block">Area Type</span>
                <strong className="text-ink capitalize">{scheme.eligibility_residence || "Both (Urban/Rural)"}</strong>
              </div>
              <div className="p-2.5 rounded border border-ink/20 bg-paper">
                <span className="text-ink/60 text-[10px] uppercase block">Income Cap</span>
                <strong className="text-ink">
                  {scheme.eligibility_income_max ? `₹${Number(scheme.eligibility_income_max).toLocaleString("en-IN")}/yr` : "No limit"}
                </strong>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Interactive Documents Checklist */}
        <motion.div variants={fadeInUp}>
          <div className="paper-card p-6">
            <div className="flex items-center justify-between border-b-[1.5px] border-ink pb-3 mb-4">
              <div>
                <h2 className="font-serif text-lg font-bold text-ink">Required Documents Checklist</h2>
                <p className="font-mono text-[11px] text-ink/60 uppercase tracking-wider mt-0.5">
                  Check off documents as you prepare your application dossier
                </p>
              </div>
              <span className="font-mono text-xs font-bold text-emerald">
                {Object.values(checkedDocs).filter(Boolean).length} / {parsedDocs.length} Ready
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {parsedDocs.map((doc, idx) => {
                const isChecked = !!checkedDocs[idx];
                return (
                  <div
                    key={idx}
                    onClick={() => toggleDocCheck(idx)}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded border cursor-pointer transition-all select-none",
                      isChecked
                        ? "border-emerald bg-emerald/10 shadow-[1.5px_1.5px_0_0_var(--color-emerald)]"
                        : "border-ink/30 bg-paper hover:border-ink shadow-[1px_1px_0_0_var(--color-ink)]"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="mt-0.5 rounded border-ink text-emerald focus:ring-emerald cursor-pointer"
                    />
                    <div className="flex-1">
                      <p className={cn("font-sans text-xs leading-relaxed", isChecked ? "font-semibold text-ink line-through opacity-80" : "text-ink")}>
                        {doc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Application Process & Official Links */}
        <motion.div variants={fadeInUp}>
          <div className="paper-card p-6 space-y-4">
            <h2 className="font-serif text-lg font-bold text-ink">How to Apply</h2>

            {displayProc ? (
              <div className="bg-paper/60 p-4 rounded border border-ink/20">
                <FormattedSchemeText text={displayProc} className="text-ink/85" />
              </div>
            ) : (
              <p className="font-sans text-xs text-ink/75 leading-relaxed">
                Applications can be submitted via the official department portal or physically through your district Common Service Centre (CSC).
              </p>
            )}


            {/* Official Action Buttons */}
            <div className="pt-4 border-t border-ink/15 flex flex-wrap gap-3">
              {(scheme.apply_url_clean || scheme.apply_url) && (
                <a
                  href={scheme.apply_url_clean || scheme.apply_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded border border-ink bg-emerald text-paper font-mono text-xs font-bold uppercase shadow-[2px_2px_0_0_var(--color-ink)] hover:bg-emerald/90 active:translate-x-[1px] active:translate-y-[1px]"
                >
                  Apply on Official Portal <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}

              {(scheme.official_url || scheme.apply_url) && (
                <a
                  href={scheme.official_url || scheme.apply_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded border border-ink bg-paper text-ink font-mono text-xs font-bold uppercase shadow-[2px_2px_0_0_var(--color-ink)] hover:bg-marigold active:translate-x-[1px] active:translate-y-[1px]"
                >
                  MyScheme Information Page <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
