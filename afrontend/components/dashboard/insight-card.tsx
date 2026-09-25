"use client";

import { motion } from "motion/react";
import { fadeInUp } from "@/lib/motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface InsightCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  variant?: "default" | "warning" | "success";
}

export function InsightCard({
  icon: Icon,
  title,
  description,
  variant = "default",
}: InsightCardProps) {
  return (
    <motion.div {...fadeInUp}>
      <div
        className={cn(
          "paper-card p-5",
          variant === "warning" && "bg-marigold/10 border-ink",
          variant === "success" && "bg-emerald/10 border-ink",
          variant === "default" && "bg-paper border-ink"
        )}
      >
        <div className="flex items-start gap-3.5">
          <div
            className={cn(
              "w-10 h-10 rounded border-[1.5px] border-ink flex items-center justify-center shrink-0 shadow-[2px_2px_0_0_var(--color-ink)]",
              variant === "warning" && "bg-marigold text-ink",
              variant === "success" && "bg-emerald text-paper",
              variant === "default" && "bg-ink text-paper"
            )}
          >
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-serif text-base font-bold text-ink">{title}</h4>
              <span
                className={cn(
                  "font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded border border-ink shadow-[1px_1px_0_0_var(--color-ink)]",
                  variant === "warning" && "bg-marigold text-ink",
                  variant === "success" && "bg-emerald text-paper",
                  variant === "default" && "bg-paper text-ink"
                )}
              >
                {variant === "warning" ? "Action Required" : "Twin Insight"}
              </span>
            </div>
            <p className="text-xs text-ink/80 mt-1.5 leading-relaxed">
              {description}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
