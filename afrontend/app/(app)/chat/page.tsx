"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";
import { useChatStore } from "@/store/chat-store";
import { useTwinStore } from "@/store/twin-store";
import { FrequencyType } from "@/lib/types";
import { formatINR } from "@/lib/format";
import { pageVariants, fadeInUp } from "@/lib/motion";
import { FormattedSchemeText } from "@/components/ui/formatted-scheme-text";
import { ChatSettingsDialog } from "@/components/chat/chat-settings-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Bot,
  User,
  Send,
  Trash2,
  Copy,
  Check,
  Square,
  AlertCircle,
  Key,
  ShieldCheck,
  TrendingUp,
  Scale,
  PiggyBank,
} from "lucide-react";
import { toast } from "sonner";

const PROMPT_SUGGESTIONS = [
  "How should I allocate my monthly surplus across emergency fund, mutual funds, and debt prepayment?",
  "Analyze my current debt obligations and suggest an optimal prepayment strategy.",
  "Which government schemes in my state am I eligible for given my profile and income?",
  "What is my solvency and savings rate telling me about my long-term retirement preparedness?",
];

export default function ChatPage() {
  const {
    messages,
    isGenerating,
    openRouterApiKey,
    selectedModel,
    addMessage,
    appendToLastMessage,
    updateLastMessage,
    setIsGenerating,
    clearMessages,
    loadStoredSettings,
  } = useChatStore();

  const {
    profile,
    incomeSources,
    expenses,
    assets,
    liabilities,
    goals,
  } = useTwinStore();

  const [input, setInput] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    loadStoredSettings();
  }, [loadStoredSettings]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isGenerating]);

  // Financial calculations
  const totalAssets = assets.reduce((sum, a) => sum + Number(a.current_value || 0), 0);
  const totalLiabilities = liabilities.reduce((sum, l) => sum + Number(l.outstanding_amount || 0), 0);
  const totalMonthlyEMI = liabilities.reduce((sum, l) => sum + Number(l.emi_amount || 0), 0);

  const totalMonthlyIncome =
    incomeSources.length > 0
      ? incomeSources.reduce((sum, inc) => {
          const amt = Number(inc.amount || 0);
          switch (inc.frequency) {
            case FrequencyType.ANNUAL:
              return sum + amt / 12;
            case FrequencyType.WEEKLY:
              return sum + amt * 4.33;
            case FrequencyType.ONE_TIME:
              return sum;
            default:
              return sum + amt;
          }
        }, 0)
      : Number(profile?.monthly_income || 0);

  const totalMonthlyExpenses = expenses.reduce((sum, exp) => {
    const amt = Number(exp.amount || 0);
    switch (exp.frequency) {
      case FrequencyType.ANNUAL:
        return sum + amt / 12;
      case FrequencyType.WEEKLY:
        return sum + amt * 4.33;
      case FrequencyType.ONE_TIME:
        return sum;
      default:
        return sum + amt;
    }
  }, 0);

  const netWorth = totalAssets - totalLiabilities;
  const monthlyCashFlow = totalMonthlyIncome - totalMonthlyExpenses - totalMonthlyEMI;
  const savingsRate = totalMonthlyIncome > 0 ? (monthlyCashFlow / totalMonthlyIncome) * 100 : 0;

  async function handleSendMessage(overrideText?: string) {
    const query = (overrideText || input).trim();
    if (!query || isGenerating) return;

    if (!openRouterApiKey) {
      setSettingsOpen(true);
      toast.error("Please configure your OpenRouter API key to start chatting");
      return;
    }

    setInput("");
    addMessage({ role: "user", content: query });
    addMessage({ role: "assistant", content: "" });
    setIsGenerating(true);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const twinContext = {
      profile: profile
        ? {
            age: profile.age,
            occupation: profile.occupation,
            occupation_type: profile.occupation_type,
            city: profile.city,
            state: profile.state,
            education_level: profile.education_level,
            marital_status: profile.marital_status,
            dependents_count: profile.dependents_count,
            risk_appetite: profile.risk_appetite,
            monthly_income: profile.monthly_income,
          }
        : null,
      totalAssets,
      totalLiabilities,
      totalMonthlyIncome,
      totalMonthlyExpenses,
      totalMonthlyEMI,
      monthlyCashFlow,
      netWorth,
      savingsRate,
      incomeSources: incomeSources.map((i) => ({
        source: i.source,
        amount: Number(i.amount),
        frequency: i.frequency,
      })),
      expenses: expenses.map((e) => ({
        category: e.category,
        amount: Number(e.amount),
        frequency: e.frequency,
      })),
      assets: assets.map((a) => ({
        name: a.name,
        asset_type: a.asset_type,
        current_value: Number(a.current_value),
      })),
      liabilities: liabilities.map((l) => ({
        name: l.name,
        liability_type: l.liability_type,
        outstanding_amount: Number(l.outstanding_amount),
        emi_amount: l.emi_amount ? Number(l.emi_amount) : 0,
        interest_rate: l.interest_rate ? Number(l.interest_rate) : undefined,
      })),
      goals: goals.map((g) => ({
        title: g.title,
        target_amount: Number(g.target_amount),
        current_savings: Number(g.current_savings),
        status: g.status,
        priority: g.priority,
      })),
    };

    try {
      const conversationHistory = [
        ...messages.map((m) => ({ role: m.role, content: m.content })),
        { role: "user" as const, content: query },
      ];

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: conversationHistory,
          twinContext,
          apiKey: openRouterApiKey,
          model: selectedModel,
        }),
        signal: abortController.signal,
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP ${res.status}: Failed to get response from AI`);
      }

      if (!res.body) {
        throw new Error("No response body received from server");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        appendToLastMessage(text);
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        appendToLastMessage("\n\n*(Generation stopped)*");
      } else {
        console.error("Chat streaming error:", err);
        updateLastMessage(
          `**Error:** ${err?.message || "Failed to communicate with OpenRouter."}`
        );
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  }

  function handleStop() {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }

  function handleCopy(id: string, text: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      className="max-w-7xl mx-auto space-y-5 pb-8"
    >
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b-[1.5px] border-ink pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-ink tracking-tight">
              Arthsaathi AI Sathi
            </h1>
            <span className="font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded border border-ink bg-marigold text-ink shadow-[1px_1px_0_0_var(--color-ink)]">
              Digital Advisor
            </span>
          </div>
          <p className="font-mono text-xs uppercase tracking-wider text-ink/70 mt-1">
            Grounded in your real-time financial replica · Powered by OpenRouter
          </p>
        </div>

        <div className="flex items-center gap-2">
          <ChatSettingsDialog
            open={settingsOpen}
            onOpenChange={setSettingsOpen}
            trigger={
              <Button
                variant="outline"
                size="sm"
                className="border-ink bg-paper text-ink font-mono text-xs font-bold uppercase shadow-[1.5px_1.5px_0_0_var(--color-ink)] hover:bg-marigold transition-all"
              >
                Configure Model & API Key
              </Button>
            }
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={clearMessages}
            disabled={isGenerating}
            className="border border-ink/25 text-ink/70 hover:text-clay hover:bg-clay/10 font-mono text-xs"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" /> Clear Chat
          </Button>
        </div>
      </div>

      {/* Main Grid: Left Financial Replica Context Rail + Right Conversation Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Live Financial Twin Grounding Card & Suggested Topics */}
        <motion.div variants={fadeInUp} className="lg:col-span-4 space-y-4">
          <div className="paper-card p-5 space-y-4 border-[1.5px] border-ink bg-paper shadow-[3px_3px_0_0_var(--color-ink)]">
            <div className="flex items-center justify-between border-b border-ink/15 pb-2">
              <span className="font-mono text-[10px] uppercase font-bold tracking-wider text-ink/65">
                Financial Replica Grounding
              </span>
              <Badge className="bg-emerald text-paper font-mono text-[10px] border border-ink">
                Live Synced
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded border border-ink/20 bg-paper">
                <span className="font-mono text-[10px] uppercase font-bold text-ink/60 block">
                  Net Worth
                </span>
                <span className="font-mono text-sm font-bold text-ink ticker-num">
                  {formatINR(netWorth)}
                </span>
              </div>
              <div className="p-3 rounded border border-ink/20 bg-paper">
                <span className="font-mono text-[10px] uppercase font-bold text-ink/60 block">
                  Monthly Surplus
                </span>
                <span className="font-mono text-sm font-bold text-emerald ticker-num">
                  {monthlyCashFlow >= 0 ? "+" : ""}{formatINR(monthlyCashFlow)}
                </span>
              </div>
            </div>

            <div className="space-y-2 text-xs font-sans text-ink/80 pt-1">
              <div className="flex items-center justify-between text-[11px] font-mono border-t border-ink/10 pt-2">
                <span>Holdings & Assets</span>
                <span className="font-bold">{assets.length} items ({formatINR(totalAssets)})</span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono border-t border-ink/10 pt-2">
                <span>Debt Obligations</span>
                <span className="font-bold text-clay">{liabilities.length} active ({formatINR(totalMonthlyEMI)}/mo)</span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono border-t border-ink/10 pt-2">
                <span>Active Targets</span>
                <span className="font-bold">{goals.length} goals</span>
              </div>
            </div>

            <div className="p-3 rounded border border-ink/20 bg-ink/[0.03] space-y-1 text-[11px] font-sans text-ink/75">
              <div className="font-mono text-[10px] font-bold text-ink uppercase flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald" /> Personalized Advisory
              </div>
              <p>Every response generated by AI Sathi references your real numbers, savings rate, and risk profile.</p>
            </div>
          </div>

          {/* Quick Prompts Rail */}
          <div className="paper-card p-5 space-y-3 border-[1.5px] border-ink bg-paper shadow-[3px_3px_0_0_var(--color-ink)]">
            <span className="font-mono text-[10px] uppercase font-bold tracking-wider text-ink/65 block">
              Suggested Explorations
            </span>
            <div className="space-y-2">
              {PROMPT_SUGGESTIONS.map((p, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(p)}
                  className="w-full text-left p-2.5 rounded border border-ink/20 bg-paper hover:bg-marigold/20 hover:border-ink transition-all text-xs font-sans text-ink shadow-[1px_1px_0_0_var(--color-ink)] flex items-start gap-2 group"
                >
                  <Sparkles className="w-3.5 h-3.5 text-marigold shrink-0 mt-0.5 group-hover:text-ink" />
                  <span className="leading-snug">{p}</span>
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Right Side: Conversation Thread */}
        <motion.div variants={fadeInUp} className="lg:col-span-8">
          <div className="paper-card border-[2px] border-ink shadow-[5px_5px_0_0_var(--color-ink)] bg-paper flex flex-col h-[700px] overflow-hidden rounded-lg">
            {/* Top Bar of Thread */}
            <div className="flex items-center justify-between px-5 py-3 border-b-[1.5px] border-ink bg-ink/5">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-marigold" />
                <span className="font-serif font-bold text-ink text-sm">Conversation</span>
              </div>
              <Badge variant="outline" className="font-mono text-[10px] border-ink bg-paper">
                Model: {selectedModel}
              </Badge>
            </div>

            {/* Missing Key Warning */}
            {!openRouterApiKey && (
              <div className="p-3.5 bg-marigold/20 border-b border-ink/20 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-ink">
                  <AlertCircle className="w-4 h-4 text-ink shrink-0" />
                  <span>Please provide your OpenRouter API Key to chat with your financial co-pilot.</span>
                </div>
                <Button
                  size="sm"
                  onClick={() => setSettingsOpen(true)}
                  className="border border-ink bg-paper text-ink font-mono text-[10px] font-bold uppercase shadow-[1px_1px_0_0_var(--color-ink)] hover:bg-marigold shrink-0"
                >
                  <Key className="w-3 h-3 mr-1" /> Set API Key
                </Button>
              </div>
            )}

            {/* Message History */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-paper">
              {messages.map((m) => {
                const isUser = m.role === "user";
                return (
                  <div
                    key={m.id}
                    className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
                  >
                    {!isUser && (
                      <div className="w-7 h-7 rounded bg-ink text-paper flex items-center justify-center shrink-0 border border-ink mt-0.5 shadow-[1px_1px_0_0_var(--color-ink)]">
                        <Bot className="w-4 h-4 text-marigold" />
                      </div>
                    )}

                    <div
                      className={`max-w-[85%] rounded-md p-4 text-sm leading-relaxed ${
                        isUser
                          ? "bg-ink text-paper font-sans shadow-[2px_2px_0_0_var(--color-ink)] rounded-tr-none"
                          : "bg-paper border-[1.5px] border-ink text-ink shadow-[2px_2px_0_0_var(--color-ink)] rounded-tl-none space-y-2"
                      }`}
                    >
                      {isUser ? (
                        <p className="whitespace-pre-wrap">{m.content}</p>
                      ) : (
                        <div>
                          {m.content ? (
                            <FormattedSchemeText text={m.content} />
                          ) : (
                            <span className="flex items-center gap-2 font-mono text-xs text-ink/60 italic">
                              <span className="w-1.5 h-1.5 rounded-full bg-ink animate-bounce" />
                              <span className="w-1.5 h-1.5 rounded-full bg-ink animate-bounce [animation-delay:0.2s]" />
                              <span className="w-1.5 h-1.5 rounded-full bg-ink animate-bounce [animation-delay:0.4s]" />
                              Generating financial response...
                            </span>
                          )}

                          {m.content && m.id !== "welcome-msg" && (
                            <div className="flex items-center justify-between pt-2 mt-2 border-t border-ink/10 text-[11px] font-mono text-ink/60">
                              <span>
                                {new Date(m.timestamp).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                              <button
                                onClick={() => handleCopy(m.id, m.content)}
                                className="hover:text-ink flex items-center gap-1"
                              >
                                {copiedId === m.id ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-emerald" /> Copied
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5" /> Copy response
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {isUser && (
                      <div className="w-7 h-7 rounded bg-marigold text-ink flex items-center justify-center shrink-0 border border-ink mt-0.5 shadow-[1px_1px_0_0_var(--color-ink)]">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-4 border-t-[1.5px] border-ink bg-ink/5 space-y-2">
              <div className="flex gap-2.5 items-end">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Ask a financial question (e.g. 'How can I optimize my ₹87,000 monthly surplus?')..."
                  rows={2}
                  className="resize-none min-h-[58px] border-ink bg-paper shadow-[1.5px_1.5px_0_0_var(--color-ink)] font-sans text-sm"
                />

                {isGenerating ? (
                  <Button
                    onClick={handleStop}
                    className="h-[58px] px-4 border-[1.5px] border-ink bg-clay text-paper hover:bg-clay/90 shadow-[2px_2px_0_0_var(--color-ink)] shrink-0"
                    title="Stop generation"
                  >
                    <Square className="w-4 h-4 fill-paper mr-1" /> Stop
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleSendMessage()}
                    disabled={!input.trim()}
                    className="h-[58px] px-5 border-[1.5px] border-ink bg-ink text-paper hover:bg-marigold hover:text-ink shadow-[2px_2px_0_0_var(--color-ink)] shrink-0 transition-all font-mono text-xs font-bold uppercase"
                  >
                    <Send className="w-4 h-4 mr-1.5" /> Send
                  </Button>
                )}
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-ink/60">
                <span>Press Enter to send · Shift+Enter for new line</span>
                <span>Context: Indian Personal Finance & Financial Twin Replica</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
