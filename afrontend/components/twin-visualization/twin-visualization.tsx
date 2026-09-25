"use client";

import { motion, useReducedMotion } from "motion/react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatINR } from "@/lib/format";

export interface Goal {
  id: string;
  name: string;
  progress: number; // 0–1
  target_amount?: number;
  current_savings?: number;
}

interface TwinVisualizationProps {
  healthScore: number; // 0–100
  goals: Goal[];
  category?: "POOR" | "FAIR" | "GOOD" | "EXCELLENT";
  className?: string;
}

function coreFill(score: number) {
  if (score < 40) return "var(--color-clay)";
  if (score < 70) return "var(--color-marigold)";
  return "var(--color-emerald)";
}

function StampedCircle({
  cx,
  cy,
  r,
  fill,
  offset = 4,
}: {
  cx: number;
  cy: number;
  r: number;
  fill: string;
  offset?: number;
}) {
  return (
    <g>
      <circle cx={cx + offset} cy={cy + offset} r={r} fill="var(--color-ink)" />
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill={fill}
        stroke="var(--color-ink)"
        strokeWidth={1.5}
      />
    </g>
  );
}

export function TwinVisualization({
  healthScore,
  goals,
  category = "EXCELLENT",
  className,
}: TwinVisualizationProps) {
  const shouldReduceMotion = useReducedMotion();
  const center = 180;
  const orbitRadius = 115;

  const displayGoals = goals.slice(0, 6);
  const extraCount = goals.length - displayGoals.length;

  return (
    <div className={`relative mx-auto w-full max-w-sm select-none ${className || ""}`}>
      <svg
        viewBox="0 0 360 360"
        className="w-full h-auto overflow-visible"
        role="img"
        aria-label={`Financial health score ${healthScore} out of 100`}
      >
        {/* Subtle decorative dashed orbit path */}
        <circle
          cx={center}
          cy={center}
          r={orbitRadius}
          fill="none"
          stroke="var(--color-ink)"
          strokeWidth={1}
          strokeDasharray="4 6"
          opacity={0.3}
        />

        {/* Central Core Stamped Circle */}
        {shouldReduceMotion ? (
          <g>
            <StampedCircle
              cx={center}
              cy={center}
              r={56}
              fill={coreFill(healthScore)}
              offset={5}
            />
            <text
              x={center}
              y={center - 8}
              textAnchor="middle"
              className="fill-paper font-mono text-[10px] tracking-widest uppercase font-semibold"
            >
              TWIN SCORE
            </text>
            <text
              x={center}
              y={center + 20}
              textAnchor="middle"
              className="fill-paper font-mono text-3xl font-bold ticker-num"
            >
              {Math.round(healthScore)}
            </text>
          </g>
        ) : (
          <motion.g
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 140, damping: 16 }}
          >
            <StampedCircle
              cx={center}
              cy={center}
              r={56}
              fill={coreFill(healthScore)}
              offset={5}
            />
            <text
              x={center}
              y={center - 8}
              textAnchor="middle"
              className="fill-paper font-mono text-[10px] tracking-widest uppercase font-semibold pointer-events-none"
            >
              TWIN SCORE
            </text>
            <text
              x={center}
              y={center + 20}
              textAnchor="middle"
              className="fill-paper font-mono text-3xl font-bold ticker-num pointer-events-none"
            >
              {Math.round(healthScore)}
            </text>
          </motion.g>
        )}

        {/* Orbiting Goal Nodes */}
        {displayGoals.map((goal, i) => {
          const angle = (i / Math.max(displayGoals.length, 1)) * Math.PI * 2 - Math.PI / 2;
          const x = center + orbitRadius * Math.cos(angle);
          const y = center + orbitRadius * Math.sin(angle);
          const size = 10 + Math.min(Math.max(goal.progress, 0), 1) * 12;

          return (
            <Tooltip key={goal.id}>
              <TooltipTrigger>
                <g className="cursor-pointer group">
                  {shouldReduceMotion ? (
                    <g>
                      <StampedCircle
                        cx={x}
                        cy={y}
                        r={size}
                        fill="var(--color-paper)"
                        offset={3}
                      />
                      <circle cx={x} cy={y} r={3} fill="var(--color-ink)" />
                    </g>
                  ) : (
                    <motion.g
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{
                        delay: 0.15 + i * 0.08,
                        type: "spring",
                        stiffness: 110,
                        damping: 14,
                      }}
                    >
                      <StampedCircle
                        cx={x}
                        cy={y}
                        r={size}
                        fill="var(--color-paper)"
                        offset={3}
                      />
                      <circle cx={x} cy={y} r={3} fill="var(--color-ink)" />
                    </motion.g>
                  )}
                </g>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                className="paper-card px-3 py-2 text-xs font-sans max-w-[200px]"
              >
                <p className="font-semibold text-ink">{goal.name}</p>
                <p className="font-mono text-ink/70 text-[11px] mt-0.5">
                  {Math.round(goal.progress * 100)}% funded
                  {goal.target_amount ? ` (${formatINR(goal.target_amount)})` : ""}
                </p>
              </TooltipContent>
            </Tooltip>
          );
        })}

        {/* Extra goals indicator if more than 6 */}
        {extraCount > 0 && (
          <g>
            <circle
              cx={center + orbitRadius * Math.cos(Math.PI * 0.75)}
              cy={center + orbitRadius * Math.sin(Math.PI * 0.75)}
              r={12}
              fill="var(--color-paper)"
              stroke="var(--color-ink)"
              strokeWidth={1.5}
            />
            <text
              x={center + orbitRadius * Math.cos(Math.PI * 0.75)}
              y={center + orbitRadius * Math.sin(Math.PI * 0.75) + 3}
              textAnchor="middle"
              className="fill-ink font-mono text-[10px] font-bold"
            >
              +{extraCount}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
