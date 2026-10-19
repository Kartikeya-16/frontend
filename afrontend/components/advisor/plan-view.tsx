"use client";

import { useAdvisorStore } from "@/store/advisor-store";
import { formatINR } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FdRecommendations } from "./fd-recommendations";
import Link from "next/link";

export function PlanView() {
  const { plan, mode, twinUpdatedAt, setStep, generatePlan, startOver, isLoadingPlan } = useAdvisorStore();

  if (!plan) return null;

  const {
    summary,
    risk,
    actions,
    goals,
    eligible_small_savings,
    tax_saving,
    assumptions,
    data_freshness,
    disclaimer,
  } = plan;

  const isSurplusNegative = summary.monthly_surplus_inr < 0;

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Your Comprehensive Financial Plan
            </h2>
            {mode === "twin" ? (
              <Badge className="bg-primary/10 text-primary border-primary/20 text-xs font-semibold">
                Based on your Financial Twin{twinUpdatedAt ? ' (updated ' + new Date(twinUpdatedAt).toLocaleDateString() + ')' : ''}
              </Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground border-border text-xs font-semibold">
                Scenario plan - manual entry
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Personalized actionable steps, debt reduction order, and goal asset allocation.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={startOver}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Start over
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setStep(1)}
            className="gap-1.5"
          >
            <Pencil className="w-3.5 h-3.5" /> Edit Answers
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={isLoadingPlan}
            onClick={generatePlan}
            className="gap-1.5 shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Recalculate
          </Button>
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Monthly Surplus */}
        <div className="rounded-2xl border bg-card p-5 shadow-sm space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Monthly Surplus
          </p>
          <p
            className={cn(
              "text-2xl font-bold tracking-tight",
              isSurplusNegative ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
            )}
          >
            {formatINR(summary.monthly_surplus_inr)}
          </p>
          <p className="text-xs text-muted-foreground">
            Inflow {formatINR(summary.inflow_inr)} - Outflow {formatINR(summary.outflow_inr)}
          </p>
        </div>

        {/* Emergency Fund Cushion */}
        <div className="rounded-2xl border bg-card p-5 shadow-sm space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Emergency Cushion
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-foreground">
              {summary.emergency_fund_months} Months
            </span>
            <span className="text-xs text-muted-foreground">/ 6 target</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Target buffer: {formatINR(summary.emergency_fund_target_inr)}
          </p>
        </div>

        {/* Risk Profile */}
        <div className="rounded-2xl border bg-card p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Risk Profile
            </p>
            {risk.capped_by && (
              <Badge variant="outline" className="text-[10px] border-amber-500 text-amber-500">
                capped: {risk.capped_by}
              </Badge>
            )}
          </div>
          <p className="text-2xl font-bold tracking-tight text-foreground capitalize">
            {risk.profile}
          </p>
          <p className="text-xs text-muted-foreground">
            Score: {risk.score} / 20 ({risk.questionnaire_profile})
          </p>
        </div>

        {/* Goals Affordability */}
        <div className="rounded-2xl border bg-card p-5 shadow-sm space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Goals Affordable
          </p>
          <div className="flex items-center gap-2">
            {summary.goals_affordable ? (
              <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 gap-1 text-sm font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Yes
              </Badge>
            ) : (
              <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 gap-1 text-sm font-semibold">
                <AlertTriangle className="w-3.5 h-3.5" /> Deficit
              </Badge>
            )}
            <span className="text-sm font-semibold text-foreground">
              {formatINR(summary.total_required_monthly_sip_inr)}/mo
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Needed vs {formatINR(Math.max(0, summary.monthly_surplus_inr))} surplus
          </p>
        </div>
      </div>

      {/* Action List (Main section) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-foreground">
            Action Items (Priority Order)
          </h3>
          <span className="text-xs text-muted-foreground">
            {actions.length} prioritized recommendations
          </span>
        </div>

        <div className="space-y-4">
          {actions.map((act) => {
            const isDoNow = act.status === "do_now";

            return (
              <div
                key={act.code}
                className={cn(
                  "rounded-2xl border p-6 transition-all shadow-sm",
                  isDoNow
                    ? "bg-card border-primary/40 ring-2 ring-primary/10 dark:bg-card"
                    : "bg-card/70 border-border"
                )}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                          isDoNow ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                        )}
                      >
                        {act.priority}
                      </span>
                      <h4 className="font-semibold text-foreground text-base">
                        {act.title}
                      </h4>
                      {isDoNow && (
                        <Badge className="bg-primary text-primary-foreground text-[10px] tracking-wide uppercase font-bold">
                          Do Now
                        </Badge>
                      )}
                    </div>
                  </div>

                  {act.amount_inr > 0 && (
                    <div className="text-left sm:text-right shrink-0">
                      <p className="text-xs text-muted-foreground">Target Amount</p>
                      <p className="text-lg font-bold text-foreground">
                        {formatINR(act.amount_inr)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Reasons bullets */}
                <div className="mt-4 space-y-1.5 pl-8">
                  {act.reasons.map((r, rIdx) => (
                    <div key={rIdx} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/60 mt-2 shrink-0" />
                      <span>{r}</span>
                    </div>
                  ))}
                </div>

                {/* Emergency fund products chips */}
                {act.products && act.products.length > 0 && (
                  <div className="mt-4 pt-4 border-t flex flex-wrap items-center gap-2 pl-8">
                    <span className="text-xs font-medium text-muted-foreground">Recommended instruments:</span>
                    {act.products.map((p, pIdx) => (
                      <Badge key={pIdx} variant="secondary" className="text-xs font-medium bg-muted">
                        {p.name} {p.yield_or_rate && `(${p.yield_or_rate})`}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Standalone Fixed Deposit Recommendations */}
      <FdRecommendations data={plan.fd_recommendations} />

      {/* Goals Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-foreground">
            Goal Allocation & Implementation
          </h3>
          <span className="text-xs text-muted-foreground">
            Inflated targets and recommended investment vehicles
          </span>
        </div>

        {goals.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-muted/20 p-8 text-center space-y-3">
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              No goals yet. Add goals in your Financial Twin to see how much to invest each month and where.
            </p>
            <Button asChild size="sm">
              <Link href="/twin">Go to Financial Twin</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {goals.map((g) => {
            const equityPct = g.equity_share_pct;
            const debtPct = 100 - equityPct;

            return (
              <div
                key={g.goal_id}
                className="rounded-2xl border bg-card p-6 shadow-sm space-y-6"
              >
                {/* Goal Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-lg font-bold text-foreground">{g.name}</h4>
                      <Badge variant="outline" className="capitalize text-xs font-semibold">
                        {g.bucket} Horizon ({g.years} yrs)
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Target in today&apos;s money: {formatINR(g.target_today_inr)} → Future Inflated Value:{" "}
                      <span className="font-semibold text-foreground">
                        {formatINR(g.inflated_target_inr)}
                      </span>
                    </p>
                  </div>

                  <div className="text-left sm:text-right">
                    <p className="text-xs text-muted-foreground">Required Monthly SIP</p>
                    <p className="text-xl font-bold text-primary">
                      {formatINR(g.required_monthly_sip_inr)}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      assumes ~{g.expected_return_pct}% blended return
                    </p>
                  </div>
                </div>

                {/* Equity / Debt Split Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-emerald-600 dark:text-emerald-400">
                      Equity: {equityPct}% ({formatINR(g.split_monthly_inr.equity)}/mo)
                    </span>
                    <span className="text-blue-600 dark:text-blue-400">
                      Debt: {debtPct}% ({formatINR(g.split_monthly_inr.debt)}/mo)
                    </span>
                  </div>
                  <div className="w-full h-3 bg-muted rounded-full overflow-hidden flex">
                    <div
                      style={{ width: `${equityPct}%` }}
                      className="bg-emerald-500 h-full transition-all"
                      title={`Equity: ${equityPct}%`}
                    />
                    <div
                      style={{ width: `${debtPct}%` }}
                      className="bg-blue-500 h-full transition-all"
                      title={`Debt: ${debtPct}%`}
                    />
                  </div>
                </div>

                {/* Recommended Instruments */}
                {g.instruments && g.instruments.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-foreground uppercase tracking-wider">
                      Recommended Investment Vehicles
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {g.instruments.map((inst, instIdx) => (
                        <div
                          key={instIdx}
                          className="p-3 rounded-xl border bg-background/50 text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between font-semibold">
                            <span>{inst.name}</span>
                            <Badge variant="outline" className="text-[10px] uppercase">
                              {inst.role}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground">{inst.reason}</p>
                          {inst.assumed_return_pct && (
                            <p className="text-[10px] text-primary">
                              Assumed return: ~{inst.assumed_return_pct}% p.a.
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* FD Options Table */}
                {g.fd_options?.top_fds && g.fd_options.top_fds.length > 0 && (
                  <div className="space-y-3 pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-foreground uppercase tracking-wider">
                        Top Fixed Deposit Options ({g.fd_options.tenure} tenure)
                      </p>
                      <span className="text-[11px] text-muted-foreground">
                        DICGC insured up to ₹5,00,000 per bank
                      </span>
                    </div>

                    <div className="overflow-x-auto rounded-xl border">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-muted text-muted-foreground font-medium">
                          <tr>
                            <th className="p-2.5">Bank / Issuer</th>
                            <th className="p-2.5">Type</th>
                            <th className="p-2.5">General Rate</th>
                            <th className="p-2.5">Senior Rate</th>
                            <th className="p-2.5">Notes</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {g.fd_options.top_fds.map((fd, fdIdx) => (
                            <tr key={fdIdx} className="hover:bg-muted/30">
                              <td className="p-2.5 font-medium">{fd.bank_name}</td>
                              <td className="p-2.5 uppercase font-mono text-[10px]">{fd.bank_type}</td>
                              <td className="p-2.5 font-semibold text-primary">
                                {fd.rate_general_pct}%
                              </td>
                              <td className="p-2.5 text-muted-foreground">
                                {fd.rate_senior_pct}%
                              </td>
                              <td className="p-2.5 text-[11px] text-muted-foreground">
                                {fd.note || fd.notes || "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {g.fd_options.dicgc_note && (
                      <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{g.fd_options.dicgc_note}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          </div>
        )}
      </div>

      {/* Eligible Small Savings Schemes Table */}
      {eligible_small_savings && eligible_small_savings.length > 0 && (
        <div className="rounded-2xl border bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-4">
            <h3 className="font-semibold text-foreground">
              Eligible Government Small Savings Schemes
            </h3>
            <span className="text-xs text-muted-foreground">
              Backed by Government of India sovereign guarantee
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted text-muted-foreground font-medium">
                <tr>
                  <th className="p-2.5">Scheme Name</th>
                  <th className="p-2.5">Interest Rate</th>
                  <th className="p-2.5">Lock-in Period</th>
                  <th className="p-2.5">Tax Status</th>
                  <th className="p-2.5">Sovereign Guarantee</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {eligible_small_savings.map((sch) => (
                  <tr key={sch.scheme_id} className="hover:bg-muted/30">
                    <td className="p-2.5 font-medium">{sch.name}</td>
                    <td className="p-2.5 font-bold text-primary">{sch.rate_pct}%</td>
                    <td className="p-2.5">
                      {sch.lock_in_years === 0 ? "Liquid / None" : `${sch.lock_in_years} Years`}
                    </td>
                    <td className="p-2.5">
                      {sch.tax_deduction_eligible ? (
                        <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/30">
                          Sec 123 / 80C
                        </Badge>
                      ) : sch.interest_taxable ? (
                        <span className="text-muted-foreground">Taxable</span>
                      ) : (
                        <span className="text-emerald-600 font-medium">Tax-free</span>
                      )}
                    </td>
                    <td className="p-2.5 text-emerald-600 font-medium">
                      {sch.sovereign_backed ? "100% Sovereign" : "DICGC"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tax Saving Options Card (Old Regime Only) */}
      {tax_saving && (
        <div className="rounded-2xl border bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <h3 className="font-semibold text-foreground">{tax_saving.section}</h3>
              <p className="text-xs text-muted-foreground">{tax_saving.note}</p>
            </div>
            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-bold">
              Up to {formatINR(tax_saving.limit_inr)}
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {tax_saving.options.map((opt, oIdx) => (
              <div
                key={oIdx}
                className="p-3.5 rounded-xl border bg-background/50 space-y-1.5 text-xs"
              >
                <div className="flex items-center justify-between font-semibold">
                  <span>{opt.name}</span>
                  <span className="text-primary font-bold">{opt.rate_pct}%</span>
                </div>
                <p className="text-muted-foreground">{opt.why}</p>
                <p className="text-[10px] text-muted-foreground/80">
                  Lock-in: {opt.lock_in_years} years
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer Assumptions & Disclaimers */}
      <div className="rounded-2xl border bg-muted/30 p-6 space-y-4 text-xs text-muted-foreground">
        {data_freshness?.stale && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              Warning: Reference interest rates and government savings schemes data are older than 90 days.
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-b pb-4">
          <div>
            <span className="font-semibold text-foreground">Planning Assumptions:</span>
            <p className="mt-0.5">
              Inflation: {assumptions?.inflation_pct}% | Equity Return: {assumptions?.equity_return_pct}% | Debt Return: {assumptions?.debt_return_pct}%
            </p>
          </div>
          <div>
            <span className="font-semibold text-foreground">Data Freshness:</span>
            <p className="mt-0.5">
              FD Rates as of {data_freshness?.fd_rates_as_of || "recent"} | {data_freshness?.small_savings_quarter}
            </p>
          </div>
          <div className="sm:text-right">
            <span className="font-semibold text-foreground">Minimum SIP:</span>
            <p className="mt-0.5">{formatINR(assumptions?.min_monthly_sip_inr || 500)}/month</p>
          </div>
        </div>

        <div className="pt-2">
          <p className="leading-relaxed">
            <strong className="text-foreground">Disclaimer: </strong>
            {disclaimer}
          </p>
        </div>
      </div>
    </div>
  );
}
