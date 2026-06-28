"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { cn, timeAgo } from "@/lib/utils";
import { api } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { useToast } from "@/components/ui/Toast";
import { SkeletonCard } from "@/components/ui/Skeleton";
import type { CanvasMetrics } from "@/lib/types";
import {
  CreditCard, ShoppingCart, Landmark, Wallet, Bot, Globe, FileText, Sparkles, Bell,
  Activity, CheckCircle2, TrendingUp, Zap, Wifi, WifiOff,
  Pause, Play, RotateCcw, XOctagon, ChevronDown, ChevronUp, Clock, XCircle,
} from "lucide-react";

const iconMap: Record<string, React.FC<{ size?: number; className?: string }>> = {
  CreditCard, ShoppingCart, Landmark, Wallet, Globe, FileText, Sparkles, Bell,
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
  description: string;
  version: string;
  healthScore: number;
  lastActivityAt: string | null;
  lastError: string | null;
  config: { icon?: string; description?: string };
  createdAt: string;
  _count?: { tasks: number };
  wallet?: { label: string; address: string } | null;
}

interface AgentMetricSummary {
  successCount: number;
  failureCount: number;
  totalDuration: number;
  taskCount: number;
  successRate: number;
  avgDuration: number;
}

export default function AgentsPage() {
  const [dbAgents, setDbAgents] = useState<DbAgent[]>([]);
  const [dbLoaded, setDbLoaded] = useState(false);
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
  const [agentMetrics, setAgentMetrics] = useState<Record<string, AgentMetricSummary>>({});
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const loadAgents = useCallback(() => {
    fetch("/api/agents")
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.agents) {
          setDbAgents(data.agents);
          setDbLoaded(true);
        }
      })
      .catch(() => { toast("Failed to load agents", "error"); });
  }, [toast]);

  useEffect(() => { loadAgents(); }, [loadAgents]);

  const fetchMetrics = useCallback(() => api.fetchCanvasMetrics(), []);
  const metrics = useApi(fetchMetrics, MOCK_CANVAS, 10000);

  const loadAgentMetrics = async (agentId: string) => {
    try {
      const res = await fetch(`/api/agents/${agentId}/metrics?days=7`);
      const data = await res.json();
      if (data.summary) setAgentMetrics(prev => ({ ...prev, [agentId]: data.summary }));
    } catch {}
  };

  const toggleExpand = (agentId: string) => {
    if (expandedAgent === agentId) {
      setExpandedAgent(null);
    } else {
      setExpandedAgent(agentId);
      if (!agentMetrics[agentId]) loadAgentMetrics(agentId);
    }
  };

  const updateAgentStatus = async (agentId: string, status: string) => {
    setActionLoading(agentId);
    try {
      const res = await fetch(`/api/agents/${agentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.agent) {
        setDbAgents(prev => prev.map(a => a.id === agentId ? { ...a, status: data.agent.status } : a));
        toast(`Agent ${status === "active" ? "resumed" : status === "disabled" ? "disabled" : "paused"}`, "success");
      }
    } catch {
      toast("Failed to update agent", "error");
    }
    setActionLoading(null);
  };

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
            <div><span className="text-[10px] text-muted-dark block">USDC Balance</span><span className="text-sm font-bold text-foreground">{metrics.data.usdc_balance.toFixed(4)} USDC</span></div>
            <div><span className="text-[10px] text-muted-dark block">Throughput</span><span className="text-sm font-bold text-foreground">{metrics.data.active_throughput}/s</span></div>
            <div><span className="text-[10px] text-muted-dark block">Requests Today</span><span className="text-sm font-bold text-foreground">{metrics.data.requests_today}</span></div>
            <div><span className="text-[10px] text-muted-dark block">Total Saved</span><span className="text-sm font-bold text-success">{metrics.data.total_saved.toFixed(4)} USDC</span></div>
            <div><span className="text-[10px] text-muted-dark block">Circuit Breaker</span><span className={cn("text-sm font-bold", metrics.data.circuit_breaker ? "text-danger" : "text-success")}>{metrics.data.circuit_breaker ? "TRIPPED" : "OK"}</span></div>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Agents", value: totalCount.toString() || "0", icon: Bot, color: "text-primary-light" },
          { label: "Active Now", value: `${activeCount}/${totalCount}`, icon: Activity, color: activeCount > 0 ? "text-success" : "text-muted-dark" },
          { label: "Requests Today", value: metrics.isLive ? metrics.data.requests_today.toLocaleString() : "—", icon: CheckCircle2, color: "text-success" },
          { label: "Total Savings", value: metrics.isLive ? `${metrics.data.total_saved.toFixed(2)} USDC` : "—", icon: TrendingUp, color: "text-primary-light" },
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
          <>{[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}</>
        ) : dbAgents.length === 0 ? (
          <div className="col-span-2 text-center py-12 text-[13px] text-muted-dark">No agents configured. Visit the dashboard to seed default agents.</div>
        ) : dbAgents.map((agent, i) => {
          const cfg = (agent.config || {}) as { icon?: string; description?: string };
          const Icon = iconMap[cfg.icon || ""] || Bot;
          const isActive = agent.status === "active";
          const isExpanded = expandedAgent === agent.id;
          const mets = agentMetrics[agent.id];

          return (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              className="glass-bright rounded-xl overflow-hidden hover:border-primary/30 transition-colors"
            >
              <div className="p-6">
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
                            <span className={cn("inline-flex rounded-full h-1.5 w-1.5", agent.status === "disabled" ? "bg-danger" : "bg-warning")} />
                            <span className={cn("text-[10px] font-medium uppercase tracking-wider", agent.status === "disabled" ? "text-danger" : "text-warning")}>{agent.status}</span>
                          </>
                        )}
                        <span className="text-[9px] text-muted-dark ml-1">v{agent.version}</span>
                      </div>
                    </div>
                  </div>

                  {/* Health score gauge */}
                  <div className="text-right">
                    <div className={cn(
                      "text-lg font-bold",
                      agent.healthScore >= 80 ? "text-success" : agent.healthScore >= 50 ? "text-warning" : "text-danger"
                    )}>
                      {agent.healthScore}%
                    </div>
                    <span className="text-[9px] text-muted-dark">Health</span>
                  </div>
                </div>

                <p className="text-[12px] text-muted mb-4">{agent.description || cfg.description || `${agent.type} agent`}</p>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-white/[0.02] border border-border text-center">
                    <span className="text-[10px] text-muted-dark block">Tasks</span>
                    <span className="text-sm font-semibold text-foreground">{agent._count?.tasks || 0}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-white/[0.02] border border-border text-center">
                    <span className="text-[10px] text-muted-dark block">Last Active</span>
                    <span className="text-[11px] font-semibold text-foreground">{agent.lastActivityAt ? timeAgo(new Date(agent.lastActivityAt)) : "Never"}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-white/[0.02] border border-border text-center">
                    <span className="text-[10px] text-muted-dark block">Type</span>
                    <span className="text-[11px] font-semibold text-foreground capitalize">{agent.type}</span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 pt-3 border-t border-border">
                  {isActive ? (
                    <button
                      onClick={() => updateAgentStatus(agent.id, "idle")}
                      disabled={actionLoading === agent.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-warning hover:bg-warning/5 rounded-lg transition-colors"
                    >
                      <Pause size={12} /> Pause
                    </button>
                  ) : agent.status !== "disabled" ? (
                    <button
                      onClick={() => updateAgentStatus(agent.id, "active")}
                      disabled={actionLoading === agent.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-success hover:bg-success/5 rounded-lg transition-colors"
                    >
                      <Play size={12} /> Resume
                    </button>
                  ) : null}
                  <button
                    onClick={() => updateAgentStatus(agent.id, "active")}
                    disabled={actionLoading === agent.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-primary-light hover:bg-primary/5 rounded-lg transition-colors"
                  >
                    <RotateCcw size={12} /> Restart
                  </button>
                  {agent.status !== "disabled" && (
                    <button
                      onClick={() => updateAgentStatus(agent.id, "disabled")}
                      disabled={actionLoading === agent.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-danger hover:bg-danger/5 rounded-lg transition-colors"
                    >
                      <XOctagon size={12} /> Disable
                    </button>
                  )}
                  <button
                    onClick={() => toggleExpand(agent.id)}
                    className="ml-auto flex items-center gap-1 px-3 py-1.5 text-[11px] font-medium text-muted-dark hover:text-foreground hover:bg-white/[0.04] rounded-lg transition-colors"
                  >
                    Details {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>
                </div>
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div className="px-6 pb-6 border-t border-border/50">
                  {/* Metrics summary */}
                  {mets && (
                    <div className="mt-4 grid grid-cols-4 gap-3">
                      <div className="p-2 rounded-lg bg-white/[0.02] border border-border text-center">
                        <span className="text-[9px] text-muted-dark block">Success Rate</span>
                        <span className={cn("text-sm font-bold", mets.successRate >= 80 ? "text-success" : "text-warning")}>{mets.successRate}%</span>
                      </div>
                      <div className="p-2 rounded-lg bg-white/[0.02] border border-border text-center">
                        <span className="text-[9px] text-muted-dark block">Completed</span>
                        <span className="text-sm font-bold text-foreground">{mets.successCount}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-white/[0.02] border border-border text-center">
                        <span className="text-[9px] text-muted-dark block">Failed</span>
                        <span className="text-sm font-bold text-danger">{mets.failureCount}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-white/[0.02] border border-border text-center">
                        <span className="text-[9px] text-muted-dark block">Avg Duration</span>
                        <span className="text-sm font-bold text-foreground">{mets.avgDuration}ms</span>
                      </div>
                    </div>
                  )}

                  {/* Wallet info */}
                  {agent.wallet && (
                    <div className="mt-4 p-3 rounded-lg bg-white/[0.02] border border-border">
                      <span className="text-[10px] text-muted-dark block mb-1">Assigned Wallet</span>
                      <span className="text-[11px] font-mono text-muted">{agent.wallet.label} · {agent.wallet.address.slice(0, 6)}...{agent.wallet.address.slice(-4)}</span>
                    </div>
                  )}

                  {/* Last error */}
                  {agent.lastError && (
                    <div className="mt-4 p-3 rounded-lg bg-danger/5 border border-danger/20">
                      <div className="flex items-center gap-1.5 mb-1">
                        <XCircle size={12} className="text-danger" />
                        <span className="text-[10px] font-semibold text-danger">Last Error</span>
                      </div>
                      <p className="text-[11px] text-muted-dark font-mono">{agent.lastError}</p>
                    </div>
                  )}

                  <div className="mt-4 flex items-center gap-3 text-[10px] text-muted-dark">
                    <span>Created: {new Date(agent.createdAt).toLocaleDateString()}</span>
                    <span>ID: {agent.id.slice(0, 10)}...</span>
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
