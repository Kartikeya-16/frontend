import { api, ml2Api } from "./client";

export interface LanguagesResponse {
  languages: Record<string, string>;
}

export interface TranslateRequest {
  text: string;
  src_lang?: string;
  tgt_lang?: string;
}

export interface TranslateResponse {
  translated_text: string;
  src_lang: string;
  tgt_lang: string;
}

export interface BatchTranslateRequest {
  texts: string[];
  src_lang?: string;
  tgt_lang?: string;
}

export interface BatchTranslateResponse {
  translated_texts: string[];
  src_lang: string;
  tgt_lang: string;
}

export interface TranslationHealthResponse {
  status: string;
  device?: string;
  loaded_models?: Record<string, boolean>;
  model_version?: string;
}

export async function checkTranslationHealth(): Promise<TranslationHealthResponse | null> {
  try {
    const res = await ml2Api.get<TranslationHealthResponse>("/health", { timeout: 2500 });
    return res.data;
  } catch {
    try {
      const proxyRes = await api.get<TranslationHealthResponse>("/translate/health", { timeout: 2500 });
      return proxyRes.data;
    } catch {
      return null;
    }
  }
}

export async function getSupportedLanguages(): Promise<Record<string, string>> {
  try {
    const res = await ml2Api.get<Record<string, string> | LanguagesResponse>("/languages", { timeout: 3000 });
    if ("languages" in res.data && typeof res.data.languages === "object") {
      return res.data.languages;
    }
    return res.data as Record<string, string>;
  } catch {
    try {
      const proxyRes = await api.get<Record<string, string> | LanguagesResponse>("/translate/languages", { timeout: 3000 });
      if ("languages" in proxyRes.data && typeof proxyRes.data.languages === "object") {
        return proxyRes.data.languages;
      }
      return proxyRes.data as Record<string, string>;
    } catch (err) {
      console.warn("Translation service offline, using default fallback language map:", err);
      return {
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
    }
  }
}


export async function translateText(
  text: string,
  tgtLang: string = "hin_Deva",
  srcLang: string = "eng_Latn"
): Promise<string> {
  const payload = {
    text,
    src_lang: srcLang,
    tgt_lang: tgtLang,
  };
  try {
    const res = await api.post<TranslateResponse>("/translate", payload);
    return res.data.translated_text;
  } catch (err) {
    try {
      const resFallback = await ml2Api.post<TranslateResponse>("/translate", payload);
      return resFallback.data.translated_text;
    } catch (fallbackErr) {
      console.warn("Translation failed, returning original text:", fallbackErr);
      return text;
    }
  }
}

export async function translateBatch(
  texts: string[],
  tgtLang: string = "hin_Deva",
  srcLang: string = "eng_Latn"
): Promise<string[]> {
  const payload = {
    texts,
    src_lang: srcLang,
    tgt_lang: tgtLang,
  };
  try {
    const res = await api.post<BatchTranslateResponse>("/translate/batch", payload);
    return res.data.translated_texts;
  } catch (err) {
    try {
      const resFallback = await ml2Api.post<BatchTranslateResponse>("/translate/batch", payload);
      return resFallback.data.translated_texts;
    } catch (fallbackErr) {
      console.warn("Batch translation failed, returning original texts:", fallbackErr);
      return texts;
    }
  }
}
