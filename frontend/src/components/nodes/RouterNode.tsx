"use client";

import { memo } from "react";
import { Handle, Position } from "reactflow";
import { Brain, GitFork } from "lucide-react";
import clsx from "clsx";

interface RouterNodeProps {
  data: {
    lastRoute: "cheap_tier" | "heavy_tier" | "circuit_breaker" | "idle";
    dailySpend: number;
  };
}

const routeConfig = {
  cheap_tier: { label: "Cost Optimized", color: "mint", dotClass: "bg-mint", textClass: "text-mint", glowClass: "shadow-[0_0_12px_rgba(16,185,129,0.3)]" },
  heavy_tier: { label: "Premium Route", color: "gold", dotClass: "bg-gold", textClass: "text-gold", glowClass: "shadow-[0_0_12px_rgba(245,158,11,0.3)]" },
  circuit_breaker: { label: "Circuit Breaker", color: "crimson", dotClass: "bg-crimson", textClass: "text-crimson", glowClass: "shadow-[0_0_12px_rgba(239,68,68,0.3)]" },
  idle: { label: "Awaiting", color: "zinc", dotClass: "bg-zinc-600", textClass: "text-zinc-500", glowClass: "" },
} as const;

function RouterNode({ data }: RouterNodeProps) {
  const route = routeConfig[data.lastRoute] || routeConfig.idle;
  const isActive = data.lastRoute !== "idle";
  const isCheap = data.lastRoute === "cheap_tier";
  const isHeavy = data.lastRoute === "heavy_tier";
  const isBreaker = data.lastRoute === "circuit_breaker";

  return (
    <div className={clsx(
      "node-card px-6 py-5 min-w-[240px]",
      isBreaker && "border-crimson/40",
      route.glowClass
    )}>
      {/* Header */}
      <div className="relative flex items-center gap-2.5 mb-4">
        <div className={clsx(
          "p-2 rounded-lg transition-colors duration-300",
          isBreaker ? "bg-crimson/10" : "bg-accent/10"
        )}>
          <Brain size={15} className={clsx(isBreaker ? "text-crimson" : "text-accent")} />
        </div>
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            Router Brain
          </span>
          <div className="text-[9px] text-zinc-700 font-mono">Decision Engine</div>
        </div>
      </div>

      {/* Active route indicator */}
      <div className={clsx(
        "flex items-center gap-2.5 px-3 py-2 rounded-lg mb-3 transition-colors duration-300",
        isActive ? "bg-surface2" : "bg-transparent"
      )}>
        <div className="relative">
          <div className={clsx("w-3 h-3 rounded-full transition-colors", route.dotClass)} />
          {isActive && (
            <div className={clsx(
              "absolute inset-0 w-3 h-3 rounded-full animate-ping",
              route.dotClass,
              "opacity-40"
            )} />
          )}
        </div>
        <span className={clsx("text-sm font-semibold transition-colors", route.textClass)}>
          {route.label}
        </span>
      </div>

      {/* Route split visualization */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex-1 flex items-center gap-2">
          <GitFork size={12} className="text-zinc-600 rotate-90" />
          <div className="flex-1 space-y-1.5">
            {/* Cheap path */}
            <div className="flex items-center gap-2">
              <div className={clsx(
                "h-[3px] flex-1 rounded-full transition-all duration-500",
                isCheap ? "bg-mint" : "bg-zinc-800"
              )} />
              <span className={clsx(
                "text-[9px] font-mono transition-colors",
                isCheap ? "text-mint" : "text-zinc-700"
              )}>$0.0008</span>
            </div>
            {/* Heavy path */}
            <div className="flex items-center gap-2">
              <div className={clsx(
                "h-[3px] flex-1 rounded-full transition-all duration-500",
                isHeavy ? "bg-gold" : "bg-zinc-800"
              )} />
              <span className={clsx(
                "text-[9px] font-mono transition-colors",
                isHeavy ? "text-gold" : "text-zinc-700"
              )}>$0.0500</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mode badge + spend */}
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-semibold bg-surface2 text-zinc-500 border border-border">
          Cost-First Optimization
        </span>
        <span className="text-[10px] font-mono text-zinc-600">
          ${data.dailySpend.toFixed(4)}
        </span>
      </div>

      <Handle
        type="target"
        position={Position.Left}
        className="!bg-accent !border-canvas !w-3 !h-3 !border-2"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="cheap"
        style={{ top: "70%" }}
        className="!bg-mint !border-canvas !w-3 !h-3 !border-2"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="heavy"
        style={{ top: "30%" }}
        className="!bg-gold !border-canvas !w-3 !h-3 !border-2"
      />
    </div>
  );
}

export default memo(RouterNode);
