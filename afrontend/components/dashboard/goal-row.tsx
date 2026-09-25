"use client";

import { cn } from "@/lib/utils";
import { formatINR } from "@/lib/format";

interface GoalRowProps {
  title: string;
  progress: number; // 0–1
  targetAmount: number;
  currentSavings: number;
  status: string;
}

export function GoalRow({
  title,
  progress,
  targetAmount,
  currentSavings,
  status,
}: GoalRowProps) {
  const pct = Math.min(100, Math.round(progress * 100));

  return (
    <div className="py-3 first:pt-1 last:pb-1">
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-semibold text-ink truncate">{title}</span>
          <span
            className={cn(
              "font-mono text-[9px] uppercase px-1.5 py-0.5 rounded border border-ink font-semibold",
              status === "ACTIVE" && "bg-marigold text-ink",
              status === "ACHIEVED" && "bg-emerald text-paper",
              status === "PAUSED" && "bg-paper text-ink/60"
            )}
          >
            {status.toLowerCase()}
          </span>
        </div>
        <span className="font-mono text-xs font-bold text-ink shrink-0 ticker-num">
          {pct}%
        </span>
      </div>

      {/* Tactile progress bar */}
      <div className="w-full h-2.5 rounded border-[1.2px] border-ink bg-paper overflow-hidden relative">
        <div
          className="h-full bg-emerald transition-all duration-500 border-r-[1.2px] border-ink"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex justify-between items-center mt-1 font-mono text-[11px]">
        <span className="text-ink/75">
          Saved: <strong className="text-ink ticker-num">{formatINR(currentSavings)}</strong>
        </span>
        <span className="text-ink/60 ticker-num">
          Target: {formatINR(targetAmount)}
        </span>
      </div>
    </div>
  );
}
