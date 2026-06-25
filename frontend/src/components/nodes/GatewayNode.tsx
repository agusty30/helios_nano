"use client";

import { memo } from "react";
import { Handle, Position } from "reactflow";
import { Shield } from "lucide-react";

interface GatewayNodeProps {
  data: {
    balance: number;
    chain: string;
  };
}

function GatewayNode({ data }: GatewayNodeProps) {
  return (
    <div className="relative px-6 py-5 rounded-xl border border-border bg-surface min-w-[240px]">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 rounded-lg bg-accent/10">
          <Shield size={16} className="text-accent" />
        </div>
        <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">
          Circle Gateway
        </span>
      </div>

      <div className="flex items-baseline gap-1.5 mb-3">
        <span className="text-3xl font-semibold tabular-nums text-white">
          ${data.balance.toFixed(2)}
        </span>
        <span className="text-xs text-zinc-500 font-medium">USDC</span>
      </div>

      <div className="flex items-center gap-2 mb-2">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-mint/10 text-mint border border-mint/20">
          <span className="w-1.5 h-1.5 rounded-full bg-mint" />
          Gas-Free &middot; EIP-3009
        </span>
      </div>

      <div className="text-[10px] text-zinc-600 font-mono">
        {data.chain || "Arc Testnet · 5042002"}
      </div>

      <Handle
        type="target"
        position={Position.Left}
        className="!bg-accent !border-accent/50 !w-3 !h-3"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-accent !border-accent/50 !w-3 !h-3"
      />
    </div>
  );
}

export default memo(GatewayNode);
