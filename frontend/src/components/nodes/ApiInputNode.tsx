"use client";

import { memo } from "react";
import { Handle, Position } from "reactflow";
import { Activity } from "lucide-react";
import clsx from "clsx";

interface ApiInputNodeProps {
  data: {
    throughput: number;
  };
}

function ApiInputNode({ data }: ApiInputNodeProps) {
  const isActive = data.throughput > 0;

  return (
    <div
      className={clsx(
        "relative px-6 py-5 rounded-xl border bg-surface min-w-[200px]",
        "transition-all duration-300",
        isActive
          ? "border-mint/40 shadow-[0_0_20px_rgba(16,185,129,0.1)]"
          : "border-border"
      )}
      style={isActive ? { animation: "pulse-green 2s ease-in-out infinite" } : {}}
    >
      <div className="flex items-center gap-2 mb-3">
        <div
          className={clsx(
            "p-1.5 rounded-lg",
            isActive ? "bg-mint/10" : "bg-surface2"
          )}
        >
          <Activity
            size={16}
            className={clsx(isActive ? "text-mint" : "text-zinc-500")}
          />
        </div>
        <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">
          API Input
        </span>
      </div>

      <div className="flex items-baseline gap-1.5">
        <span
          className={clsx(
            "text-3xl font-semibold tabular-nums",
            isActive ? "text-white" : "text-zinc-500"
          )}
        >
          {data.throughput.toFixed(1)}
        </span>
        <span className="text-xs text-zinc-500">req/sec</span>
      </div>

      <div className="mt-2 text-[10px] text-zinc-600 font-mono">
        Incoming Requests
      </div>

      {isActive && (
        <div className="absolute top-3 right-3">
          <div className="w-2 h-2 rounded-full bg-mint animate-pulse" />
        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        className="!bg-mint !border-mint/50 !w-3 !h-3"
      />
    </div>
  );
}

export default memo(ApiInputNode);
