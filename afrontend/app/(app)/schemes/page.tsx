"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { pageVariants, fadeInUp, staggerContainer } from "@/lib/motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Landmark,
  FileCheck,
  Search,
  Sparkles,
  SlidersHorizontal,
  Loader2,
  Globe,
  User,
  Filter,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useTwinStore } from "@/store/twin-store";
import { useLanguageStore } from "@/store/language-store";
import { useTranslation } from "@/lib/i18n";
import { matchSchemes } from "@/lib/api/schemes";
import type { SchemeUserProfile, MatchedScheme } from "@/lib/types";
import { FormattedSchemeText } from "@/components/ui/formatted-scheme-text";

interface SchemeDisplayItem {
  id: string;
  slug: string;
  scheme_name: string;
  eligible: boolean;
  matchScore?: number;
  matchConfidence?: "high" | "medium" | "low";
  matchedCriteria?: string[];
  benefit: string;
  description?: string;
  documents_needed: string[];
  how_to_apply: string;
  deadline: string;
  category: string;
  state?: string;
  link?: string;
  official_url?: string;
  ministry?: string;
  department?: string;
}

function parseDocumentsList(docStr?: string | null): string[] {
  if (!docStr) {
    return ["Aadhaar Card", "Identity & Address Proof", "Income Certificate / Bank Passbook"];
  }
  const clean = String(docStr)
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
}

function cleanHtmlText(text?: string | null): string {
  if (!text) return "";
  return text
    .replace(/&lt;br\s*\/?&gt;|<br\s*\/?>/gi, " ")
    .replace(/&amp;amp;/g, "&")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const CATEGORIES = ["All", "Business", "Education", "Health", "Housing", "Income", "Services"];
const STATES = [
  "Central",
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
  "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim",
  "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand",
  "West Bengal", "Delhi", "Chandigarh", "Puducherry", "Jammu & Kashmir",
  "Ladakh", "Andaman & Nicobar", "Dadra & Nagar Haveli", "Lakshadweep",
];

function getInitialDemographics() {
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem("arthsaathi_user_demographics");
      if (saved) return JSON.parse(saved);
    } catch {}
  }
  return null;
}

export default function SchemesPage() {
  const { t } = useTranslation();
  const profile = useTwinStore((s) => s.profile);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [liveSchemes, setLiveSchemes] = useState<SchemeDisplayItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiveMatched, setIsLiveMatched] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Dynamic user profile demographics for scheme matching - synchronously seeded from localStorage
  const initialDemo = useMemo(() => getInitialDemographics(), []);
  const [gender, setGender] = useState<"female" | "male" | "transgender">(initialDemo?.gender || "female");
  const [residence, setResidence] = useState<"urban" | "rural">(initialDemo?.residence || "urban");
  const [caste, setCaste] = useState<"General" | "OBC" | "SC" | "ST" | "PVTG" | "DNT">(initialDemo?.caste || "General");
  const [stateName, setStateName] = useState(initialDemo?.state || profile?.state || "Maharashtra");
  const [ageNum, setAgeNum] = useState(Number(initialDemo?.age) || profile?.age || 28);
  const [annualIncome, setAnnualIncome] = useState<number>(
    initialDemo?.annual_income !== undefined
      ? Number(initialDemo.annual_income)
      : profile?.monthly_income
      ? Number(profile.monthly_income) * 12
      : 300000
  );
  const [isStudent, setIsStudent] = useState(
    initialDemo?.is_student !== undefined
      ? initialDemo.is_student
      : profile?.occupation_type === "STUDENT"
  );
  const [isDisability, setIsDisability] = useState(initialDemo?.disability || false);
  const [isMinority, setIsMinority] = useState(initialDemo?.minority || false);
  const [isBpl, setIsBpl] = useState(
    initialDemo?.bpl !== undefined
      ? initialDemo.bpl
      : (initialDemo?.annual_income ? Number(initialDemo.annual_income) < 120000 : false)
  );
  const [forFamily, setForFamily] = useState(
    initialDemo?.dependents_count
      ? initialDemo.dependents_count > 0
      : profile?.dependents_count
      ? profile.dependents_count > 0
      : false
  );

  // Sync state if profile loads asynchronously and localStorage was empty
  useEffect(() => {
    if (profile) {
      if (!initialDemo?.state && profile.state) setStateName(profile.state);
      if (!initialDemo?.age && profile.age) setAgeNum(profile.age);
      if (initialDemo?.annual_income === undefined && profile.monthly_income) {
        setAnnualIncome(Number(profile.monthly_income) * 12);
      }
      if (initialDemo?.is_student === undefined && profile.occupation_type) {
        setIsStudent(profile.occupation_type === "STUDENT");
      }
      if (initialDemo?.dependents_count === undefined && profile.dependents_count !== undefined) {
        setForFamily(profile.dependents_count > 0);
      }
    }
  }, [profile, initialDemo]);

  // Translation integration with ml-service-2-translation
  const { selectedLang, translateBatch, supportedLanguages, isServiceConnected, checkHealth } = useLanguageStore();
  const [translatedMap, setTranslatedMap] = useState<Record<string, { name: string; benefit: string }>>({});
  const [isTranslatingAll, setIsTranslatingAll] = useState(false);
  const [isTranslatedActive, setIsTranslatedActive] = useState(false);

  // Check translation microservice health on mount
  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  // Fetch live matched schemes from backend microservice
  const loadMatchedSchemes = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const computedBpl = isBpl || annualIncome < 120000;
      const userPayload: SchemeUserProfile = {
        gender,
        age: Number(ageNum) || 28,
        state: stateName || "Central",
        residence,
        caste,
        disability: isDisability,
        minority: isMinority,
        is_student: isStudent,
        bpl: computedBpl,
        annual_income: annualIncome,
        applying_for_family: forFamily,
        occupation: initialDemo?.occupation || profile?.occupation,
        occupation_type: initialDemo?.occupation_type || profile?.occupation_type,
      };

      const res = await matchSchemes(userPayload, 30);
      if (res?.results && res.results.length > 0) {
        const mapped: SchemeDisplayItem[] = res.results.map((item: MatchedScheme) => {
          return {
            id: item.slug,
            slug: item.slug,
            scheme_name: item.name,
            eligible: item.match_score >= 50,
            matchScore: Math.round(item.match_score),
            matchConfidence: item.match_confidence,
            matchedCriteria: item.matched_criteria || [],
            benefit: cleanHtmlText(item.benefits) || cleanHtmlText(item.description) || "Subsidized government welfare benefit.",
            description: cleanHtmlText(item.description),
            documents_needed: parseDocumentsList(item.documents_required),
            how_to_apply:
              cleanHtmlText(item.application_process) && cleanHtmlText(item.application_process).length > 10
                ? cleanHtmlText(item.application_process)
                : item.apply_url
                ? `Visit the official scheme portal at ${item.apply_url} or register via your district CSC center.`
                : "Submit application via National Government Services Portal (services.india.gov.in) or nearest Common Service Centre.",
            deadline: "Continuous active scheme",
            category: item.category || "Services",
            state: item.state,
            link: item.apply_url || item.official_url || undefined,
            official_url: item.official_url || undefined,
            ministry: item.ministry || undefined,
            department: item.department || undefined,
          };
        });

        setLiveSchemes(mapped);
        setIsLiveMatched(true);
      } else {
        setLiveSchemes([]);
        setIsLiveMatched(false);
      }
    } catch (err: any) {
      console.error("Scheme microservice error:", err);
      setFetchError(err?.message || "Failed to fetch live schemes from backend microservice.");
      setIsLiveMatched(false);
    } finally {
      setIsLoading(false);
    }
  }, [gender, ageNum, stateName, residence, caste, isDisability, isMinority, isStudent, isBpl, annualIncome, forFamily]);

  useEffect(() => {
    loadMatchedSchemes();
  }, [loadMatchedSchemes]);

  async function handleToggleTranslation() {
    if (isTranslatedActive) {
      setIsTranslatedActive(false);
      return;
    }

    if (selectedLang === "eng_Latn") {
      toast.info("Select an Indian vernacular language in the sidebar first to translate.");
      return;
    }

    if (liveSchemes.length === 0) {
      toast.info("No schemes available to translate.");
      return;
    }

    setIsTranslatingAll(true);
    try {
      const names = liveSchemes.map((s) => s.scheme_name);
      const benefits = liveSchemes.map((s) => s.benefit);
      const allTexts = [...names, ...benefits];

      const translated = await translateBatch(allTexts, selectedLang, "eng_Latn");
      const half = liveSchemes.length;
      const transNames = translated.slice(0, half);
      const transBenefits = translated.slice(half);

      const mapping: Record<string, { name: string; benefit: string }> = {};
      liveSchemes.forEach((s, i) => {
        mapping[s.id] = {
          name: transNames[i] || s.scheme_name,
          benefit: transBenefits[i] || s.benefit,
        };
      });

      setTranslatedMap(mapping);
      setIsTranslatedActive(true);
      toast.success(`Schemes translated to ${supportedLanguages[selectedLang] || selectedLang}`);
    } catch {
      toast.error("Translation request failed.");
    } finally {
      setIsTranslatingAll(false);
    }
  }

  const filteredSchemes = useMemo(() => {
    return liveSchemes.filter((s) => {
      const matchesCategory =
        activeCategory === "All" ||
        s.category.toLowerCase().includes(activeCategory.toLowerCase()) ||
        activeCategory.toLowerCase().includes(s.category.toLowerCase());

      const query = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !query ||
        s.scheme_name.toLowerCase().includes(query) ||
        s.benefit.toLowerCase().includes(query) ||
        (s.description && s.description.toLowerCase().includes(query));

      return matchesCategory && matchesQuery;
    });
  }, [liveSchemes, activeCategory, searchQuery]);

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      className="max-w-6xl mx-auto space-y-8"
    >
      {/* Editorial Header */}
      <div className="border-b-[1.5px] border-ink pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-ink tracking-tight">
                {t("schemes.title", "Government Scheme Navigator")}
              </h1>
              <span className="font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded border border-ink bg-emerald text-paper shadow-[1px_1px_0_0_var(--color-ink)]">
                PILLAR 4
              </span>
            </div>
            <p className="font-mono text-xs uppercase tracking-wider text-ink/70 mt-1">
              {t("schemes.subtitle", "Content-Based Filtering & Eligibility Engine Against 4,800+ Live Schemes")}
            </p>
          </div>

          {/* Demographic Status Badge */}
          <div className="flex items-center gap-2 p-2.5 rounded border-[1.5px] border-ink bg-paper shadow-[2px_2px_0_0_var(--color-ink)]">
            <Sparkles className="w-4 h-4 text-marigold shrink-0" />
            <div className="text-[11px] font-mono leading-tight text-ink flex flex-wrap items-center gap-1.5">
              <span className="font-bold">Active Criteria:</span> {gender} • {ageNum}y • {stateName} • {caste} • ₹{(annualIncome / 100000).toFixed(1)}L/yr
              {isStudent && <span className="px-1.5 py-0.5 rounded bg-marigold/20 text-ink font-bold border border-marigold/40 text-[9px]">STUDENT</span>}
              {isBpl && <span className="px-1.5 py-0.5 rounded bg-clay/20 text-clay font-bold border border-clay/40 text-[9px]">BPL</span>}
              {isLiveMatched && (
                <span className="ml-1 px-1.5 py-0.5 rounded bg-emerald/20 text-emerald font-bold border border-emerald/40 text-[9px]">
                  LIVE BACKEND
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Profile Demographics Filter Panel */}
      <div className="paper-card p-4 space-y-4">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 font-mono text-xs uppercase font-bold text-ink hover:text-ink/70"
          >
            <SlidersHorizontal className="w-4 h-4 text-marigold" />
            <span>{showFilters ? "Hide Demographic Criteria Controls" : "Customize Scheme Match Profile Criteria"}</span>
            <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-marigold/20 text-ink border border-ink/30 ml-1">
              {gender} • {caste} • {residence}
            </span>
          </button>

          <button
            type="button"
            onClick={loadMatchedSchemes}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 font-mono text-xs uppercase font-bold px-3 py-1 rounded border border-ink bg-paper hover:bg-marigold/20 shadow-[1px_1px_0_0_var(--color-ink)]"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} /> Re-Match Schemes
          </button>
        </div>

        {showFilters && (
          <div className="pt-3 border-t border-ink/20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
            {/* Gender */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-ink/70 mb-1">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                className="w-full p-2 border border-ink rounded bg-paper text-ink font-mono text-xs focus:ring-1 focus:ring-marigold"
              >
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="transgender">Transgender</option>
              </select>
            </div>

            {/* Caste / Category */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-ink/70 mb-1">Caste / Category</label>
              <select
                value={caste}
                onChange={(e) => setCaste(e.target.value as any)}
                className="w-full p-2 border border-ink rounded bg-paper text-ink font-mono text-xs focus:ring-1 focus:ring-marigold"
              >
                <option value="General">General</option>
                <option value="OBC">OBC</option>
                <option value="SC">SC</option>
                <option value="ST">ST</option>
                <option value="PVTG">PVTG</option>
                <option value="DNT">DNT</option>
              </select>
            </div>

            {/* Residence */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-ink/70 mb-1">Residence Area</label>
              <select
                value={residence}
                onChange={(e) => setResidence(e.target.value as any)}
                className="w-full p-2 border border-ink rounded bg-paper text-ink font-mono text-xs focus:ring-1 focus:ring-marigold"
              >
                <option value="urban">Urban</option>
                <option value="rural">Rural</option>
              </select>
            </div>

            {/* State */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-ink/70 mb-1">State / Jurisdiction</label>
              <select
                value={stateName}
                onChange={(e) => setStateName(e.target.value)}
                className="w-full p-2 border border-ink rounded bg-paper text-ink font-mono text-xs focus:ring-1 focus:ring-marigold"
              >
                {STATES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {/* Age */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-ink/70 mb-1">Age (Years)</label>
              <input
                type="number"
                value={ageNum}
                onChange={(e) => setAgeNum(Number(e.target.value))}
                min={0}
                max={120}
                className="w-full p-2 border border-ink rounded bg-paper text-ink font-mono text-xs"
              />
            </div>

            {/* Annual Household Income */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-ink/70 mb-1">Annual Income (₹)</label>
              <input
                type="number"
                value={annualIncome}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setAnnualIncome(val);
                  if (val < 120000) setIsBpl(true);
                }}
                min={0}
                step={25000}
                placeholder="300000"
                className="w-full p-2 border border-ink rounded bg-paper text-ink font-mono text-xs"
              />
            </div>

            {/* Toggles */}
            <div className="sm:col-span-3 flex flex-wrap items-center gap-4 pt-2">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isStudent}
                  onChange={(e) => setIsStudent(e.target.checked)}
                  className="rounded border-ink text-marigold focus:ring-marigold"
                />
                <span>Student</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isBpl}
                  onChange={(e) => setIsBpl(e.target.checked)}
                  className="rounded border-ink text-marigold focus:ring-marigold"
                />
                <span>BPL / Low Income</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isDisability}
                  onChange={(e) => setIsDisability(e.target.checked)}
                  className="rounded border-ink text-marigold focus:ring-marigold"
                />
                <span>Differently Abled (PwD)</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isMinority}
                  onChange={(e) => setIsMinority(e.target.checked)}
                  className="rounded border-ink text-marigold focus:ring-marigold"
                />
                <span>Minority Group</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={forFamily}
                  onChange={(e) => setForFamily(e.target.checked)}
                  className="rounded border-ink text-marigold focus:ring-marigold"
                />
                <span>Family / Household Scheme</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Search & Category Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/50" />
          <input
            type="text"
            placeholder={t("schemes.search_placeholder", "Search schemes by name or benefits...")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border-[1.5px] border-ink rounded bg-paper text-ink font-mono text-xs focus:outline-none focus:ring-2 focus:ring-marigold shadow-[1.5px_1.5px_0_0_var(--color-ink)]"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "font-mono text-xs uppercase font-bold px-3.5 py-1.5 rounded border-[1.5px] transition-all shadow-[1.5px_1.5px_0_0_var(--color-ink)]",
                  isActive
                    ? "bg-ink text-paper border-ink"
                    : "bg-paper text-ink border-ink hover:bg-marigold/20"
                )}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Vernacular Translation Banner */}
      {selectedLang !== "eng_Latn" && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded border border-ink bg-paper shadow-[2px_2px_0_0_var(--color-ink)]">
          <div className="flex items-center gap-2.5">
            <Globe className="w-4 h-4 text-ink shrink-0" />
            <div className="text-xs text-ink">
              <span className="font-semibold">Vernacular Translation:</span>{" "}
              {supportedLanguages[selectedLang] || selectedLang}{" "}
              <span className="font-mono text-[10px] text-ink/60">
                ({isServiceConnected ? "IndicTrans2 Active • Live" : "Offline Fallback"})
              </span>
            </div>
          </div>

          <button
            type="button"
            disabled={isTranslatingAll}
            onClick={handleToggleTranslation}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-ink font-mono text-xs uppercase font-bold transition-all shadow-[1.5px_1.5px_0_0_var(--color-ink)]",
              isTranslatedActive
                ? "bg-marigold text-ink"
                : "bg-ink text-paper hover:bg-marigold hover:text-ink"
            )}
          >
            {isTranslatingAll ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Globe className="w-3.5 h-3.5" />
            )}
            {isTranslatedActive
              ? "Show Original English"
              : `Translate to ${supportedLanguages[selectedLang] || "Vernacular"}`}
          </button>
        </div>
      )}

      {/* Fetch Error Banner */}
      {fetchError && (
        <div className="p-4 rounded border border-clay bg-clay/10 text-clay flex items-center justify-between shadow-[1.5px_1.5px_0_0_var(--color-clay)] font-sans text-xs">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div>
              <strong className="font-bold">Scheme Backend Error:</strong> {fetchError}
            </div>
          </div>
          <button
            onClick={loadMatchedSchemes}
            className="font-mono text-xs font-bold uppercase px-3 py-1 rounded border border-clay bg-paper text-clay hover:bg-clay hover:text-paper"
          >
            Retry
          </button>
        </div>
      )}

      {/* Schemes Catalog */}
      {isLoading ? (
        <div className="paper-card p-12 text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-ink" />
          <p className="font-mono text-xs uppercase tracking-wider text-ink/70">
            Fetching dynamic user matches from Scheme Generator (4,857+ dataset)...
          </p>
        </div>
      ) : filteredSchemes.length === 0 ? (
        <div className="paper-card p-12 text-center space-y-2">
          <p className="font-serif text-lg font-bold text-ink">No matching schemes found</p>
          <p className="font-mono text-xs text-ink/60">
            Try adjusting your search criteria, demographic controls, or category filter.
          </p>
        </div>
      ) : (
        <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-5">
          {filteredSchemes.map((scheme) => (
            <motion.div key={scheme.id} variants={fadeInUp}>
              <div className="paper-card p-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b-[1.5px] border-ink pb-4 mb-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-mono text-[10px] uppercase text-ink/60 font-semibold">
                        {scheme.category}
                      </span>
                      {scheme.state && (
                        <>
                          <span className="text-ink/30">·</span>
                          <span className="font-mono text-[10px] text-ink/70 font-bold">
                            {scheme.state}
                          </span>
                        </>
                      )}
                      <span className="text-ink/30">·</span>
                      <span className="font-mono text-[10px] text-ink/60">
                        {scheme.deadline}
                      </span>
                      {scheme.matchScore !== undefined && (
                        <>
                          <span className="text-ink/30">·</span>
                          <span className="font-mono text-[10px] font-bold text-emerald">
                            {scheme.matchScore}% Match
                          </span>
                        </>
                      )}
                      {isTranslatedActive && translatedMap[scheme.id] && (
                        <>
                          <span className="text-ink/30">·</span>
                          <span className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded bg-marigold/30 text-ink border border-ink/30">
                            Translated
                          </span>
                        </>
                      )}
                    </div>
                    <Link
                      href={`/schemes/${scheme.slug}`}
                      className="group/title block"
                    >
                      <h3 className="font-serif text-xl font-bold text-ink group-hover/title:text-ink/75 group-hover/title:underline decoration-marigold underline-offset-4 transition-colors">
                        {isTranslatedActive && translatedMap[scheme.id]?.name
                          ? translatedMap[scheme.id].name
                          : scheme.scheme_name}
                      </h3>
                    </Link>
                  </div>

                  {/* Qualification Badge */}
                  <div className="shrink-0">
                    {scheme.eligible ? (
                      <span className="inline-flex items-center gap-1.5 font-mono text-xs uppercase font-bold px-3 py-1 rounded border border-ink bg-emerald text-paper shadow-[1.5px_1.5px_0_0_var(--color-ink)]">
                        <CheckCircle2 className="w-3.5 h-3.5" /> You Qualify
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 font-mono text-xs uppercase font-bold px-3 py-1 rounded border border-ink bg-clay/20 text-ink shadow-[1.5px_1.5px_0_0_var(--color-ink)]">
                        <AlertCircle className="w-3.5 h-3.5 text-clay" /> Needs Review
                      </span>
                    )}
                  </div>
                </div>

                {/* Benefit Highlight */}
                <div className="font-sans text-sm text-ink/80 leading-relaxed mb-4">
                  <FormattedSchemeText
                    text={
                      isTranslatedActive && translatedMap[scheme.id]?.benefit
                        ? translatedMap[scheme.id].benefit
                        : scheme.benefit
                    }
                  />
                </div>

                {/* Matched Criteria Signals */}
                {scheme.matchedCriteria && scheme.matchedCriteria.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {scheme.matchedCriteria.map((c, idx) => (
                      <span
                        key={idx}
                        className="font-mono text-[10px] px-2 py-0.5 rounded border border-ink/30 bg-marigold/15 text-ink"
                      >
                        ✓ {c}
                      </span>
                    ))}
                  </div>
                )}

                {/* Collapsible Details */}
                <Accordion className="w-full border-t border-ink/20 pt-2">
                  <AccordionItem value="details" className="border-none">
                    <AccordionTrigger className="font-mono text-xs uppercase tracking-wider text-ink font-semibold py-2 hover:no-underline">
                      ▸ View Required Documents & Application Steps
                    </AccordionTrigger>
                    <AccordionContent className="pt-3 space-y-4 text-xs font-sans">
                      <div>
                        <p className="font-mono text-[11px] uppercase font-bold text-ink mb-2">
                          Documents Checklist
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {scheme.documents_needed.map((doc, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-2 p-2 rounded border border-ink/30 bg-paper/60"
                            >
                              <FileCheck className="w-3.5 h-3.5 text-emerald shrink-0" />
                              <span className="text-ink font-medium">{doc}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-2">
                        <p className="font-mono text-[11px] uppercase font-bold text-ink mb-1">
                          How to Apply
                        </p>
                        <div className="text-ink/80 leading-relaxed">
                          <FormattedSchemeText text={scheme.how_to_apply} />
                        </div>
                      </div>

                      <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                        <Link
                          href={`/schemes/${scheme.slug}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-ink bg-marigold/20 font-mono text-xs font-bold uppercase text-ink shadow-[1px_1px_0_0_var(--color-ink)] hover:bg-marigold"
                        >
                          Open Detailed Scheme Page & Checklist &rarr;
                        </Link>

                        {scheme.link && (
                          <a
                            href={scheme.link}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 font-mono text-xs text-ink font-bold underline underline-offset-4 decoration-marigold decoration-2 hover:text-ink/70"
                          >
                            Official Portal Link <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
