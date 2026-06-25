"use client";

import { memo, useEffect, useRef, useState } from "react";
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
  const [history, setHistory] = useState<number[]>(() => Array(12).fill(0));
  const prevRef = useRef(data.throughput);

  useEffect(() => {
    if (data.throughput !== prevRef.current) {
      prevRef.current = data.throughput;
      setHistory((h) => [...h.slice(-11), data.throughput]);
    }
  }, [data.throughput]);

  const maxBar = Math.max(...history, 1);

  return (
    <div
      className={clsx(
        "node-card px-6 py-5 min-w-[220px]",
        isActive && "border-mint/30"
      )}
      style={isActive ? { animation: "pulse-green 3s ease-in-out infinite" } : {}}
    >
      {/* Spinning ring indicator */}
      {isActive && (
        <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
          <div
            className="absolute w-full h-full"
            style={{
              background: `conic-gradient(from 0deg, transparent 0%, rgba(16,185,129,0.15) 10%, transparent 20%)`,
              animation: `spin-ring ${Math.max(2, 8 - data.throughput * 2)}s linear infinite`,
            }}
          />
        </div>
      )}

      {/* Header */}
      <div className="relative flex items-center gap-2.5 mb-4">
        <div className={clsx(
          "p-2 rounded-lg transition-colors duration-300",
          isActive ? "bg-mint/10" : "bg-surface2"
        )}>
          <Activity size={15} className={clsx("transition-colors", isActive ? "text-mint" : "text-zinc-600")} />
        </div>
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            API Input
          </span>
          <div className="text-[9px] text-zinc-700 font-mono">Incoming Requests</div>
        </div>
        {isActive && (
          <div className="absolute top-0 right-0">
            <div className="relative">
              <div className="w-2 h-2 rounded-full bg-mint" />
              <div className="absolute inset-0 w-2 h-2 rounded-full bg-mint animate-ping" />
            </div>
          </div>
        )}
      </div>

      {/* Throughput value */}
      <div className="relative flex items-baseline gap-2 mb-4">
        <span className={clsx(
          "text-4xl font-bold tabular-nums tracking-tight transition-colors duration-300",
          isActive ? "text-white" : "text-zinc-600"
        )}>
          {data.throughput.toFixed(1)}
        </span>
        <span className="text-[11px] text-zinc-600 font-medium">req/sec</span>
      </div>

      {/* Mini sparkline bar chart */}
      <div className="flex items-end gap-[3px] h-[28px]">
        {history.map((v, i) => {
          const h = Math.max(2, (v / maxBar) * 28);
          return (
            <div
              key={i}
              className="sparkline-bar w-[6px] rounded-sm"
              style={{
                height: `${h}px`,
                background: v > 0
                  ? `linear-gradient(to top, rgba(16,185,129,0.3), rgba(16,185,129,0.7))`
                  : "rgba(39,39,42,0.5)",
                animationDelay: `${i * 30}ms`,
              }}
            />
          );
        })}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!bg-mint !border-canvas !w-3 !h-3 !border-2"
      />
    </div>
  );
}

export default memo(ApiInputNode);
