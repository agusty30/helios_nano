"use client";

import { Gauge, PiggyBank, Activity, Layers } from "lucide-react";
import clsx from "clsx";
import type { CanvasMetrics } from "@/lib/types";

interface StatsHudProps {
  metrics: CanvasMetrics;
}

export default function StatsHud({ metrics }: StatsHudProps) {
  const stats = [
    {
      icon: <Layers size={13} className="text-accent" />,
      label: "Settled",
      value: metrics.requests_today.toString(),
      sub: "today",
    },
    {
      icon: <PiggyBank size={13} className="text-mint" />,
      label: "Saved",
      value: `$${metrics.total_saved.toFixed(2)}`,
      sub: "total",
      highlight: "mint",
    },
    {
      icon: <Activity size={13} className="text-gold" />,
      label: "Throughput",
      value: metrics.active_throughput.toFixed(1),
      sub: "req/sec",
    },
    {
      icon: <Gauge size={13} className="text-zinc-400" />,
      label: "Budget",
      value: `$${metrics.budget_remaining.toFixed(2)}`,
      sub: `of $${(metrics.budget_remaining + metrics.daily_spend).toFixed(0)}`,
      highlight: metrics.budget_remaining < 2 ? "crimson" : undefined,
    },
  ];

  return (
    <div className="flex gap-2">
      {stats.map((s) => (
        <div
          key={s.label}
          className="glass-bright rounded-lg border border-border px-3 py-2 min-w-[90px]"
        >
          <div className="flex items-center gap-1.5 mb-1">
            {s.icon}
            <span className="text-[9px] font-semibold uppercase tracking-wider text-zinc-600">
              {s.label}
            </span>
          </div>
          <div className={clsx(
            "text-sm font-bold tabular-nums tracking-tight transition-colors",
            s.highlight === "mint" && "text-mint",
            s.highlight === "crimson" && "text-crimson",
            !s.highlight && "text-white"
          )}>
            {s.value}
          </div>
          <div className="text-[9px] text-zinc-700 font-mono">{s.sub}</div>
        </div>
      ))}
    </div>
  );
}
