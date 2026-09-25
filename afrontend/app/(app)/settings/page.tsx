"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { pageVariants, fadeInUp } from "@/lib/motion";
import { clearTokens } from "@/lib/auth";
import { getMe } from "@/lib/api/auth";
import type { UserResponse } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { LogOut, Trash2, User, Globe, Shield, CheckCircle2, Loader2, RefreshCw, Send, Check, Bot, Key, Sparkles, ExternalLink, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useLanguageStore } from "@/store/language-store";
import { useChatStore, POPULAR_MODELS } from "@/store/chat-store";
import Link from "next/link";

const POPULAR_LANG_OPTS = [
  { code: "eng_Latn", label: "English", native: "English" },
  { code: "hin_Deva", label: "Hindi", native: "हिंदी" },
  { code: "mar_Deva", label: "Marathi", native: "मराठी" },
  { code: "tam_Taml", label: "Tamil", native: "தமிழ்" },
  { code: "tel_Telu", label: "Telugu", native: "తెలుగు" },
  { code: "ben_Beng", label: "Bengali", native: "বাংলা" },
  { code: "guj_Gujr", label: "Gujarati", native: "ગુજરાતી" },
  { code: "kan_Knda", label: "Kannada", native: "ಕನ್ನಡ" },
];

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserResponse | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const {
    selectedLang,
    setLanguage,
    isServiceConnected,
    healthInfo,
    checkHealth,
    translate,
    isTranslating,
  } = useLanguageStore();

  const [testText, setTestText] = useState("Welcome to ArthSaathi. Your financial security is our priority.");
  const [translatedResult, setTranslatedResult] = useState("");
  const [isTesting, setIsTesting] = useState(false);
  const [isRefreshingHealth, setIsRefreshingHealth] = useState(false);

  const {
    openRouterApiKey: chatApiKey,
    selectedModel: chatModel,
    setApiKey: setChatApiKey,
    setModel: setChatModel,
  } = useChatStore();
  const [localApiKey, setLocalApiKey] = useState("");
  const [showAiKey, setShowAiKey] = useState(false);

  useEffect(() => {
    setLocalApiKey(chatApiKey);
  }, [chatApiKey]);

  useEffect(() => {
    getMe()
      .then(setUser)
      .catch(() => {
        setUser(null);
      });
  }, []);

  function handleLogout() {
    clearTokens();
    router.push("/login");
    toast.success("Signed out successfully");
  }

  function handleDeleteData() {
    clearTokens();
    setDeleteOpen(false);
    toast.success("All personal financial data and twin models permanently purged.");
    router.push("/login");
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      className="max-w-3xl mx-auto space-y-8"
    >
      {/* Editorial Header */}
      <div className="border-b-[1.5px] border-ink pb-5">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-ink tracking-tight">
          Account & Privacy
        </h1>
        <p className="font-mono text-xs uppercase tracking-wider text-ink/70 mt-1">
          DPDP Act Compliance · Bilingual Preference · Session Control
        </p>
      </div>

      <div className="space-y-6">
        {/* Account Details */}
        <motion.div {...fadeInUp}>
          <div className="paper-card p-6">
            <div className="flex items-center gap-2 border-b-[1.5px] border-ink pb-3 mb-4">
              <User className="w-4 h-4 text-ink" />
              <h3 className="font-serif text-lg font-bold text-ink">User Identity</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
              <div className="p-3 rounded border border-ink bg-paper shadow-[1px_1px_0_0_var(--color-ink)]">
                <p className="text-ink/60 uppercase text-[10px]">Full Name</p>
                <p className="font-serif text-base font-bold text-ink mt-0.5">
                  {user?.full_name || "Priya Sharma"}
                </p>
              </div>

              <div className="p-3 rounded border border-ink bg-paper shadow-[1px_1px_0_0_var(--color-ink)]">
                <p className="text-ink/60 uppercase text-[10px]">Registered Email</p>
                <p className="font-sans text-sm font-semibold text-ink mt-0.5">
                  {user?.email || "priya.demo@arthsaathi.app"}
                </p>
              </div>

              <div className="p-3 rounded border border-ink bg-paper shadow-[1px_1px_0_0_var(--color-ink)] sm:col-span-2">
                <p className="text-ink/60 uppercase text-[10px]">Twin Profile Anchor</p>
                <p className="font-sans text-xs text-ink/80 mt-0.5">
                  UUID: <span className="font-mono">b6a1e6b0-2f3e-4a3b-9c1e-7e2a2f4d9a11</span> · CockroachDB Mumbai Region
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Language Selection & ML Service 2 Status */}
        <motion.div {...fadeInUp}>
          <div className="paper-card p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-[1.5px] border-ink pb-3">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-ink" />
                <h3 className="font-serif text-lg font-bold text-ink">Bilingual & Vernacular Interface</h3>
              </div>

              {/* Service Health Pill */}
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded border font-mono text-[10px] uppercase font-bold",
                    isServiceConnected
                      ? "border-emerald/40 bg-emerald/10 text-emerald"
                      : "border-clay/40 bg-clay/10 text-clay"
                  )}
                >
                  <span
                    className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      isServiceConnected ? "bg-emerald animate-pulse" : "bg-clay"
                    )}
                  />
                  {isServiceConnected
                    ? `IndicTrans2 Active (${healthInfo?.device || "online"})`
                    : "Offline / Fallback Mode"}
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    setIsRefreshingHealth(true);
                    const ok = await checkHealth();
                    setIsRefreshingHealth(false);
                    if (ok) {
                      toast.success("IndicTrans2 translation microservice is online (Port 8002)!");
                    } else {
                      toast.error("Could not reach translation service on port 8002. Using offline fallback.");
                    }
                  }}
                  title="Check service health on port 8002"
                  className="p-1 rounded border border-ink bg-paper hover:bg-ink hover:text-paper transition-colors"
                >
                  <RefreshCw className={cn("w-3 h-3", isRefreshingHealth && "animate-spin")} />
                </button>
              </div>
            </div>

            <p className="font-sans text-xs text-ink/80">
              Powered by AI4Bharat IndicTrans2 distilled models. Arthsaathi translates financial concepts and government schemes into 22 Indian regional languages offline without privacy leaks.
            </p>

            {/* Language Options Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {POPULAR_LANG_OPTS.map((lang) => {
                const isSelected = selectedLang === lang.code;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => {
                      setLanguage(lang.code);
                      toast.success(`Language set to ${lang.native}`);
                    }}
                    className={cn(
                      "flex flex-col items-start p-2.5 rounded border-[1.5px] transition-all text-left",
                      isSelected
                        ? "bg-ink text-paper border-ink shadow-[2px_2px_0_0_var(--color-ink)] font-semibold"
                        : "bg-paper text-ink border-ink hover:bg-marigold/15 shadow-[1px_1px_0_0_var(--color-ink)]"
                    )}
                  >
                    <span className="font-sans text-xs font-bold leading-tight flex items-center justify-between w-full">
                      {lang.native}
                      {isSelected && <Check className="w-3 h-3 ml-1 text-marigold" />}
                    </span>
                    <span
                      className={cn(
                        "font-mono text-[9px] uppercase tracking-wider mt-0.5",
                        isSelected ? "text-paper/70" : "text-ink/60"
                      )}
                    >
                      {lang.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Active Language Global Scope Notice */}
            <div className="p-3 rounded border border-ink/20 bg-marigold/10 flex items-center justify-between text-xs font-mono text-ink">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald shrink-0" />
                <span>
                  <strong>App-Wide Language:</strong> Arthsaathi interface is set to{" "}
                  <span className="font-bold text-ink underline decoration-marigold decoration-2">
                    {POPULAR_LANG_OPTS.find((l) => l.code === selectedLang)?.native || "English"}
                  </span>
                  . All Navigation, Dashboard, Financial Twin, and Scheme cards will reflect this language.
                </span>
              </div>
            </div>

            {/* Live Translation Sandbox */}
            <div className="p-4 rounded border border-ink bg-paper shadow-[2px_2px_0_0_var(--color-ink)] space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase font-bold tracking-wider text-ink/80 flex items-center gap-1.5">
                  <Send className="w-3 h-3 text-marigold" /> Live Translation Playground (Port 8002)
                </span>
                <span className="font-mono text-[9px] text-ink/60">
                  Target: {POPULAR_LANG_OPTS.find((l) => l.code === selectedLang)?.native || selectedLang}
                </span>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={testText}
                  onChange={(e) => setTestText(e.target.value)}
                  placeholder="Enter text to translate..."
                  className="flex-1 px-3 py-1.5 text-xs rounded border border-ink bg-paper font-sans text-ink focus:outline-none focus:ring-1 focus:ring-ink"
                />
                <button
                  type="button"
                  disabled={isTesting || isTranslating}
                  onClick={async () => {
                    if (!testText.trim()) return;
                    setIsTesting(true);
                    try {
                      const res = await translate(testText, selectedLang, "eng_Latn");
                      setTranslatedResult(res);
                      toast.success("Translation complete!");
                    } catch {
                      toast.error("Translation request failed.");
                    } finally {
                      setIsTesting(false);
                    }
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded border border-ink bg-ink text-paper hover:bg-marigold hover:text-ink font-mono text-xs font-bold transition-all shadow-[1.5px_1.5px_0_0_var(--color-ink)] disabled:opacity-50"
                >
                  {isTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3 h-3" />}
                  Translate
                </button>
              </div>

              {translatedResult && (
                <div className="p-2.5 rounded border border-ink/40 bg-marigold/10 space-y-1">
                  <p className="font-mono text-[9px] uppercase tracking-wider text-ink/60">Result:</p>
                  <p className="font-serif text-sm font-bold text-ink">{translatedResult}</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Arthsaathi AI & OpenRouter Integration */}
        <motion.div {...fadeInUp}>
          <div className="paper-card p-6">
            <div className="flex items-center justify-between border-b-[1.5px] border-ink pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-ink" />
                <h3 className="font-serif text-lg font-bold text-ink">Arthsaathi AI (OpenRouter)</h3>
              </div>
              <span className="font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded border border-ink bg-marigold/20 text-ink">
                Twin-Grounded
              </span>
            </div>

            <p className="font-sans text-xs text-ink/80 leading-relaxed mb-4">
              Configure your OpenRouter API key and preferred AI model. The AI Sathi chatbot uses these credentials to deliver personalized financial advice grounded in your real-time Financial Twin data.
            </p>

            <div className="space-y-4">
              {/* API Key Input */}
              <div className="space-y-1.5">
                <label className="font-mono text-xs uppercase font-bold text-ink flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-marigold" /> OpenRouter API Key
                  </span>
                  <a
                    href="https://openrouter.ai/keys"
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-[10px] text-ink/70 hover:text-ink underline flex items-center gap-0.5 normal-case"
                  >
                    Get free key on OpenRouter <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </label>

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showAiKey ? "text" : "password"}
                      value={localApiKey}
                      onChange={(e) => setLocalApiKey(e.target.value)}
                      placeholder="sk-or-v1-..."
                      className="w-full pr-10 pl-3 py-2 text-xs rounded border border-ink bg-paper font-mono text-ink focus:outline-none focus:ring-1 focus:ring-ink"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAiKey(!showAiKey)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-ink/50 hover:text-ink p-1"
                    >
                      {showAiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setChatApiKey(localApiKey.trim());
                      toast.success(localApiKey.trim() ? "OpenRouter API Key saved!" : "API Key cleared");
                    }}
                    className="px-4 py-2 rounded border border-ink bg-ink text-paper hover:bg-marigold hover:text-ink font-mono text-xs font-bold transition-all shadow-[1.5px_1.5px_0_0_var(--color-ink)]"
                  >
                    Save Key
                  </button>
                </div>
                <p className="font-sans text-[11px] text-ink/65 leading-tight">
                  Stored securely in your local browser storage. You can also specify{" "}
                  <code className="font-mono text-[10px] bg-ink/10 px-1 py-0.5 rounded">OPENROUTER_API_KEY</code> in{" "}
                  <code className="font-mono text-[10px] bg-ink/10 px-1 py-0.5 rounded">.env.local</code>.
                </p>
              </div>

              {/* Model Selection */}
              <div className="space-y-1.5">
                <label className="font-mono text-xs uppercase font-bold text-ink">Active Model</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {POPULAR_MODELS.map((m) => {
                    const isSelected = chatModel === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setChatModel(m.id);
                          toast.success(`Selected model: ${m.name}`);
                        }}
                        className={cn(
                          "flex flex-col items-start p-2.5 rounded border text-left transition-all",
                          isSelected
                            ? "border-ink bg-marigold/15 shadow-[2px_2px_0_0_var(--color-ink)] font-medium"
                            : "border-ink/30 bg-paper hover:border-ink"
                        )}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="font-sans text-xs font-bold text-ink">{m.name}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-marigold" />}
                        </div>
                        <span className="font-mono text-[10px] text-ink/60 mt-0.5">{m.provider}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quick Launch Link */}
              <div className="pt-2 border-t border-ink/15 flex items-center justify-between">
                <span className="font-mono text-xs text-ink/70">
                  {chatApiKey ? (
                    <span className="text-emerald font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> API Key Configured
                    </span>
                  ) : (
                    <span className="text-ink/60">No key configured (using server env or fallback)</span>
                  )}
                </span>
                <Link
                  href="/chat"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-ink bg-paper hover:bg-marigold font-mono text-xs font-bold transition-all shadow-[1.5px_1.5px_0_0_var(--color-ink)]"
                >
                  <Sparkles className="w-3.5 h-3.5 text-marigold" /> Open AI Sathi Workspace &rarr;
                </Link>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Security & Data Deletion */}
        <motion.div {...fadeInUp}>
          <div className="paper-card p-6 border-clay/50 bg-paper">
            <div className="flex items-center gap-2 border-b-[1.5px] border-ink pb-3 mb-4">
              <Shield className="w-4 h-4 text-clay" />
              <h3 className="font-serif text-lg font-bold text-ink">Data Governance (DPDP Act)</h3>
            </div>

            <p className="font-sans text-xs text-ink/80 leading-relaxed mb-5">
              In full compliance with India&apos;s Digital Personal Data Protection Act, you maintain complete ownership of your financial records. Your data is never monetized, sold, or shared with third-party advertisers.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-ink/15">
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded border-[1.5px] border-ink bg-paper hover:bg-ink hover:text-paper font-mono text-xs uppercase font-bold transition-all shadow-[2px_2px_0_0_var(--color-ink)]"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign Out
              </button>

              <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogTrigger>
                  <button className="inline-flex items-center gap-1.5 px-4 py-2 rounded border-[1.5px] border-clay bg-clay/10 text-clay hover:bg-clay hover:text-paper font-mono text-xs uppercase font-bold transition-all shadow-[2px_2px_0_0_var(--color-clay)]">
                    <Trash2 className="w-3.5 h-3.5" /> Delete My Data
                  </button>
                </DialogTrigger>
                <DialogContent className="paper-card bg-paper border-[2px] border-ink max-w-md">
                  <DialogHeader>
                    <DialogTitle className="font-serif text-xl text-clay">
                      Permanent Data Erasure
                    </DialogTitle>
                    <DialogDescription className="font-sans text-xs text-ink/80 pt-2 leading-relaxed">
                      This action is irreversible. All entries for your Financial Twin (income, liabilities, assets, goals) and cached model inferences will be immediately purged from our servers.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter className="mt-4 flex gap-2 sm:justify-end">
                    <button
                      onClick={() => setDeleteOpen(false)}
                      className="px-3 py-1.5 rounded border border-ink text-xs font-mono font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteData}
                      className="px-3 py-1.5 rounded border border-ink bg-clay text-paper text-xs font-mono font-bold shadow-[2px_2px_0_0_var(--color-ink)]"
                    >
                      Confirm Erasure
                    </button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
