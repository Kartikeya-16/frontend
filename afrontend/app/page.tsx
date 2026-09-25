"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Users, TrendingUp, ShieldAlert, Landmark, Sparkles } from "lucide-react";
import { pageVariants, fadeInUp, staggerContainer } from "@/lib/motion";
import { LanguageSelector } from "@/components/layout/language-selector";
import { useTranslation } from "@/lib/i18n";

export default function HomePage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-paper text-ink selection:bg-marigold selection:text-ink">
      {/* Top Navigation */}
      <header className="border-b-[1.5px] border-ink bg-paper sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-baseline gap-1">
            <span className="font-serif text-2xl font-bold tracking-tight text-ink">
              Arthsaathi
            </span>
            <span className="w-2 h-2 rounded-full bg-marigold inline-block ml-0.5" />
          </Link>

          <nav className="hidden md:flex items-center gap-6 font-mono text-xs uppercase tracking-wider text-ink/70">
            <a href="#pillars" className="hover:text-ink transition-colors">{t("landing.four_pillars", "The Four Pillars")}</a>
            <a href="#trust" className="hover:text-ink transition-colors">{t("landing.data_trust", "Data & Trust")}</a>
            <Link href="/dashboard" className="hover:text-ink transition-colors">{t("landing.demo_dash", "Demo Dashboard")}</Link>
          </nav>

          <div className="flex items-center gap-3">
            <div className="w-36 sm:w-40">
              <LanguageSelector direction="down" align="right" />
            </div>
            <Link
              href="/login"
              className="font-mono text-xs uppercase tracking-wider font-semibold text-ink px-3 py-1.5 hover:underline"
            >
              {t("landing.sign_in", "Sign In")}
            </Link>
            <Link
              href="/register"
              className="font-mono text-xs uppercase font-bold tracking-wider px-3.5 py-1.5 rounded border-[1.5px] border-ink bg-ink text-paper hover:bg-marigold hover:text-ink transition-all shadow-[2px_2px_0_0_var(--color-ink)] active:translate-x-0.5 active:translate-y-0.5"
            >
              {t("landing.create_twin", "Create Twin")}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 pt-16 sm:pt-24 pb-20">
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="max-w-3xl space-y-6"
        >
          <motion.div variants={fadeInUp}>
            <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest font-bold px-3 py-1 rounded border border-ink bg-paper shadow-[1.5px_1.5px_0_0_var(--color-ink)] text-ink">
              <span className="w-2 h-2 rounded-full bg-emerald inline-block" />
              {t("landing.badge", "AI Financial Twin · Capstone Project")}
            </span>
          </motion.div>

          <motion.h1
            variants={fadeInUp}
            className="font-serif text-4xl sm:text-6xl lg:text-7xl font-bold leading-[1.02] tracking-tight text-ink"
          >
            {t("landing.hero_title", "One companion. Every rupee, every EMI, every scheme you're owed.")}
          </motion.h1>

          <motion.p
            variants={fadeInUp}
            className="font-sans text-base sm:text-lg text-ink/80 leading-relaxed max-w-2xl"
          >
            {t("landing.hero_desc", "Arthsaathi builds a living digital replica of your financial life — budgeting your cash flow, testing loan affordability before you borrow, spotting bilingual Indian scams, and matching government subsidies you qualify for.")}
          </motion.p>

          <motion.div variants={fadeInUp} className="pt-3 flex flex-wrap items-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded border-[1.5px] border-ink bg-ink text-paper hover:bg-marigold hover:text-ink font-mono text-xs uppercase font-bold tracking-wider transition-all shadow-[3px_3px_0_0_var(--color-ink)] active:translate-x-0.5 active:translate-y-0.5"
            >
              {t("landing.create_twin_btn", "Create your Financial Twin")}
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded border-[1.5px] border-ink bg-paper text-ink hover:bg-marigold/20 font-mono text-xs uppercase font-bold tracking-wider transition-all shadow-[3px_3px_0_0_var(--color-ink)] active:translate-x-0.5 active:translate-y-0.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-ink" />
              {t("landing.explore_demo", "Explore Live Demo")}
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* The Four Pillars Section */}
      <section id="pillars" className="border-t-[1.5px] border-ink bg-paper py-20">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 space-y-12">
          <div>
            <span className="font-mono text-xs uppercase tracking-widest text-ink/60 font-semibold block mb-2">
              {t("landing.sys_arch", "System Architecture")}
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-ink tracking-tight">
              {t("landing.four_pillars", "The Four Pillars")}
            </h2>
            <p className="font-sans text-sm text-ink/75 max-w-2xl mt-2 leading-relaxed">
              {t("landing.pillars_desc", "Every feature reads from and acts on your Financial Twin. The tools do not live in isolated silos — they are four coordinated lenses on one life.")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pillar 1 */}
            <div className="paper-card p-6 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded border-[1.5px] border-ink bg-paper flex items-center justify-center mb-4 shadow-[2px_2px_0_0_var(--color-ink)]">
                  <Users className="w-5 h-5 text-ink" />
                </div>
                <span className="font-mono text-[10px] uppercase font-bold tracking-wider text-ink/60 block mb-1">
                  {t("common.pillar_1", "Pillar 1")}
                </span>
                <h3 className="font-serif text-2xl font-bold text-ink mb-2">
                  {t("landing.pillar_1_title", "Dynamic Financial Twin")}
                </h3>
                <p className="font-sans text-xs sm:text-sm text-ink/80 leading-relaxed">
                  {t("landing.pillar_1_desc", "A living digital replica mapping your income, multiple earning sources, categorized monthly expenses, assets (gold, FDs, mutual funds), and debt liabilities. When your life changes, the Twin updates with you.")}
                </p>
              </div>
              <div className="pt-5 mt-4 border-t border-ink/15 flex justify-between items-center font-mono text-xs text-ink/70">
                <span>{t("landing.pillar_1_badge", "Living Profile Model")}</span>
                <Link href="/twin" className="font-bold text-ink underline underline-offset-4 decoration-marigold hover:text-ink/80">
                  {t("landing.pillar_1_link", "Open Twin Editor")}
                </Link>
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="paper-card p-6 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded border-[1.5px] border-ink bg-paper flex items-center justify-center mb-4 shadow-[2px_2px_0_0_var(--color-ink)]">
                  <TrendingUp className="w-5 h-5 text-ink" />
                </div>
                <span className="font-mono text-[10px] uppercase font-bold tracking-wider text-ink/60 block mb-1">
                  {t("common.pillar_2", "Pillar 2")}
                </span>
                <h3 className="font-serif text-2xl font-bold text-ink mb-2">
                  {t("landing.pillar_2_title", "Smart Financial Planner")}
                </h3>
                <p className="font-sans text-xs sm:text-sm text-ink/80 leading-relaxed">
                  {t("landing.pillar_2_desc", "50/30/20 budget allocations, an EMI-health check flagging when loan burdens exceed 40% of income, emergency runway targets, and a Random Forest ML Financial Health Score with real feature weights.")}
                </p>
              </div>
              <div className="pt-5 mt-4 border-t border-ink/15 flex justify-between items-center font-mono text-xs text-ink/70">
                <span>{t("landing.pillar_2_badge", "ML Score & Feasibility")}</span>
                <Link href="/planner" className="font-bold text-ink underline underline-offset-4 decoration-marigold hover:text-ink/80">
                  {t("landing.pillar_2_link", "View Planner")}
                </Link>
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="paper-card p-6 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded border-[1.5px] border-ink bg-paper flex items-center justify-center mb-4 shadow-[2px_2px_0_0_var(--color-ink)]">
                  <ShieldAlert className="w-5 h-5 text-ink" />
                </div>
                <span className="font-mono text-[10px] uppercase font-bold tracking-wider text-ink/60 block mb-1">
                  {t("common.pillar_3", "Pillar 3")}
                </span>
                <h3 className="font-serif text-2xl font-bold text-ink mb-2">
                  {t("landing.pillar_3_title", "Scam Shield")}
                </h3>
                <p className="font-sans text-xs sm:text-sm text-ink/80 leading-relaxed">
                  {t("landing.pillar_3_desc", "Bilingual threat classifier built specifically for Indian financial fraud. Paste suspicious SMS text, phishing links, or upload screenshots to detect fake KYC, lottery scams, and urgent OTP pressure in Hindi and English.")}
                </p>
              </div>
              <div className="pt-5 mt-4 border-t border-ink/15 flex justify-between items-center font-mono text-xs text-ink/70">
                <span>{t("landing.pillar_3_badge", "Bilingual XLM-RoBERTa")}</span>
                <Link href="/scam-shield" className="font-bold text-ink underline underline-offset-4 decoration-marigold hover:text-ink/80">
                  {t("landing.pillar_3_link", "Test Shield")}
                </Link>
              </div>
            </div>

            {/* Pillar 4 */}
            <div className="paper-card p-6 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded border-[1.5px] border-ink bg-paper flex items-center justify-center mb-4 shadow-[2px_2px_0_0_var(--color-ink)]">
                  <Landmark className="w-5 h-5 text-ink" />
                </div>
                <span className="font-mono text-[10px] uppercase font-bold tracking-wider text-ink/60 block mb-1">
                  {t("common.pillar_4", "Pillar 4")}
                </span>
                <h3 className="font-serif text-2xl font-bold text-ink mb-2">
                  {t("landing.pillar_4_title", "Scheme Navigator")}
                </h3>
                <p className="font-sans text-xs sm:text-sm text-ink/80 leading-relaxed">
                  {t("landing.pillar_4_desc", "Automated content-based filtering matching your Twin against central and state government schemes (PM Mudra, Sukanya Samriddhi, Ayushman Bharat, PMAY) to reveal benefits and document checklists you are legally owed.")}
                </p>
              </div>
              <div className="pt-5 mt-4 border-t border-ink/15 flex justify-between items-center font-mono text-xs text-ink/70">
                <span>{t("landing.pillar_4_badge", "Hard Eligibility Filter")}</span>
                <Link href="/schemes" className="font-bold text-ink underline underline-offset-4 decoration-marigold hover:text-ink/80">
                  {t("landing.pillar_4_link", "Browse Schemes")}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Engineering Principles Section */}
      <section id="trust" className="border-t-[1.5px] border-ink bg-paper py-20">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 space-y-8">
          <div>
            <span className="font-mono text-xs uppercase tracking-widest text-ink/60 font-semibold block mb-2">
              {t("landing.principles", "Principles & Integrity")}
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-ink tracking-tight">
              {t("landing.principles_title", "Built for Reality, Not Commercial Incentives")}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2 font-sans text-xs sm:text-sm">
            <div className="p-5 rounded border border-ink bg-paper shadow-[2px_2px_0_0_var(--color-ink)] space-y-2">
              <h4 className="font-serif text-base font-bold text-ink">
                {t("landing.trust_1_title", "Private by Default (DPDP Compliant)")}
              </h4>
              <p className="text-ink/80 leading-relaxed">
                {t("landing.trust_1_desc", "Your personal numbers remain yours. No ad tracking, no data brokers, and no third-party commercial AI APIs processing your financial statements. One-click data erasure is built directly into account settings.")}
              </p>
            </div>

            <div className="p-5 rounded border border-ink bg-paper shadow-[2px_2px_0_0_var(--color-ink)] space-y-2">
              <h4 className="font-serif text-base font-bold text-ink">
                {t("landing.trust_2_title", "Bilingual Code-Switching Detection")}
              </h4>
              <p className="text-ink/80 leading-relaxed">
                {t("landing.trust_2_desc", "Indian cyber-fraudsters communicate in Hinglish. Our model explicitly detects mixed Hindi and English syntax that traditional Western spam filters fail to parse.")}
              </p>
            </div>

            <div className="p-5 rounded border border-ink bg-paper shadow-[2px_2px_0_0_var(--color-ink)] space-y-2">
              <h4 className="font-serif text-base font-bold text-ink">
                {t("landing.trust_3_title", "Zero Commission Bias")}
              </h4>
              <p className="text-ink/80 leading-relaxed">
                {t("landing.trust_3_desc", "We do not sell loans, ULIPs, or credit cards. All scheme matches, feasibility math, and warnings are computed strictly from your financial reality without affiliate incentives.")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final Quiet CTA */}
      <section className="border-t-[1.5px] border-ink bg-paper py-16">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="paper-card p-8 sm:p-12 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center sm:text-left">
              <h3 className="font-serif text-3xl font-bold text-ink">
                {t("landing.cta_title", "Ready to see your Financial Twin?")}
              </h3>
              <p className="font-sans text-sm text-ink/75 max-w-md">
                {t("landing.cta_desc", "Takes two minutes to map your income, loans, and goals into a single honest picture.")}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Link
                href="/register"
                className="px-6 py-3 rounded border-[1.5px] border-ink bg-ink text-paper hover:bg-marigold hover:text-ink font-mono text-xs uppercase font-bold tracking-wider transition-all shadow-[2px_2px_0_0_var(--color-ink)] active:translate-x-0.5 active:translate-y-0.5"
              >
                {t("landing.get_started", "Get Started")}
              </Link>
              <Link
                href="/login"
                className="px-5 py-3 rounded border-[1.5px] border-ink bg-paper text-ink hover:bg-ink hover:text-paper font-mono text-xs uppercase font-bold tracking-wider transition-all shadow-[2px_2px_0_0_var(--color-ink)] active:translate-x-0.5 active:translate-y-0.5"
              >
                {t("landing.sign_in", "Sign In")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t-[1.5px] border-ink bg-paper py-8 text-xs font-mono text-ink/60">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>{t("landing.footer_cr", "© 2026 Arthsaathi · NMIMS MPSTME Capstone Project")}</span>
          <span>{t("landing.footer_sub", "Bilingual AI Personal Financial Companion")}</span>
        </div>
      </footer>
    </div>
  );
}
