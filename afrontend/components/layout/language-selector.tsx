"use client";

import { useEffect, useState, useRef } from "react";
import { useLanguageStore } from "@/store/language-store";
import { Globe, Check, Loader2, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// High-priority display names for Indian languages
const POPULAR_LANGUAGES: Record<string, { label: string; native: string }> = {
  eng_Latn: { label: "English", native: "English" },
  hin_Deva: { label: "Hindi", native: "हिंदी" },
  mar_Deva: { label: "Marathi", native: "मराठी" },
  tam_Taml: { label: "Tamil", native: "தமிழ்" },
  tel_Telu: { label: "Telugu", native: "తెలుగు" },
  ben_Beng: { label: "Bengali", native: "বাংলা" },
  guj_Gujr: { label: "Gujarati", native: "ગુજરાતી" },
  kan_Knda: { label: "Kannada", native: "ಕನ್ನಡ" },
  pan_Guru: { label: "Punjabi", native: "ਪੰਜਾਬੀ" },
  mal_Mlym: { label: "Malayalam", native: "മലയാളം" },
  urd_Arab: { label: "Urdu", native: "اردو" },
  ory_Orya: { label: "Odia", native: "ଓଡ଼ିଆ" },
  asm_Beng: { label: "Assamese", native: "অসমীয়া" },
};

interface LanguageSelectorProps {
  collapsed?: boolean;
  className?: string;
  direction?: "up" | "down";
  align?: "left" | "right";
}

export function LanguageSelector({
  collapsed = false,
  className,
  direction = "down",
  align = "left",
}: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    selectedLang,
    supportedLanguages,
    isServiceConnected,
    isTranslating,
    setLanguage,
    checkHealth,
    loadLanguages,
  } = useLanguageStore();

  useEffect(() => {
    checkHealth();
    loadLanguages();
    const interval = setInterval(() => {
      checkHealth();
    }, 10000);
    return () => clearInterval(interval);
  }, [checkHealth, loadLanguages]);

  // Handle outside click & escape key to close dropdown
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const currentMeta = POPULAR_LANGUAGES[selectedLang] || {
    label: supportedLanguages[selectedLang] || selectedLang,
    native: supportedLanguages[selectedLang] || selectedLang,
  };

  const handleSelect = (langCode: string) => {
    setLanguage(langCode);
    setIsOpen(false);
    const meta = POPULAR_LANGUAGES[langCode];
    toast.success(`Language changed to ${meta?.native || meta?.label || langCode}`);
  };

  // Combine POPULAR_LANGUAGES with any extra languages returned by API
  const allLanguages = { ...POPULAR_LANGUAGES };
  if (supportedLanguages) {
    Object.entries(supportedLanguages).forEach(([code, name]) => {
      if (!allLanguages[code]) {
        allLanguages[code] = {
          label: name.split("(")[0].trim(),
          native: name,
        };
      }
    });
  }

  return (
    <div ref={containerRef} className={cn("relative select-none", className)}>
      {collapsed ? (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          title={`Language: ${currentMeta.native} (${isServiceConnected ? "Service Online" : "Service Offline"})`}
          className="relative w-9 h-9 mx-auto rounded border border-ink bg-paper flex items-center justify-center text-ink hover:bg-marigold/20 transition-all shadow-[1px_1px_0_0_var(--color-ink)] cursor-pointer"
        >
          <Globe className="w-4 h-4 text-ink" />
          <span
            className={cn(
              "absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border border-paper",
              isServiceConnected ? "bg-emerald shadow-[0_0_4px_var(--color-emerald)]" : "bg-clay"
            )}
          />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          className="w-full flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded border border-ink bg-paper hover:bg-marigold/10 transition-all shadow-[1.5px_1.5px_0_0_var(--color-ink)] text-left cursor-pointer active:translate-x-[0.5px] active:translate-y-[0.5px]"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Globe className="w-3.5 h-3.5 text-ink shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="font-sans text-xs font-bold text-ink truncate leading-tight">
                {currentMeta.native}
              </span>
              <span className="font-mono text-[9px] uppercase tracking-wider text-ink/60 truncate leading-tight">
                {currentMeta.label}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 ml-1">
            {isTranslating ? (
              <Loader2 className="w-3 h-3 text-marigold animate-spin" />
            ) : (
              <span
                title={
                  isServiceConnected
                    ? "IndicTrans2 ML Service Connected (Port 8002)"
                    : "IndicTrans2 Service Disconnected"
                }
                className={cn(
                  "w-2 h-2 rounded-full shrink-0",
                  isServiceConnected
                    ? "bg-emerald shadow-[0_0_6px_var(--color-emerald)]"
                    : "bg-clay"
                )}
              />
            )}
            <ChevronDown
              className={cn(
                "w-3.5 h-3.5 text-ink/70 shrink-0 transition-transform duration-200",
                isOpen && (direction === "up" ? "-rotate-180" : "rotate-180")
              )}
            />
          </div>
        </button>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          role="listbox"
          aria-label="Select Language"
          className={cn(
            "absolute z-50 w-56 max-h-64 overflow-y-auto bg-paper border-[1.5px] border-ink rounded-md p-1.5 shadow-[3px_3px_0_0_var(--color-ink)]",
            direction === "up" ? "bottom-full mb-2" : "top-full mt-2",
            align === "right" ? "right-0" : "left-0"
          )}
        >
          <div className="px-2 py-1.5 border-b border-ink/10 mb-1 flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase font-bold text-ink/70">
              Select Language
            </span>
            <span
              className={cn(
                "font-mono text-[9px] px-1.5 py-0.5 rounded border",
                isServiceConnected
                  ? "border-emerald/40 bg-emerald/10 text-emerald"
                  : "border-clay/40 bg-clay/10 text-clay"
              )}
            >
              {isServiceConnected ? "Port 8002 Active" : "Fallback Mode"}
            </span>
          </div>

          <div className="space-y-0.5">
            {Object.entries(allLanguages).map(([code, meta]) => {
              const isSelected = selectedLang === code;
              return (
                <button
                  key={code}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(code)}
                  className={cn(
                    "w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs transition-colors cursor-pointer",
                    isSelected
                      ? "bg-ink text-paper font-semibold"
                      : "text-ink hover:bg-marigold/20"
                  )}
                >
                  <div className="flex flex-col text-left">
                    <span className="font-sans">{meta.native}</span>
                    <span
                      className={cn(
                        "text-[9px] font-mono",
                        isSelected ? "text-paper/70" : "text-ink/60"
                      )}
                    >
                      {meta.label}
                    </span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
