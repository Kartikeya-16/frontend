"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/lib/i18n";
import { useLanguageStore } from "@/store/language-store";

interface TranslateTextProps {
  text: string;
  k?: string; // Optional dictionary key for instant translation
  className?: string;
  as?: React.ElementType;
}

/**
 * Universal component that renders translated text.
 * 1. If a dictionary key `k` is provided, renders instantly.
 * 2. If no key is provided, checks if dictionary contains text.
 * 3. If missing, transparently queries the IndicTrans2 neural service on port 8002.
 */
export function TranslateText({
  text,
  k,
  className,
  as: Component = "span",
}: TranslateTextProps) {
  const { t, currentLang } = useTranslation();
  const translate = useLanguageStore((s) => s.translate);
  const cache = useLanguageStore((s) => s.cache);

  const [translated, setTranslated] = useState<string>(() => {
    if (k) return t(k, text);
    return text;
  });

  useEffect(() => {
    if (currentLang === "eng_Latn") {
      setTranslated(text);
      return;
    }

    if (k) {
      setTranslated(t(k, text));
      return;
    }

    // Check if cache already has it
    const cacheKey = `eng_Latn->${currentLang}:${text}`;
    if (cache[cacheKey]) {
      setTranslated(cache[cacheKey]);
      return;
    }

    let isMounted = true;
    translate(text, currentLang)
      .then((res) => {
        if (isMounted && res) {
          setTranslated(res);
        }
      })
      .catch(() => {
        if (isMounted) setTranslated(text);
      });

    return () => {
      isMounted = false;
    };
  }, [text, k, currentLang, t, translate, cache]);

  return <Component className={className}>{translated}</Component>;
}
