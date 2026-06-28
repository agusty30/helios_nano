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
import type { CanvasMetrics, TransferResponse } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { Wifi, WifiOff } from "lucide-react";

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

const COLORS = ["#6366f1", "#8b5cf6", "#a855f7", "#ec4899", "#f43f5e", "#f97316", "#eab308", "#22c55e"];

const MOCK_CANVAS: CanvasMetrics = {
  wallet_address: "0x...", usdc_balance: 0, active_throughput: 0,
  last_route: "—", daily_spend: 0, total_saved: 0,
  requests_today: 0, budget_remaining: 0, circuit_breaker: false, chain: "Arc Testnet (5042002)",
};

const MOCK_TRANSFERS: TransferResponse = { transfers: [] };

export default function DashboardPage() {
  const [dbData, setDbData] = useState<DashboardData | null>(null);
  const [seeded, setSeeded] = useState(false);

  useEffect(() => {
    fetch("/api/dashboard").then(r => r.ok ? r.json() : null).then(data => {
      if (data) {
        setDbData(data);
        if (data.agents.length === 0 && !seeded) {
          fetch("/api/seed", { method: "POST" }).then(r => r.json()).then(seed => {
            if (seed.seeded) {
              setSeeded(true);
              fetch("/api/dashboard").then(r => r.ok ? r.json() : null).then(d => d && setDbData(d));
            }
          }).catch(() => {});
        }
      }
    }).catch(() => {});
  }, [seeded]);

  const fetchMetrics = useCallback(() => api.fetchCanvasMetrics(), []);
  const fetchTransfers = useCallback(() => api.fetchTransfers(10), []);
  const metrics = useApi(fetchMetrics, MOCK_CANVAS, 10000);
  const transfers = useApi(fetchTransfers, MOCK_TRANSFERS, 15000);

  const d = dbData?.kpis;
  const liveKpis = useMemo(() => {
    const m = metrics.data;
    return [
      { label: "Total Spend", value: formatCurrency(d?.totalSpend || 0), change: 0, icon: "DollarSign" },
      { label: "Transactions", value: (d?.transactionCount || 0).toLocaleString(), change: 0, icon: "Target" },
      { label: "Autonomous Txns", value: (metrics.isLive ? m.requests_today : d?.completedTasks || 0).toLocaleString(), change: 0, icon: "Bot" },
      { label: "Savings Generated", value: formatCurrency(metrics.isLive ? m.total_saved : 0), change: 0, icon: "PiggyBank" },
      { label: "Pending Approvals", value: (d?.pendingApprovals || 0).toString(), change: 0, icon: "Clock" },
      { label: "Active Agents", value: `${d?.activeAgents || 0}/${d?.totalAgents || 0}`, change: 0, icon: "Activity" },
    ];
  }, [d, metrics.data, metrics.isLive]);

  const tractionData = useMemo(() => {
    const m = metrics.data;
    return {
      totalAutonomousPayments: metrics.isLive ? m.requests_today : d?.completedTasks || 0,
      avgTransactionSize: d && d.transactionCount > 0 ? d.totalSpend / d.transactionCount : 0,
      budgetUtilizationEfficiency: metrics.isLive && m.daily_spend + m.budget_remaining > 0
        ? (m.daily_spend / (m.daily_spend + m.budget_remaining)) * 100 : 0,
      costPerTaskCompleted: d && d.completedTasks > 0 ? d.totalSpend / d.completedTasks : 0,
    };
  }, [d, metrics.data, metrics.isLive]);

  const chartBreakdown = useMemo(() => {
    if (!dbData?.costBreakdown?.length) return [{ category: "No data", amount: 0, percentage: 100, color: "#334155" }];
    return dbData.costBreakdown.map((c, i) => ({ ...c, color: COLORS[i % COLORS.length] }));
  }, [dbData]);

  const spendingChartData = useMemo(() => {
    return [
      { month: "Week 1", actual: (d?.totalSpend || 0) * 0.2, budget: (d?.totalSpend || 0) * 0.3, optimized: (d?.totalSpend || 0) * 0.15 },
      { month: "Week 2", actual: (d?.totalSpend || 0) * 0.25, budget: (d?.totalSpend || 0) * 0.3, optimized: (d?.totalSpend || 0) * 0.2 },
      { month: "Week 3", actual: (d?.totalSpend || 0) * 0.3, budget: (d?.totalSpend || 0) * 0.3, optimized: (d?.totalSpend || 0) * 0.22 },
      { month: "Week 4", actual: (d?.totalSpend || 0) * 0.25, budget: (d?.totalSpend || 0) * 0.3, optimized: (d?.totalSpend || 0) * 0.18 },
    ];
  }, [d]);

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
          <SpendingChart data={spendingChartData} />
        </div>
        <div className="lg:col-span-2">
          <CostBreakdownChart data={chartBreakdown} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentTransactions data={liveTransactions} />
        <ActivityFeed data={activityData} />
      </div>
    </div>
  );
}
