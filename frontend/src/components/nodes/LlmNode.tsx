"use client";

import { memo, useEffect, useRef, useState } from "react";
import { Handle, Position } from "reactflow";
import { Zap, Sparkles, Cpu } from "lucide-react";
import clsx from "clsx";

interface LlmNodeProps {
  data: {
    tier: "cheap" | "heavy";
    model: string;
    costPerCall: string;
    isActive: boolean;
  };
}

function LlmNode({ data }: LlmNodeProps) {
  const { tier, model, costPerCall, isActive } = data;
  const [hitCount, setHitCount] = useState(0);
  const [showProcessing, setShowProcessing] = useState(false);
  const wasActiveRef = useRef(false);

  const isCheap = tier === "cheap";
  const color = isCheap ? "mint" : "gold";
  const Icon = isCheap ? Zap : Sparkles;

  useEffect(() => {
    if (isActive && !wasActiveRef.current) {
      setHitCount((c) => c + 1);
      setShowProcessing(true);
      const t = setTimeout(() => setShowProcessing(false), 1500);
      wasActiveRef.current = true;
      return () => clearTimeout(t);
    }
    if (!isActive) {
      wasActiveRef.current = false;
    }
  }, [isActive]);

  const colorStyles = {
    mint: {
      border: "border-mint/40",
      bg: "bg-mint/10",
      text: "text-mint",
      badge: "bg-mint/5 text-mint border-mint/20",
      glow: "shadow-[0_0_20px_rgba(16,185,129,0.15)]",
      anim: "pulse-green",
    },
    gold: {
      border: "border-gold/40",
      bg: "bg-gold/10",
      text: "text-gold",
      badge: "bg-gold/5 text-gold border-gold/20",
      glow: "shadow-[0_0_20px_rgba(245,158,11,0.15)]",
      anim: "pulse-gold",
    },
  }[color];

  return (
    <div
      className={clsx(
        "node-card px-6 py-5 min-w-[220px]",
        isActive ? colorStyles.border : "border-border",
        isActive && colorStyles.glow
      )}
      style={isActive ? { animation: `${colorStyles.anim} 3s ease-in-out infinite` } : {}}
    >
      {/* Header */}
      <div className="relative flex items-center gap-2.5 mb-3">
        <div className={clsx(
          "p-2 rounded-lg transition-colors duration-300",
          isActive ? colorStyles.bg : "bg-surface2"
        )}>
          <Icon size={15} className={clsx("transition-colors", isActive ? colorStyles.text : "text-zinc-600")} />
        </div>
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            {isCheap ? "Cheap Tier" : "Heavy Tier"}
          </span>
          <div className="text-[9px] text-zinc-700 font-mono">LLM Execution</div>
        </div>

        {/* Active indicator */}
        {isActive && (
          <div className="absolute top-0 right-0 flex items-center gap-1.5">
            <span className="text-[8px] font-bold uppercase tracking-widest text-zinc-500">
              Active
            </span>
            <div className="relative">
              <div className={clsx("w-2 h-2 rounded-full", isCheap ? "bg-mint" : "bg-gold")} />
              <div className={clsx("absolute inset-0 w-2 h-2 rounded-full animate-ping opacity-40", isCheap ? "bg-mint" : "bg-gold")} />
            </div>
          </div>
        )}
      </div>

      {/* Model name */}
      <div className="mb-3">
        <span className="text-base font-mono font-semibold text-white tracking-tight">
          {model}
        </span>
      </div>

      {/* Processing animation */}
      {showProcessing && (
        <div className="flex items-center gap-2 mb-3 px-2.5 py-1.5 rounded-lg bg-surface2">
          <Cpu size={11} className={colorStyles.text} />
          <span className="text-[10px] text-zinc-500">Processing</span>
          <div className="flex gap-0.5 ml-1">
            <div className={clsx("processing-dot w-1 h-1 rounded-full", isCheap ? "bg-mint" : "bg-gold")} />
            <div className={clsx("processing-dot w-1 h-1 rounded-full", isCheap ? "bg-mint" : "bg-gold")} />
            <div className={clsx("processing-dot w-1 h-1 rounded-full", isCheap ? "bg-mint" : "bg-gold")} />
          </div>
        </div>
      )}

      {/* Cost badge + hit counter */}
      <div className="flex items-center justify-between">
        <span className={clsx(
          "inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-semibold border",
          colorStyles.badge
        )}>
          {costPerCall}/call
        </span>
        <span className="text-[10px] font-mono text-zinc-600 tabular-nums">
          {hitCount} hits
        </span>
      </div>

      <Handle
        type="target"
        position={Position.Left}
        className={clsx(
          "!border-canvas !w-3 !h-3 !border-2",
          isCheap ? "!bg-mint" : "!bg-gold"
        )}
      />
    </div>
  );
}

export default memo(LlmNode);
