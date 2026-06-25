"use client";

import { ArrowDownRight, Zap, Sparkles } from "lucide-react";
import clsx from "clsx";
import type { TransactionEvent } from "@/lib/types";

interface TransactionFeedProps {
  transactions: TransactionEvent[];
}

export default function TransactionFeed({ transactions }: TransactionFeedProps) {
  if (transactions.length === 0) {
    return (
      <div className="glass rounded-xl border border-border p-4 w-[320px]">
        <div className="flex items-center gap-2 mb-3">
          <ArrowDownRight size={13} className="text-zinc-500" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            Settlement Feed
          </span>
        </div>
        <div className="text-[11px] text-zinc-700 font-mono text-center py-6">
          Waiting for transactions...
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-xl border border-border overflow-hidden w-[320px]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <div className="flex items-center gap-2">
          <ArrowDownRight size={13} className="text-zinc-500" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            Settlement Feed
          </span>
        </div>
        <span className="text-[10px] font-mono text-zinc-700 tabular-nums">
          {transactions.length} txns
        </span>
      </div>

      {/* Transaction list */}
      <div className="max-h-[280px] overflow-y-auto px-2 pb-2">
        {transactions.slice(0, 8).map((tx, i) => {
          const isCheap = tx.route === "cheap_tier";
          const borderColor = isCheap ? "border-l-mint" : "border-l-gold";
          const Icon = isCheap ? Zap : Sparkles;
          const time = new Date(tx.timestamp);
          const timeStr = `${time.getHours().toString().padStart(2, "0")}:${time.getMinutes().toString().padStart(2, "0")}:${time.getSeconds().toString().padStart(2, "0")}`;

          return (
            <div
              key={tx.id}
              className={clsx(
                "tx-feed-item flex items-center gap-3 px-3 py-2.5 rounded-lg mx-1 mb-1",
                "border-l-2 bg-surface2/50 hover:bg-surface2 transition-colors",
                borderColor
              )}
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <Icon
                size={12}
                className={clsx(isCheap ? "text-mint/70" : "text-gold/70")}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className={clsx(
                    "text-[11px] font-mono font-medium tabular-nums",
                    isCheap ? "text-mint" : "text-gold"
                  )}>
                    ${tx.cost.toFixed(4)}
                  </span>
                  <span className="text-[9px] font-mono text-zinc-700">
                    {timeStr}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[9px] text-zinc-600 truncate">
                    {tx.model}
                  </span>
                  <span className="text-[9px] text-zinc-700">·</span>
                  <span className="text-[9px] font-mono text-zinc-700">
                    {tx.settlement.slice(0, 8)}…
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
