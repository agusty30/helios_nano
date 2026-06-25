"use client";

import { memo } from "react";
import { Handle, Position } from "reactflow";
import { Brain } from "lucide-react";
import clsx from "clsx";

interface RouterNodeProps {
  data: {
    lastRoute: "cheap_tier" | "heavy_tier" | "circuit_breaker" | "idle";
    dailySpend: number;
  };
}

function RouterNode({ data }: RouterNodeProps) {
  const routeConfig = {
    cheap_tier: { label: "Cheap Tier", color: "bg-mint", textColor: "text-mint" },
    heavy_tier: { label: "Heavy Tier", color: "bg-gold", textColor: "text-gold" },
    circuit_breaker: { label: "Circuit Breaker", color: "bg-crimson", textColor: "text-crimson" },
    idle: { label: "Idle", color: "bg-zinc-500", textColor: "text-zinc-500" },
  };

  const route = routeConfig[data.lastRoute] || routeConfig.idle;

  return (
    <div className="relative px-6 py-5 rounded-xl border border-border bg-surface min-w-[220px]">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 rounded-lg bg-accent/10">
          <Brain size={16} className="text-accent" />
        </div>
        <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">
          Router Brain
        </span>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <div className={clsx("w-2.5 h-2.5 rounded-full", route.color)} />
        <span className={clsx("text-sm font-medium", route.textColor)}>
          {route.label}
        </span>
      </div>

      <div className="flex items-center gap-1.5 mb-2">
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-surface2 text-zinc-400 border border-border">
          Cost-First Optimization
        </span>
      </div>

      <div className="text-[10px] text-zinc-500 font-mono">
        Daily spend: ${data.dailySpend.toFixed(4)}
      </div>

      <Handle
        type="target"
        position={Position.Left}
        className="!bg-accent !border-accent/50 !w-3 !h-3"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="cheap"
        style={{ top: "70%" }}
        className="!bg-mint !border-mint/50 !w-3 !h-3"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="heavy"
        style={{ top: "30%" }}
        className="!bg-gold !border-gold/50 !w-3 !h-3"
      />
    </div>
  );
}

export default memo(RouterNode);
