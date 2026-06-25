"use client";

import { memo } from "react";
import { Handle, Position } from "reactflow";
import { Zap, Sparkles } from "lucide-react";
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

  const isCheap = tier === "cheap";
  const accentColor = isCheap ? "mint" : "gold";
  const Icon = isCheap ? Zap : Sparkles;

  return (
    <div
      className={clsx(
        "relative px-6 py-5 rounded-xl border bg-surface min-w-[200px]",
        "transition-all duration-500",
        isActive && isCheap && "border-mint/50",
        isActive && !isCheap && "border-gold/50",
        !isActive && "border-border"
      )}
      style={
        isActive
          ? {
              animation: isCheap
                ? "pulse-green 2s ease-in-out infinite"
                : "pulse-gold 2s ease-in-out infinite",
            }
          : {}
      }
    >
      <div className="flex items-center gap-2 mb-3">
        <div
          className={clsx(
            "p-1.5 rounded-lg",
            isActive
              ? isCheap
                ? "bg-mint/10"
                : "bg-gold/10"
              : "bg-surface2"
          )}
        >
          <Icon
            size={16}
            className={clsx(
              isActive
                ? isCheap
                  ? "text-mint"
                  : "text-gold"
                : "text-zinc-500"
            )}
          />
        </div>
        <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">
          {isCheap ? "Cheap Tier" : "Heavy Tier"}
        </span>
      </div>

      <div className="mb-2">
        <span className="text-sm font-mono font-medium text-white">
          {model}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span
          className={clsx(
            "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border",
            isCheap
              ? "bg-mint/5 text-mint border-mint/20"
              : "bg-gold/5 text-gold border-gold/20"
          )}
        >
          {costPerCall}/call
        </span>
      </div>

      {isActive && (
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          <span className="text-[9px] font-medium text-zinc-400 uppercase">
            Active
          </span>
          <div
            className={clsx(
              "w-2 h-2 rounded-full animate-pulse",
              isCheap ? "bg-mint" : "bg-gold"
            )}
          />
        </div>
      )}

      <Handle
        type="target"
        position={Position.Left}
        className={clsx(
          "!w-3 !h-3",
          isCheap
            ? "!bg-mint !border-mint/50"
            : "!bg-gold !border-gold/50"
        )}
      />
    </div>
  );
}

export default memo(LlmNode);
