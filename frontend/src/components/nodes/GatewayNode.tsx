"use client";

import { memo, useEffect, useRef, useState } from "react";
import { Handle, Position } from "reactflow";
import { Shield, CircleDot } from "lucide-react";
import clsx from "clsx";

interface GatewayNodeProps {
  data: {
    balance: number;
    chain: string;
  };
}

function GatewayNode({ data }: GatewayNodeProps) {
  const [flash, setFlash] = useState(false);
  const prevBalance = useRef(data.balance);

  useEffect(() => {
    if (data.balance !== prevBalance.current) {
      prevBalance.current = data.balance;
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 800);
      return () => clearTimeout(t);
    }
  }, [data.balance]);

  const balanceStr = data.balance.toFixed(2);
  const [whole, decimal] = balanceStr.split(".");

  return (
    <div className={clsx(
      "node-card px-6 py-5 min-w-[260px]",
      flash && "border-mint/40"
    )}>
      {/* Orbiting dot */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
        <div className="absolute top-1/2 left-1/2 w-0 h-0">
          <div
            className="absolute w-1.5 h-1.5 rounded-full bg-accent"
            style={{
              animation: "orbit 8s linear infinite",
              filter: "drop-shadow(0 0 4px rgba(99,102,241,0.8))",
            }}
          />
          <div
            className="absolute w-1 h-1 rounded-full bg-mint/60"
            style={{
              animation: "orbit-reverse 12s linear infinite",
              filter: "drop-shadow(0 0 3px rgba(16,185,129,0.6))",
            }}
          />
        </div>
      </div>

      {/* Settlement flash */}
      {flash && (
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{ animation: "settle-flash 0.8s ease-out forwards" }}
        />
      )}

      {/* Header */}
      <div className="relative flex items-center gap-2.5 mb-4">
        <div className="p-2 rounded-lg bg-accent/10">
          <Shield size={15} className="text-accent" />
        </div>
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            Circle Gateway
          </span>
          <div className="text-[9px] text-zinc-700 font-mono">Settlement Facilitator</div>
        </div>
      </div>

      {/* Balance with animated digits */}
      <div className="flex items-baseline gap-0.5 mb-4">
        <span className="text-zinc-500 text-lg font-medium">$</span>
        <span className="text-4xl font-bold tabular-nums text-white tracking-tight">
          {whole}
        </span>
        <span className="text-xl font-bold tabular-nums text-zinc-500">.{decimal}</span>
        <span className="text-[11px] text-zinc-600 font-medium ml-1.5">USDC</span>
      </div>

      {/* Badges */}
      <div className="flex items-center gap-2 mb-3">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-mint/10 text-mint border border-mint/20">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-mint opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-mint" />
          </span>
          Gas-Free
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium bg-surface2 text-zinc-500 border border-border">
          <CircleDot size={9} />
          EIP-3009
        </span>
      </div>

      {/* Chain info */}
      <div className="flex items-center gap-1.5">
        <div className="w-1.5 h-1.5 rounded-full bg-accent/60" />
        <span className="text-[10px] text-zinc-600 font-mono">
          {data.chain || "Arc Testnet · 5042002"}
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
        className="!bg-accent !border-canvas !w-3 !h-3 !border-2"
      />
    </div>
  );
}

export default memo(GatewayNode);
