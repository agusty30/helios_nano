"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import KpiCards from "@/components/dashboard/KpiCards";
import TractionBanner from "@/components/dashboard/TractionBanner";
import TreasuryPanel from "@/components/dashboard/TreasuryPanel";
import SpendingChart from "@/components/dashboard/SpendingChart";
import CostBreakdownChart from "@/components/dashboard/CostBreakdownChart";
import RecentTransactions from "@/components/dashboard/RecentTransactions";
import ActivityFeed from "@/components/dashboard/ActivityFeed";
import { api } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { useToast } from "@/components/ui/Toast";
import { SkeletonDashboard } from "@/components/ui/Skeleton";
import type { CanvasMetrics, TransferResponse } from "@/lib/types";
import { formatUsdc } from "@/lib/utils";
import { Wifi, WifiOff, Trophy, TrendingUp, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

interface DashboardData {
  kpis: {
    totalSpend: number;
    transactionCount: number;
    activeAgents: number;
    totalAgents: number;
    walletCount: number;
    pendingApprovals: number;
    totalTasks: number;
    completedTasks: number;
  };
  costBreakdown: Array<{ category: string; amount: number; percentage: number }>;
  recentActivity: Array<{ id: string; action: string; detail: string; timestamp: string; type: string }>;
  agents: Array<{ id: string; name: string; type: string; status: string }>;
}

interface KpiData {
  current: {
    totalPayments: number;
    totalVolume: number;
    avgTransactionSize: number;
    budgetEfficiency: number;
    costPerTask: number;
    taskSuccessRate: number;
    totalAgentExecutions: number;
    estimatedSavings: number;
    activeAgents: number;
    avgExecutionTime: number;
    totalApiCost: number;
    totalApiCalls: number;
    wallets: number;
  };
  history: Array<{
    periodStart: string;
    totalPayments: number;
    totalVolume: number;
    avgTransactionSize: number;
    costPerTask: number;
    totalApiCost: number;
  }>;
}

interface AgentLeaderEntry {
  id: string;
  name: string;
  type: string;
  status: string;
  totalTasks: number;
  successRate: number;
  avgDuration: number;
  healthScore: number;
}

const COLORS = ["#6366f1", "#8b5cf6", "#a855f7", "#ec4899", "#f43f5e", "#f97316", "#eab308", "#22c55e"];

const MOCK_CANVAS: CanvasMetrics = {
  wallet_address: "0x...", usdc_balance: 0, active_throughput: 0,
  last_route: "—", daily_spend: 0, total_saved: 0,
  requests_today: 0, budget_remaining: 0, circuit_breaker: false, chain: "Arc Testnet (5042002)",
};

const MOCK_TRANSFERS: TransferResponse = { transfers: [] };

export default function DashboardPage() {
  const [dbData, setDbData] = useState<DashboardData | null>(null);
  const [kpiData, setKpiData] = useState<KpiData | null>(null);
  const [leaderboard, setLeaderboard] = useState<AgentLeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeded, setSeeded] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/dashboard").then(r => r.ok ? r.json() : null),
      fetch("/api/kpi?days=30").then(r => r.ok ? r.json() : null).catch(() => null),
      fetch("/api/kpi/agents").then(r => r.ok ? r.json() : null).catch(() => null),
    ]).then(([dashData, kpi, agents]) => {
      if (dashData) {
        setDbData(dashData);
        if (dashData.agents.length === 0 && !seeded) {
          fetch("/api/seed", { method: "POST" }).then(r => r.json()).then(seed => {
            if (seed.seeded) {
              setSeeded(true);
              fetch("/api/dashboard").then(r => r.ok ? r.json() : null).then(d => d && setDbData(d));
            }
          }).catch(() => {});
        }
      }
      if (kpi) setKpiData(kpi);
      if (agents?.leaderboard) setLeaderboard(agents.leaderboard);
    }).catch(() => {
      toast("Failed to load dashboard data", "error");
    }).finally(() => setLoading(false));
  }, [seeded]);

  const fetchMetrics = useCallback(() => api.fetchCanvasMetrics(), []);
  const fetchTransfers = useCallback(() => api.fetchTransfers(10), []);
  const metrics = useApi(fetchMetrics, MOCK_CANVAS, 10000);
  const transfers = useApi(fetchTransfers, MOCK_TRANSFERS, 15000);

  const d = dbData?.kpis;
  const k = kpiData?.current;

  const liveKpis = useMemo(() => {
    const m = metrics.data;
    return [
      { label: "Total Volume", value: formatUsdc(k?.totalVolume || d?.totalSpend || 0, 2), change: 0, icon: "DollarSign" },
      { label: "Transactions", value: (k?.totalPayments || d?.transactionCount || 0).toLocaleString(), change: 0, icon: "Target" },
      { label: "Success Rate", value: `${(k?.taskSuccessRate || 100).toFixed(1)}%`, change: 0, icon: "Bot" },
      { label: "Savings Generated", value: formatUsdc(k?.estimatedSavings || (metrics.isLive ? m.total_saved : 0), 2), change: 0, icon: "PiggyBank" },
      { label: "Pending Approvals", value: (d?.pendingApprovals || 0).toString(), change: 0, icon: "Clock" },
      { label: "Active Agents", value: `${k?.activeAgents || d?.activeAgents || 0}/${d?.totalAgents || 0}`, change: 0, icon: "Activity" },
    ];
  }, [d, k, metrics.data, metrics.isLive]);

  const tractionData = useMemo(() => ({
    totalAutonomousPayments: k?.totalPayments || d?.completedTasks || 0,
    avgTransactionSize: k?.avgTransactionSize || (d && d.transactionCount > 0 ? d.totalSpend / d.transactionCount : 0),
    budgetUtilizationEfficiency: k?.budgetEfficiency || 0,
    costPerTaskCompleted: k?.costPerTask || (d && d.completedTasks > 0 ? d.totalSpend / d.completedTasks : 0),
  }), [d, k]);

  const chartBreakdown = useMemo(() => {
    if (!dbData?.costBreakdown?.length) return [{ category: "No data", amount: 0, percentage: 100, color: "#334155" }];
    return dbData.costBreakdown.map((c, i) => ({ ...c, color: COLORS[i % COLORS.length] }));
  }, [dbData]);

  const spendingChartData = useMemo(() => {
    if (kpiData?.history?.length) {
      return kpiData.history.slice(-8).map(snap => {
        const label = new Date(snap.periodStart).toLocaleDateString("en-US", { month: "short", day: "numeric" });
        return {
          month: label,
          actual: snap.totalVolume,
          budget: snap.totalVolume * 1.2,
          optimized: snap.totalVolume - snap.totalApiCost,
        };
      });
    }
    if (!d?.totalSpend) return [];
    return [
      { month: "Week 1", actual: d.totalSpend * 0.2, budget: d.totalSpend * 0.3, optimized: d.totalSpend * 0.15 },
      { month: "Week 2", actual: d.totalSpend * 0.25, budget: d.totalSpend * 0.3, optimized: d.totalSpend * 0.2 },
      { month: "Week 3", actual: d.totalSpend * 0.3, budget: d.totalSpend * 0.3, optimized: d.totalSpend * 0.22 },
      { month: "Week 4", actual: d.totalSpend * 0.25, budget: d.totalSpend * 0.3, optimized: d.totalSpend * 0.18 },
    ];
  }, [kpiData, d]);

  const liveTransactions = useMemo(() => {
    if (transfers.isLive && transfers.data.transfers.length > 0) {
      return transfers.data.transfers.map(t => ({
        id: t.id.slice(0, 8),
        vendor: "x402 Settlement",
        amount: parseFloat(t.amount) / 1_000_000,
        status: (t.status === "completed" || t.status === "confirmed" ? "completed" : "pending") as "completed" | "pending" | "failed",
        agent: "Payment Agent",
        category: "x402",
        timestamp: new Date(t.createdAt).toLocaleTimeString(),
      }));
    }
    if (!dbData?.recentActivity?.length) return [];
    return dbData.recentActivity.map(a => ({
      id: a.id.slice(0, 8),
      vendor: a.action,
      amount: parseFloat(a.detail.match(/[\d.]+/)?.[0] || "0"),
      status: (a.type === "success" ? "completed" : a.type === "warning" ? "failed" : "pending") as "completed" | "pending" | "failed",
      agent: "HeliOS",
      category: a.action,
      timestamp: new Date(a.timestamp).toLocaleTimeString(),
    }));
  }, [transfers.data, transfers.isLive, dbData]);

  const activityData = useMemo(() => {
    if (!dbData?.recentActivity?.length) return [];
    return dbData.recentActivity.map(a => ({
      id: a.id,
      agent: "HeliOS",
      action: a.action,
      detail: a.detail,
      timestamp: new Date(a.timestamp).toLocaleString(),
      type: a.type as "success" | "info" | "warning" | "action",
    }));
  }, [dbData]);

  const anyLive = !!dbData || metrics.isLive || transfers.isLive;

  if (loading && !dbData) return <SkeletonDashboard />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-dark mt-1">Autonomous financial operations overview</p>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-medium">
          {anyLive ? (
            <span className="flex items-center gap-1.5 text-success"><Wifi size={12} /> Live</span>
          ) : (
            <span className="flex items-center gap-1.5 text-muted-dark"><WifiOff size={12} /> Loading...</span>
          )}
        </div>
      </div>

      <TractionBanner data={tractionData} />
      <TreasuryPanel />
      <KpiCards data={liveKpis} />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          {spendingChartData.length > 0 ? (
            <SpendingChart data={spendingChartData} />
          ) : (
            <div className="glass-bright rounded-xl p-6 h-[340px] flex items-center justify-center">
              <p className="text-sm text-muted-dark">No spending data yet</p>
            </div>
          )}
        </div>
        <div className="lg:col-span-2">
          <CostBreakdownChart data={chartBreakdown} />
        </div>
      </div>

      {leaderboard.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="glass-bright rounded-xl p-6"
        >
          <div className="flex items-center gap-2 mb-5">
            <Trophy size={16} className="text-warning" />
            <h3 className="text-sm font-semibold text-foreground">Agent Leaderboard</h3>
            <span className="text-[10px] text-muted-dark ml-1">Last 30 days performance</span>
          </div>
          <div className="space-y-1">
            {leaderboard.slice(0, 8).map((agent, i) => (
              <div key={agent.id} className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-white/[0.02] transition-colors">
                <span className="w-5 text-center text-[12px] font-bold text-muted-dark">
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`}
                </span>
                <div className="flex-1 min-w-0">
                  <span className="text-[13px] font-medium text-foreground">{agent.name}</span>
                  <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-full ${agent.status === "active" ? "bg-success/10 text-success" : "bg-muted-dark/20 text-muted-dark"}`}>
                    {agent.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-[12px] font-mono">
                  <div className="text-right">
                    <span className="text-foreground">{agent.totalTasks}</span>
                    <span className="block text-[9px] text-muted-dark">tasks</span>
                  </div>
                  <div className="text-right">
                    <span className={agent.successRate >= 80 ? "text-success" : agent.successRate >= 50 ? "text-warning" : "text-danger"}>
                      {agent.successRate}%
                    </span>
                    <span className="block text-[9px] text-muted-dark">success</span>
                  </div>
                  <div className="text-right">
                    <span className="text-foreground">{agent.avgDuration > 0 ? `${(agent.avgDuration / 1000).toFixed(1)}s` : "—"}</span>
                    <span className="block text-[9px] text-muted-dark">avg time</span>
                  </div>
                  <div className="w-12">
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${agent.healthScore >= 80 ? "bg-success" : agent.healthScore >= 50 ? "bg-warning" : "bg-danger"}`}
                        style={{ width: `${agent.healthScore}%` }}
                      />
                    </div>
                    <span className="block text-[9px] text-muted-dark text-center mt-0.5">health</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentTransactions data={liveTransactions} />
        <ActivityFeed data={activityData} />
      </div>
    </div>
  );
}
