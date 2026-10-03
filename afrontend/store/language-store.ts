import { create } from "zustand";
import {
  checkTranslationHealth,
  getSupportedLanguages,
  translateText,
  translateBatch,
  type TranslationHealthResponse,
} from "@/lib/api/translate";

interface LanguageState {
  selectedLang: string;
  supportedLanguages: Record<string, string>;
  isServiceConnected: boolean;
  isTranslating: boolean;
  healthInfo: TranslationHealthResponse | null;
  cache: Record<string, string>;

  setLanguage: (lang: string) => void;
  checkHealth: () => Promise<boolean>;
  loadLanguages: () => Promise<void>;
  translate: (text: string, tgtLang?: string, srcLang?: string) => Promise<string>;
  translateBatch: (texts: string[], tgtLang?: string, srcLang?: string) => Promise<string[]>;
}

const DEFAULT_LANGUAGES: Record<string, string> = {
  eng_Latn: "English",
  hin_Deva: "Hindi",
  mar_Deva: "Marathi",
  tam_Taml: "Tamil",
  tel_Telu: "Telugu",
  kan_Knda: "Kannada",
  ben_Beng: "Bengali",
  guj_Gujr: "Gujarati",
  pan_Guru: "Punjabi",
  urd_Arab: "Urdu",
  mal_Mlym: "Malayalam",
  ory_Orya: "Odia",
  asm_Beng: "Assamese",
};

const getInitialLang = (): string => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("arthsaathi_selected_language") || "eng_Latn";
  }
  return "eng_Latn";
};

export const useLanguageStore = create<LanguageState>((set, get) => ({
  selectedLang: getInitialLang(),
  supportedLanguages: DEFAULT_LANGUAGES,
  isServiceConnected: false,
  isTranslating: false,
  healthInfo: null,
  cache: {},

  setLanguage: (lang: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("arthsaathi_selected_language", lang);
    }
    set({ selectedLang: lang });
  },

  checkHealth: async () => {
    try {
      const health = await checkTranslationHealth();
      const connected = !!health && health.status === "ok";
      set({
        isServiceConnected: connected,
        healthInfo: health,
      });
      return connected;
    } catch {
      set({
        isServiceConnected: false,
        healthInfo: null,
      });
      return false;
    }
  },

  loadLanguages: async () => {
    try {
      const langs = await getSupportedLanguages();
      if (langs && Object.keys(langs).length > 0) {
        set({
          supportedLanguages: {
            ...DEFAULT_LANGUAGES,
            ...langs,
          },
        });
      }
    } catch (err) {
      console.warn("Failed to load languages dynamically:", err);
    }
  },

  translate: async (text: string, tgtLang?: string, srcLang: string = "eng_Latn") => {
    const target = tgtLang || get().selectedLang;
    if (!text || !text.trim() || target === "eng_Latn" || target === srcLang) {
      return text;
    }

    const cacheKey = `${srcLang}->${target}:${text.trim()}`;
    const cached = get().cache[cacheKey];
    if (cached) return cached;

    set({ isTranslating: true });
    try {
      const res = await translateText(text, target, srcLang);
      set((state) => ({
        cache: { ...state.cache, [cacheKey]: res },
        isTranslating: false,
      }));
      return res;
    } catch {
      set({ isTranslating: false });
      return text;
    }
  },

  translateBatch: async (texts: string[], tgtLang?: string, srcLang: string = "eng_Latn") => {
    const target = tgtLang || get().selectedLang;
    if (!texts || texts.length === 0 || target === "eng_Latn" || target === srcLang) {
      return texts;
    }

    set({ isTranslating: true });
    try {
      const results = await translateBatch(texts, target, srcLang);
      const newCacheEntries: Record<string, string> = {};
      texts.forEach((original, idx) => {
        const translated = results[idx] || original;
        newCacheEntries[`${srcLang}->${target}:${original.trim()}`] = translated;
      });

      set((state) => ({
        cache: { ...state.cache, ...newCacheEntries },
        isTranslating: false,
      }));
      return results;
    } catch {
      set({ isTranslating: false });
      return texts;
    }
  },
}));
