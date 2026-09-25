import React from "react";
import { cn } from "@/lib/utils";

interface FormattedSchemeTextProps {
  text?: string | null;
  className?: string;
  inline?: boolean;
}

/**
 * Parses inline markdown:
 * - **bold** or __bold__
 * - *italic* or _italic_
 * - `code`
 */
function parseInlineMarkdown(text: string): React.ReactNode[] {
  if (!text) return [];

  // Regex to match **bold**, *italic*, and `code`
  const tokenRegex = /(\*\*[^*]+\*\*|__[^_]+__|`[^`]+`|\*[^*]+\*|_[^_]+_)/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, index) => {
    if (!part) return null;

    if (
      (part.startsWith("**") && part.endsWith("**") && part.length >= 4) ||
      (part.startsWith("__") && part.endsWith("__") && part.length >= 4)
    ) {
      const inner = part.slice(2, -2);
      return (
        <strong key={index} className="font-semibold text-ink">
          {inner}
        </strong>
      );
    }

    if (
      (part.startsWith("*") && part.endsWith("*") && part.length >= 2) ||
      (part.startsWith("_") && part.endsWith("_") && part.length >= 2)
    ) {
      const inner = part.slice(1, -1);
      return (
        <em key={index} className="italic text-ink/90">
          {inner}
        </em>
      );
    }

    if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
      const inner = part.slice(1, -1);
      return (
        <code
          key={index}
          className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-ink/10 text-ink border border-ink/20"
        >
          {inner}
        </code>
      );
    }

    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
}

/**
 * Sanitizes legacy or scraped run-together table text (e.g. CMEGP subsidy table)
 * into a structured markdown table.
 */
function normalizeRunTogetherTables(rawText: string): string {
  if (
    rawText.includes("Categories of beneficiaries under CMEGP") ||
    rawText.includes("General Category10%15%25%") ||
    rawText.includes("General Category 10% 15% 25%")
  ) {
    return rawText.replace(
      /Categories of beneficiaries under CMEGP[\s\S]*?(?:5%25%35%|5%\s*25%\s*35%)/i,
      `### Categories of Beneficiaries & Subsidy Rates under CMEGP

| Categories of Beneficiaries | Beneficiary Contribution | Rate of Subsidy (Urban) | Rate of Subsidy (Rural) |
| :--- | :--- | :--- | :--- |
| **General Category** | 10% of project cost | 15% | 25% |
| **Special Category** (SC / ST / Women / Ex-servicemen / Differently Abled / VJNT / OBC / Minority) | 5% of project cost | 25% | 35% |`
    );
  }
  return rawText;
}

/**
 * FormattedSchemeText:
 * Safely renders scheme descriptions, benefits, and instructions.
 * Converts literal <br> and <br/> tags to natural linebreaks,
 * formats markdown bold, bullets, tables, and blockquotes with Arthsaathi's paper aesthetic.
 */
export function FormattedSchemeText({
  text,
  className,
  inline = false,
}: FormattedSchemeTextProps) {
  if (!text || typeof text !== "string") {
    return null;
  }

  // 1. Sanitize run-together tables and replace raw HTML <br> tags with newlines
  const normalized = normalizeRunTogetherTables(text);
  const cleaned = normalized.replace(/<br\s*\/?>/gi, "\n");

  if (inline) {
    const lines = cleaned.split(/\r?\n/);
    return (
      <span className={className}>
        {lines.map((line, idx) => (
          <React.Fragment key={idx}>
            {idx > 0 && <br />}
            {parseInlineMarkdown(line)}
          </React.Fragment>
        ))}
      </span>
    );
  }

  // 2. Split into distinct blocks separated by double newlines
  const rawBlocks = cleaned.split(/\n\s*\n/);

  return (
    <div className={cn("space-y-3 font-sans leading-relaxed", className)}>
      {rawBlocks.map((block, blockIdx) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        const lines = trimmed.split(/\r?\n/);

        // Check if this block is a Markdown table
        const tableLines = lines.filter(
          (l) => l.trim().startsWith("|") && l.trim().endsWith("|")
        );
        if (tableLines.length >= 2) {
          const headerRow = tableLines[0]
            .split("|")
            .slice(1, -1)
            .map((c) => c.trim());
          const dataRows = tableLines
            .slice(1)
            .filter((l) => !/^\s*\|(?:\s*:?-+:?\s*\|)+\s*$/.test(l)) // omit separator row
            .map((row) =>
              row
                .split("|")
                .slice(1, -1)
                .map((c) => c.trim())
            );

          return (
            <div
              key={blockIdx}
              className="overflow-x-auto my-3 rounded border border-ink shadow-[2px_2px_0_0_var(--color-ink)] bg-paper"
            >
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b-2 border-ink bg-paper-light">
                    {headerRow.map((head, hIdx) => (
                      <th
                        key={hIdx}
                        className="p-2.5 font-mono uppercase font-bold text-ink border-r last:border-r-0 border-ink/20"
                      >
                        {parseInlineMarkdown(head)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dataRows.map((cells, rIdx) => (
                    <tr
                      key={rIdx}
                      className="border-b border-ink/15 last:border-b-0 hover:bg-marigold/10 transition-colors"
                    >
                      {cells.map((cell, cIdx) => (
                        <td
                          key={cIdx}
                          className="p-2.5 text-ink/90 border-r last:border-r-0 border-ink/15 align-top font-sans"
                        >
                          {parseInlineMarkdown(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        // Check if this block is a header
        if (/^#{1,4}\s+/.test(trimmed)) {
          const headerText = trimmed.replace(/^#{1,4}\s+/, "");
          return (
            <h3
              key={blockIdx}
              className="font-serif font-bold text-sm sm:text-base text-ink mt-2 mb-1"
            >
              {parseInlineMarkdown(headerText)}
            </h3>
          );
        }

        // Check if this block is a blockquote
        if (lines.every((l) => l.trim().startsWith(">"))) {
          return (
            <blockquote
              key={blockIdx}
              className="border-l-2 border-marigold pl-3.5 my-2 italic text-ink/85 bg-marigold/5 py-1 rounded-r text-xs sm:text-sm"
            >
              {lines.map((line, lIdx) => (
                <p key={lIdx}>
                  {parseInlineMarkdown(line.replace(/^>\s*/, ""))}
                </p>
              ))}
            </blockquote>
          );
        }

        // Check if this block is a list
        const isBulletList = lines.every((l) =>
          /^\s*(?:[-*•]|\d+[\.\)])\s+/.test(l)
        );

        if (isBulletList) {
          return (
            <ul key={blockIdx} className="space-y-1.5 my-2 list-none">
              {lines.map((line, lIdx) => {
                const bulletMatch = line.match(/^\s*(?:[-*•]|\d+[\.\)])\s+(.*)$/);
                const content = bulletMatch ? bulletMatch[1] : line;
                return (
                  <li key={lIdx} className="flex items-start gap-2 text-xs sm:text-sm">
                    <span className="text-marigold font-bold select-none shrink-0 mt-0.5">
                      •
                    </span>
                    <span className="flex-1 text-ink/85">
                      {parseInlineMarkdown(content)}
                    </span>
                  </li>
                );
              })}
            </ul>
          );
        }

        // Standard paragraph block (might contain internal single newlines or inline bullets)
        return (
          <div key={blockIdx} className="space-y-1 text-xs sm:text-sm text-ink/85">
            {lines.map((line, lIdx) => {
              const trimmedLine = line.trim();
              if (/^\s*(?:[-*•]|\d+[\.\)])\s+/.test(trimmedLine)) {
                const bulletMatch = trimmedLine.match(/^\s*(?:[-*•]|\d+[\.\)])\s+(.*)$/);
                const content = bulletMatch ? bulletMatch[1] : trimmedLine;
                return (
                  <div key={lIdx} className="flex items-start gap-2 pl-2 my-1">
                    <span className="text-marigold font-bold select-none shrink-0 mt-0.5">
                      •
                    </span>
                    <span className="flex-1">{parseInlineMarkdown(content)}</span>
                  </div>
                );
              }

              return (
                <p key={lIdx} className="leading-relaxed">
                  {parseInlineMarkdown(line)}
                </p>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

export default FormattedSchemeText;

