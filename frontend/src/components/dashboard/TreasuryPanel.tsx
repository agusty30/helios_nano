"use client";

import { useCallback } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import type { CanvasMetrics } from "@/lib/types";
import { Wallet, Copy, ExternalLink, TrendingUp, TrendingDown, ArrowUpRight } from "lucide-react";

const MOCK_CANVAS: CanvasMetrics = {
  wallet_address: "0x...", usdc_balance: 7.16, active_throughput: 0,
  last_route: "cheap_tier", daily_spend: 2.84, total_saved: 42.38,
  requests_today: 1847, budget_remaining: 7.16, circuit_breaker: false, chain: "Arc Testnet (5042002)",
};

export default function TreasuryPanel() {
  const fetchMetrics = useCallback(() => api.fetchCanvasMetrics(), []);
  const metrics = useApi(fetchMetrics, MOCK_CANVAS, 10000);
  const m = metrics.data;

  const totalBalance = m.usdc_balance + m.total_saved;
  const dailyBudget = m.daily_spend + m.budget_remaining;
  const budgetProgress = dailyBudget > 0 ? (m.daily_spend / dailyBudget) * 100 : 0;

  const copyAddress = () => {
    navigator.clipboard.writeText(m.wallet_address);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-bright rounded-xl p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Wallet size={16} className="text-primary-light" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Treasury</h3>
            <span className="text-[10px] text-muted-dark">{m.chain}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={copyAddress}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-mono text-muted-dark hover:text-foreground hover:bg-white/[0.04] transition-colors"
            title="Copy wallet address"
          >
            {m.wallet_address.slice(0, 6)}...{m.wallet_address.slice(-4)}
            <Copy size={10} />
          </button>
          <a
            href={`https://testnet.arcscan.app/address/${m.wallet_address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1 rounded-md text-muted-dark hover:text-foreground hover:bg-white/[0.04] transition-colors"
          >
            <ExternalLink size={12} />
          </a>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-3 rounded-lg bg-white/[0.02] border border-border">
          <span className="text-[10px] text-muted-dark block mb-1">USDC Balance</span>
          <span className="text-lg font-bold text-foreground">{m.usdc_balance.toFixed(2)} USDC</span>
        </div>

        <div className="p-3 rounded-lg bg-white/[0.02] border border-border">
          <span className="text-[10px] text-muted-dark block mb-1">Today&apos;s Spend</span>
          <div className="flex items-center gap-1">
            <span className="text-lg font-bold text-foreground">{m.daily_spend.toFixed(2)} USDC</span>
            <TrendingDown size={12} className="text-danger" />
          </div>
        </div>

        <div className="p-3 rounded-lg bg-white/[0.02] border border-border">
          <span className="text-[10px] text-muted-dark block mb-1">Total Saved</span>
          <div className="flex items-center gap-1">
            <span className="text-lg font-bold text-success">{m.total_saved.toFixed(2)} USDC</span>
            <TrendingUp size={12} className="text-success" />
          </div>
        </div>

        <div className="p-3 rounded-lg bg-white/[0.02] border border-border">
          <span className="text-[10px] text-muted-dark block mb-1">Budget Remaining</span>
          <span className="text-lg font-bold text-foreground">{m.budget_remaining.toFixed(2)} USDC</span>
          <div className="mt-1.5 h-1 rounded-full bg-white/5 overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all", budgetProgress > 80 ? "bg-danger" : budgetProgress > 50 ? "bg-warning" : "bg-success")}
              style={{ width: `${Math.min(budgetProgress, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
