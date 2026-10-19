"use client";

import { useState } from "react";
import type { FdRecommendations as FdRecommendationsType } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface FdRecommendationsProps {
  data?: FdRecommendationsType;
}

export function FdRecommendations({ data }: FdRecommendationsProps) {
  const [activeTab, setActiveTab] = useState<"1y" | "3y" | "5y" | "tax_saver">("1y");
  if (!data) return null;

  const isSenior = data.rate_type === "senior";
  const hasTaxSaver = data.tax_saver && data.tax_saver.length > 0;

  const currentFds =
    activeTab === "tax_saver"
      ? data.tax_saver
      : data.by_tenure[activeTab] || [];

  return (
    <div className="rounded-2xl border bg-card p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h3 className="text-lg font-bold text-foreground">
              Fixed deposit options for you
            </h3>
            {isSenior && (
              <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 text-xs font-semibold">
                Senior citizen rates
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Rates as of {data.as_of} • Comparing verified bank & post office deposits
          </p>
        </div>

        {/* Tenure Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-muted/60 rounded-xl border self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab("1y")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
              activeTab === "1y"
                ? "bg-card text-foreground shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            1 Year
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("3y")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
              activeTab === "3y"
                ? "bg-card text-foreground shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            3 Years
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("5y")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
              activeTab === "5y"
                ? "bg-card text-foreground shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            5 Years
          </button>
          {hasTaxSaver && (
            <button
              type="button"
              onClick={() => setActiveTab("tax_saver")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                activeTab === "tax_saver"
                  ? "bg-card text-foreground shadow-sm font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Tax-saver (5Y)
            </button>
          )}
        </div>
      </div>

      {/* FD Options Table */}
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-xs text-left">
          <thead className="bg-muted text-muted-foreground font-medium">
            <tr>
              <th className="p-3">Bank / Institution</th>
              <th className="p-3">Type</th>
              <th className="p-3">Interest Rate</th>
              <th className="p-3">Safety & Details</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {currentFds.map((fd, idx) => {
              const rate = isSenior ? fd.rate_senior_pct : fd.rate_general_pct;
              const isTop = idx === 0;

              let typeBadge = (
                <Badge variant="outline" className="text-[10px] uppercase">
                  Private
                </Badge>
              );
              if (fd.bank_type === "psu") {
                typeBadge = (
                  <Badge variant="outline" className="text-[10px] text-blue-600 border-blue-500/30 uppercase">
                    Public sector
                  </Badge>
                );
              } else if (fd.bank_type === "sfb") {
                typeBadge = (
                  <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-500/30 uppercase">
                    Small finance
                  </Badge>
                );
              }

              return (
                <tr
                  key={`${fd.bank_id}_${idx}`}
                  className={cn(
                    "hover:bg-muted/30 transition-colors",
                    isTop && "bg-primary/[0.03]"
                  )}
                >
                  <td className="p-3 font-medium text-foreground flex items-center gap-2">
                    <span>{fd.bank_name}</span>
                    {isTop && (
                      <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[9px] font-bold">
                        Top Rate
                      </Badge>
                    )}
                  </td>
                  <td className="p-3">{typeBadge}</td>
                  <td className="p-3">
                    <span className={cn("font-bold text-sm", isTop ? "text-primary" : "text-foreground")}>
                      {rate}%
                    </span>
                    {isSenior && fd.rate_senior_pct !== fd.rate_general_pct && (
                      <span className="text-[10px] text-muted-foreground block">
                        (General: {fd.rate_general_pct}%)
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-[11px] text-muted-foreground">
                    {fd.note || fd.notes || "DICGC insured up to ₹5 Lakh"}
                  </td>
                </tr>
              );
            })}

            {/* Post Office (Government-Backed) alternative row */}
            {data.post_office_td && data.post_office_td.length > 0 && (
              <>
                <tr className="bg-muted/50 border-t-2 font-semibold">
                  <td colSpan={4} className="p-2.5 text-xs text-foreground uppercase tracking-wider">
                    Post office (government-backed)
                  </td>
                </tr>
                {data.post_office_td
                  .filter((po) => {
                    if (activeTab === "1y") return po.tenure_years === 1;
                    if (activeTab === "3y") return po.tenure_years === 3;
                    if (activeTab === "5y" || activeTab === "tax_saver") return po.tenure_years === 5;
                    return true;
                  })
                  .map((po) => (
                    <tr key={po.scheme_id} className="hover:bg-muted/20 bg-muted/10">
                      <td className="p-3 font-medium text-foreground">
                        {po.name}
                      </td>
                      <td className="p-3">
                        <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/30 uppercase">
                          Sovereign
                        </Badge>
                      </td>
                      <td className="p-3">
                        <span className="font-bold text-sm text-foreground">
                          {po.rate_pct}%
                        </span>
                      </td>
                      <td className="p-3 text-[11px] text-muted-foreground">
                        100% backed by Government of India sovereign guarantee
                        {po.tax_deduction_eligible && " • Eligible for Section 123 deduction"}
                      </td>
                    </tr>
                  ))}
              </>
            )}
          </tbody>
        </table>
      </div>

      {/* Safety note and SFB info box */}
      <div className="space-y-2">
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl border bg-muted/30 text-xs text-muted-foreground">
          <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <span>{data.safety_note}</span>
        </div>

        {data.sfb_hidden && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl border border-blue-500/20 bg-blue-500/10 text-xs text-blue-700 dark:text-blue-300">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" />
            <span>
              Small finance banks are hidden because your risk profile is conservative. Only public sector and established private banks are displayed.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
