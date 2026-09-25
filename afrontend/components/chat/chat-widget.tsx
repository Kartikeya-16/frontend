"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useChatStore } from "@/store/chat-store";
import { useTwinStore } from "@/store/twin-store";
import { FrequencyType } from "@/lib/types";
import { formatINR } from "@/lib/format";
import { ChatSettingsDialog } from "./chat-settings-dialog";
import { FormattedSchemeText } from "@/components/ui/formatted-scheme-text";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquareQuote,
  X,
  Send,
  Trash2,
  Sparkles,
  Bot,
  User,
  Copy,
  Check,
  Square,
  AlertCircle,
  Key,
} from "lucide-react";
import { toast } from "sonner";

const PROMPT_SUGGESTIONS = [
  "How should I allocate my monthly surplus?",
  "Should I prepay my debt obligations or invest in SIPs?",
  "Is my emergency fund sufficient for my dependents?",
  "Assess my risk appetite against my current holdings",
];

export function ChatWidget() {
  const {
    isOpen,
    toggleChat,
    setIsOpen,
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

  // Load client-stored settings on mount
  useEffect(() => {
    loadStoredSettings();
  }, [loadStoredSettings]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isGenerating]);

  // Financial calculations to ground LLM in user's replica
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

    // Check if key is available
    if (!openRouterApiKey) {
      setSettingsOpen(true);
      toast.error("Please configure your OpenRouter API key to chat with AI Sathi");
      return;
    }

    setInput("");
    addMessage({ role: "user", content: query });

    // Prepare assistant placeholder message
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
      // Build conversation history excluding placeholder
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
          `**Error:** ${err?.message || "Failed to communicate with OpenRouter. Please verify your API key and network connection in Settings."}`
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
    <>
      {/* Floating Toggle Button */}
      <div className="fixed bottom-5 right-5 z-40">
        <Button
          id="ai-sathi-launcher-btn"
          aria-label="Open AI Sathi Chat"
          onClick={toggleChat}
          className="relative h-12 px-4 rounded-full border-[1.5px] border-ink bg-ink text-paper font-mono text-xs font-bold uppercase shadow-[3px_3px_0_0_var(--color-ink)] hover:bg-marigold hover:text-ink transition-all flex items-center gap-2 group"
          title="Open AI Financial Sathi"
        >
          <Sparkles className="w-4 h-4 text-marigold group-hover:text-ink transition-colors" />
          <span className="tracking-wider">AI Sathi</span>
          {openRouterApiKey && (
            <span className="w-2 h-2 rounded-full bg-emerald absolute -top-0.5 -right-0.5 border border-ink" />
          )}
        </Button>
      </div>

      {/* Floating Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-20 right-4 sm:right-6 z-50 w-[94vw] sm:w-[460px] h-[640px] max-h-[84vh] paper-card bg-paper border-[2px] border-ink shadow-[6px_6px_0_0_var(--color-ink)] flex flex-col overflow-hidden rounded-lg"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b-[1.5px] border-ink bg-ink/5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-md bg-ink text-paper flex items-center justify-center shrink-0 border border-ink shadow-[1px_1px_0_0_var(--color-ink)]">
                  <Bot className="w-4 h-4 text-marigold" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-serif font-bold text-ink text-sm sm:text-base leading-tight truncate">
                    Arthsaathi AI Sathi
                  </h3>
                  <p className="font-mono text-[10px] text-ink/65 uppercase tracking-wider truncate">
                    {selectedModel.split("/").pop()?.replace(":free", " (free)")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <ChatSettingsDialog
                  open={settingsOpen}
                  onOpenChange={setSettingsOpen}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearMessages}
                  disabled={isGenerating}
                  className="h-8 w-8 p-0 text-ink/70 hover:text-clay hover:bg-clay/10 rounded"
                  title="Clear conversation"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8 p-0 text-ink/70 hover:text-ink hover:bg-ink/10 rounded"
                  title="Minimize chat"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Financial Twin Grounding Indicator */}
            <div className="px-3.5 py-1.5 border-b border-ink/15 bg-paper text-[11px] font-mono text-ink/75 flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-semibold truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald animate-pulse" />
                Replica Synced: {profile?.city ? `${profile.city}` : "National"} · Net Worth: {formatINR(netWorth)}
              </span>
              <span className="font-bold text-emerald shrink-0 ml-2">
                {monthlyCashFlow >= 0 ? "+" : ""}{formatINR(monthlyCashFlow)}/mo
              </span>
            </div>

            {/* Missing API Key Notice Banner */}
            {!openRouterApiKey && (
              <div className="p-3 bg-marigold/20 border-b border-ink/20 flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-ink font-sans">
                  <AlertCircle className="w-4 h-4 text-ink shrink-0" />
                  <span>OpenRouter API Key needed to start chatting.</span>
                </div>
                <Button
                  size="sm"
                  onClick={() => setSettingsOpen(true)}
                  className="h-7 px-2 border border-ink bg-paper text-ink font-mono text-[10px] font-bold uppercase shadow-[1px_1px_0_0_var(--color-ink)] hover:bg-marigold"
                >
                  <Key className="w-3 h-3 mr-1" /> Set Key
                </Button>
              </div>
            )}

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-paper">
              {messages.map((m) => {
                const isUser = m.role === "user";
                return (
                  <div
                    key={m.id}
                    className={`flex gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}
                  >
                    {!isUser && (
                      <div className="w-6 h-6 rounded bg-ink text-paper flex items-center justify-center shrink-0 border border-ink mt-0.5 shadow-[1px_1px_0_0_var(--color-ink)]">
                        <Bot className="w-3.5 h-3.5 text-marigold" />
                      </div>
                    )}

                    <div
                      className={`max-w-[85%] rounded-md p-3 text-xs leading-relaxed ${
                        isUser
                          ? "bg-ink text-paper font-sans shadow-[2px_2px_0_0_var(--color-ink)] rounded-tr-none"
                          : "bg-paper border-[1.5px] border-ink text-ink shadow-[2px_2px_0_0_var(--color-ink)] rounded-tl-none space-y-1.5"
                      }`}
                    >
                      {isUser ? (
                        <p className="whitespace-pre-wrap">{m.content}</p>
                      ) : (
                        <div>
                          {m.content ? (
                            <FormattedSchemeText text={m.content} />
                          ) : (
                            <span className="flex items-center gap-1.5 font-mono text-ink/60 italic">
                              <span className="w-1.5 h-1.5 rounded-full bg-ink animate-bounce" />
                              <span className="w-1.5 h-1.5 rounded-full bg-ink animate-bounce [animation-delay:0.2s]" />
                              <span className="w-1.5 h-1.5 rounded-full bg-ink animate-bounce [animation-delay:0.4s]" />
                              Thinking...
                            </span>
                          )}

                          {m.content && m.id !== "welcome-msg" && (
                            <div className="flex items-center justify-between pt-1 mt-1 border-t border-ink/10 text-[10px] font-mono text-ink/60">
                              <span>
                                {new Date(m.timestamp).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                              <button
                                onClick={() => handleCopy(m.id, m.content)}
                                className="hover:text-ink flex items-center gap-1 text-[10px]"
                                title="Copy response"
                              >
                                {copiedId === m.id ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald" /> Copied
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" /> Copy
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {isUser && (
                      <div className="w-6 h-6 rounded bg-marigold text-ink flex items-center justify-center shrink-0 border border-ink mt-0.5 shadow-[1px_1px_0_0_var(--color-ink)]">
                        <User className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Starter Suggestions when conversation is fresh */}
              {messages.length === 1 && (
                <div className="pt-2 space-y-2">
                  <p className="font-mono text-[10px] uppercase font-bold text-ink/60 tracking-wider">
                    Suggested Questions:
                  </p>
                  <div className="grid grid-cols-1 gap-1.5">
                    {PROMPT_SUGGESTIONS.map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(s)}
                        className="text-left p-2 rounded border border-ink/20 bg-paper/80 hover:bg-marigold/20 hover:border-ink transition-all text-xs font-sans text-ink shadow-[1px_1px_0_0_var(--color-ink)] flex items-center justify-between group"
                      >
                        <span>{s}</span>
                        <Send className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-ink shrink-0 ml-1" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-3 border-t-[1.5px] border-ink bg-ink/5 space-y-2">
              <div className="flex gap-2 items-end">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Ask financial advice, debt payoff, SIPs, schemes..."
                  rows={2}
                  className="resize-none min-h-[52px] max-h-[120px] border-ink bg-paper shadow-[1.5px_1.5px_0_0_var(--color-ink)] font-sans text-xs"
                />

                {isGenerating ? (
                  <Button
                    onClick={handleStop}
                    className="h-[52px] px-3.5 border-[1.5px] border-ink bg-clay text-paper hover:bg-clay/90 shadow-[1.5px_1.5px_0_0_var(--color-ink)] shrink-0"
                    title="Stop generation"
                  >
                    <Square className="w-4 h-4 fill-paper" />
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleSendMessage()}
                    disabled={!input.trim()}
                    className="h-[52px] px-3.5 border-[1.5px] border-ink bg-ink text-paper hover:bg-marigold hover:text-ink shadow-[1.5px_1.5px_0_0_var(--color-ink)] shrink-0 transition-all"
                    title="Send message"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                )}
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono text-ink/55">
                <span>Enter ↵ to send · Shift+Enter for newline</span>
                <span>Grounding: Financial Twin v1.0</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
