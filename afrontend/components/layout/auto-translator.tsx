"use client";

import { useEffect, useRef } from "react";
import { useLanguageStore } from "@/store/language-store";
import { lookupDictionaryTranslation } from "@/lib/i18n";

/**
 * WeakMap to store the original English text of every text node
 * so translations are strictly non-destructive and can revert to English instantly.
 */
const originalTextMap = new WeakMap<Node, string>();
const translatedNodes = new WeakSet<Node>();
const translatedPlaceholders = new WeakSet<Element>();

/**
 * In-memory set of strings currently in flight to port 8002 / 8000
 * to avoid duplicate concurrent translation network requests.
 */
const inFlightRequests = new Set<string>();

/**
 * Tags that must NEVER have their contents translated.
 */
const IGNORED_TAGS = new Set([
  "SCRIPT",
  "STYLE",
  "SVG",
  "PATH",
  "CODE",
  "PRE",
  "NOSCRIPT",
  "TEXTAREA",
  "INPUT",
]);

/**
 * Check if a string should not be translated (e.g. pure numbers, currencies, dates, code).
 */
function shouldSkipText(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length < 2) return true;
  // Pure numbers, currencies, percentages, dates, UUIDs, math symbols
  if (/^[0-9\s₹$€%.,\-–+/:()\[\]#'"_]+$/.test(trimmed)) return true;
  // UUIDs or hex strings
  if (/^[0-9a-f]{8}-[0-9a-f]{4}/i.test(trimmed)) return true;
  return false;
}

/**
 * AutoTranslator
 * 
 * Mounts globally in RootLayout. Whenever `selectedLang` is not `eng_Latn`,
 * it automatically traverses the DOM, translates all visible text nodes using:
 * 1. Instant Vernacular Dictionary (0ms latency for hundreds of UI strings)
 * 2. Cached Translations from SQLite WAL database / localStorage
 * 3. Batched IndicTrans2 neural translation requests via port 8002
 * 
 * Uses a MutationObserver so dynamically mounted components, route navigations,
 * and dialogs are automatically translated as well.
 */
export function AutoTranslator() {
  const selectedLang = useLanguageStore((s) => s.selectedLang);
  const translateBatch = useLanguageStore((s) => s.translateBatch);
  const cache = useLanguageStore((s) => s.cache);
  const isTranslating = useLanguageStore((s) => s.isTranslating);

  const pendingBatchRef = useRef<Set<string>>(new Set());
  const batchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    function processTextNode(node: Text) {
      // Check if parent element is ignored
      const parent = node.parentElement;
      if (!parent || IGNORED_TAGS.has(parent.tagName)) return;
      if (parent.closest("[data-no-translate]") || parent.closest(".no-translate")) return;
      if (parent.getAttribute("translate") === "no") return;

      // Capture original English text on first encounter
      let original = originalTextMap.get(node);
      if (original === undefined) {
        original = node.nodeValue || "";
        originalTextMap.set(node, original);
      }

      if (!original) return;

      // If user selected English, only restore nodes that were actively translated
      if (selectedLang === "eng_Latn") {
        if (translatedNodes.has(node)) {
          const originalText = originalTextMap.get(node);
          if (originalText !== undefined && node.nodeValue !== originalText) {
            node.nodeValue = originalText;
          }
          translatedNodes.delete(node);
        }
        return;
      }

      const trimmed = original.trim();
      if (shouldSkipText(trimmed)) return;

      // Extract leading and trailing whitespace to preserve formatting
      const leadingMatch = original.match(/^\s*/);
      const trailingMatch = original.match(/\s*$/);
      const leading = leadingMatch ? leadingMatch[0] : "";
      const trailing = trailingMatch ? trailingMatch[0] : "";

      // 1. Check instant vernacular dictionary
      let dictTranslation = lookupDictionaryTranslation(trimmed, selectedLang);
      if (!dictTranslation) {
        const stripped = trimmed.replace(/[.:,!?;]+$/, "").trim();
        if (stripped !== trimmed) {
          const strippedTrans = lookupDictionaryTranslation(stripped, selectedLang);
          if (strippedTrans) {
            const punct = trimmed.slice(stripped.length);
            dictTranslation = strippedTrans + punct;
          }
        }
      }
      if (dictTranslation) {
        const fullTranslated = leading + dictTranslation + trailing;
        if (node.nodeValue !== fullTranslated) {
          node.nodeValue = fullTranslated;
          translatedNodes.add(node);
        }
        return;
      }

      // 2. Check translation cache
      const cacheKey = `eng_Latn->${selectedLang}:${trimmed}`;
      const cached = cache[cacheKey];
      if (cached) {
        const fullTranslated = leading + cached + trailing;
        if (node.nodeValue !== fullTranslated) {
          node.nodeValue = fullTranslated;
          translatedNodes.add(node);
        }
        return;
      }

      // 3. Queue for IndicTrans2 neural translation batch
      if (!inFlightRequests.has(cacheKey)) {
        pendingBatchRef.current.add(trimmed);
        scheduleBatchTranslation();
      }
    }

    function scanPlaceholders() {
      if (typeof document === "undefined") return;
      const inputs = document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
        "input[placeholder], textarea[placeholder]"
      );
      inputs.forEach((el) => {
        if (
          el.closest("[data-no-translate]") ||
          el.closest(".no-translate") ||
          el.getAttribute("translate") === "no"
        )
          return;

        const currentPh = el.placeholder;
        if (!currentPh || shouldSkipText(currentPh)) return;

        let orig = (el as any).__orig_ph;
        if (orig === undefined) {
          orig = currentPh;
          (el as any).__orig_ph = orig;
        }

        if (selectedLang === "eng_Latn") {
          if (translatedPlaceholders.has(el)) {
            if (el.placeholder !== orig) el.placeholder = orig;
            translatedPlaceholders.delete(el);
          }
          return;
        }

        const dict = lookupDictionaryTranslation(orig.trim(), selectedLang);
        if (dict) {
          if (el.placeholder !== dict) {
            el.placeholder = dict;
            translatedPlaceholders.add(el);
          }
          return;
        }

        const cacheKey = `eng_Latn->${selectedLang}:${orig.trim()}`;
        const cached = cache[cacheKey];
        if (cached) {
          if (el.placeholder !== cached) {
            el.placeholder = cached;
            translatedPlaceholders.add(el);
          }
          return;
        }

        if (!inFlightRequests.has(cacheKey)) {
          pendingBatchRef.current.add(orig.trim());
          scheduleBatchTranslation();
        }
      });
    }

    function scanDom(root: Node = document.body) {
      const walker = document.createTreeWalker(
        root,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode(node) {
            const parent = node.parentElement;
            if (!parent || IGNORED_TAGS.has(parent.tagName)) {
              return NodeFilter.FILTER_REJECT;
            }
            if (parent.closest("[data-no-translate]") || parent.closest(".no-translate")) {
              return NodeFilter.FILTER_REJECT;
            }
            if (parent.getAttribute("translate") === "no") {
              return NodeFilter.FILTER_REJECT;
            }
            return NodeFilter.FILTER_ACCEPT;
          },
        }
      );

      let currentNode = walker.nextNode();
      while (currentNode) {
        processTextNode(currentNode as Text);
        currentNode = walker.nextNode();
      }
      scanPlaceholders();
    }

    function scheduleBatchTranslation() {
      if (batchTimeoutRef.current) return;

      batchTimeoutRef.current = setTimeout(async () => {
        batchTimeoutRef.current = null;
        const textsToTranslate = Array.from(pendingBatchRef.current).slice(0, 12);
        if (textsToTranslate.length === 0) return;

        textsToTranslate.forEach((t) => {
          pendingBatchRef.current.delete(t);
          inFlightRequests.add(`eng_Latn->${selectedLang}:${t}`);
        });

        try {
          await translateBatch(textsToTranslate, selectedLang, "eng_Latn");
          // Re-scan to apply the newly cached translations to matching text nodes
          scanDom();
        } catch {
          // Failure handled gracefully
        } finally {
          textsToTranslate.forEach((t) => {
            inFlightRequests.delete(`eng_Latn->${selectedLang}:${t}`);
          });
          // If more items remain in queue, process next chunk
          if (pendingBatchRef.current.size > 0) {
            scheduleBatchTranslation();
          }
        }
      }, 80);
    }

    // Initial DOM pass
    scanDom();

    // In English, the native UI already renders directly from React state without translation.
    // We only needed the pass above to restore any previously translated nodes if switching from another language.
    if (selectedLang === "eng_Latn") {
      return;
    }

    // Set up MutationObserver to handle Next.js client routing and dynamic DOM updates
    let debounceTimer: NodeJS.Timeout | null = null;
    const observer = new MutationObserver((mutations) => {
      let hasSignificantChanges = false;
      for (const m of mutations) {
        if (m.type === "childList" && m.addedNodes.length > 0) {
          hasSignificantChanges = true;
          break;
        }
        if (m.type === "characterData") {
          const target = m.target as Text;
          const currentVal = target.nodeValue || "";
          const savedOrig = originalTextMap.get(target);
          if (savedOrig === undefined && currentVal.trim()) {
            hasSignificantChanges = true;
            break;
          }
        }
      }

      if (hasSignificantChanges) {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          scanDom();
        }, 100);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => {
      observer.disconnect();
      if (batchTimeoutRef.current) clearTimeout(batchTimeoutRef.current);
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, [selectedLang, cache, translateBatch]);

  return null;
}
