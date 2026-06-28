"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { cn, formatCurrency } from "@/lib/utils";
import { api } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { useToast } from "@/components/ui/Toast";
import { SkeletonCard } from "@/components/ui/Skeleton";
import type { CanvasMetrics } from "@/lib/types";
import {
  CreditCard, ShoppingCart, Landmark, Wallet, Bot,
  Activity, CheckCircle2, TrendingUp, Zap, Wifi, WifiOff,
} from "lucide-react";

const iconMap: Record<string, React.FC<{ size?: number; className?: string }>> = {
  CreditCard, ShoppingCart, Landmark, Wallet,
};

const MOCK_CANVAS: CanvasMetrics = {
  wallet_address: "0x...", usdc_balance: 0, active_throughput: 0,
  last_route: "—", daily_spend: 0, total_saved: 0,
  requests_today: 0, budget_remaining: 0, circuit_breaker: false, chain: "Arc Testnet (5042002)",
};

interface DbAgent {
  id: string;
  name: string;
  type: string;
  status: string;
  config: { icon?: string; description?: string };
  createdAt: string;
  _count?: { tasks: number };
  wallet?: { label: string; address: string } | null;
}

export default function AgentsPage() {
  const [dbAgents, setDbAgents] = useState<DbAgent[]>([]);
  const [dbLoaded, setDbLoaded] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetch("/api/agents")
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.agents) {
          setDbAgents(data.agents);
          setDbLoaded(true);
        }
      })
      .catch(() => { toast("Failed to load agents", "error"); });
  }, []);

  const fetchMetrics = useCallback(() => api.fetchCanvasMetrics(), []);
  const metrics = useApi(fetchMetrics, MOCK_CANVAS, 10000);

  const activeCount = dbAgents.filter(a => a.status === "active").length;
  const totalCount = dbAgents.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">AI Agents</h1>
          <p className="text-sm text-muted-dark mt-1">Monitor and manage your autonomous financial agents</p>
        </div>
        {dbLoaded || metrics.isLive ? (
          <span className="flex items-center gap-1.5 text-[11px] font-medium text-success"><Wifi size={12} /> Live</span>
        ) : (
          <span className="flex items-center gap-1.5 text-[11px] font-medium text-muted-dark"><WifiOff size={12} /> Loading...</span>
        )}
      </div>

      {metrics.isLive && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary/20 via-primary/10 to-transparent border border-primary/20 p-5"
        >
          <div className="grid grid-cols-3 lg:grid-cols-6 gap-4 text-center">
            <div><span className="text-[10px] text-muted-dark block">Wallet</span><span className="text-[11px] font-mono text-foreground">{metrics.data.wallet_address.slice(0, 6)}...{metrics.data.wallet_address.slice(-4)}</span></div>
            <div><span className="text-[10px] text-muted-dark block">USDC Balance</span><span className="text-sm font-bold text-foreground">${metrics.data.usdc_balance.toFixed(4)}</span></div>
            <div><span className="text-[10px] text-muted-dark block">Throughput</span><span className="text-sm font-bold text-foreground">{metrics.data.active_throughput}/s</span></div>
            <div><span className="text-[10px] text-muted-dark block">Requests Today</span><span className="text-sm font-bold text-foreground">{metrics.data.requests_today}</span></div>
            <div><span className="text-[10px] text-muted-dark block">Total Saved</span><span className="text-sm font-bold text-success">${metrics.data.total_saved.toFixed(4)}</span></div>
            <div><span className="text-[10px] text-muted-dark block">Circuit Breaker</span><span className={cn("text-sm font-bold", metrics.data.circuit_breaker ? "text-danger" : "text-success")}>{metrics.data.circuit_breaker ? "TRIPPED" : "OK"}</span></div>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Agents", value: totalCount.toString() || "0", icon: Bot, color: "text-primary-light" },
          { label: "Active Now", value: `${activeCount}/${totalCount}`, icon: Activity, color: activeCount > 0 ? "text-success" : "text-muted-dark" },
          { label: "Requests Today", value: metrics.isLive ? metrics.data.requests_today.toLocaleString() : "—", icon: CheckCircle2, color: "text-success" },
          { label: "Total Savings", value: metrics.isLive ? formatCurrency(metrics.data.total_saved) : "—", icon: TrendingUp, color: "text-primary-light" },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-bright rounded-xl p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <s.icon size={14} className={s.color} />
              <span className="text-[11px] text-muted-dark">{s.label}</span>
            </div>
            <span className="text-lg font-bold text-foreground">{s.value}</span>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {dbAgents.length === 0 && !dbLoaded ? (
          <>
            {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
          </>
        ) : dbAgents.length === 0 ? (
          <div className="col-span-2 text-center py-12 text-[13px] text-muted-dark">No agents configured. Visit the dashboard to seed default agents.</div>
        ) : dbAgents.map((agent, i) => {
          const cfg = (agent.config || {}) as { icon?: string; description?: string };
          const Icon = iconMap[cfg.icon || ""] || Bot;
          const isActive = agent.status === "active";
          return (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              className="glass-bright rounded-xl p-6 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-primary/10">
                    <Icon size={20} className="text-primary-light" />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-semibold text-foreground">{agent.name}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {isActive ? (
                        <>
                          <div className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-success" />
                          </div>
                          <span className="text-[10px] text-success font-medium uppercase tracking-wider">Active</span>
                        </>
                      ) : (
                        <>
                          <span className="inline-flex rounded-full h-1.5 w-1.5 bg-muted-dark" />
                          <span className="text-[10px] text-muted-dark font-medium uppercase tracking-wider">{agent.status}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] text-muted-dark">{new Date(agent.createdAt).toLocaleDateString()}</span>
              </div>

              <div className="mb-4 p-3 rounded-lg bg-white/[0.02] border border-border">
                <div className="flex items-center gap-2 mb-1">
                  <Zap size={12} className="text-primary-light" />
                  <span className="text-[11px] text-muted-dark">Type</span>
                </div>
                <p className="text-[13px] text-foreground capitalize">{agent.type}</p>
                {cfg.description && <p className="text-[11px] text-muted-dark mt-1">{cfg.description}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] text-muted-dark block mb-0.5">Status</span>
                  <span className={cn("text-sm font-semibold capitalize", isActive ? "text-success" : "text-muted-dark")}>{agent.status}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-dark block mb-0.5">Tasks</span>
                  <span className="text-sm font-semibold text-foreground">{agent._count?.tasks || 0}</span>
                </div>
              </div>
              {agent.wallet && (
                <div className="mt-3 pt-3 border-t border-border">
                  <span className="text-[10px] text-muted-dark block mb-0.5">Wallet</span>
                  <span className="text-[11px] font-mono text-muted">{agent.wallet.label} · {agent.wallet.address.slice(0, 6)}...{agent.wallet.address.slice(-4)}</span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
