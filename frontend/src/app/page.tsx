"use client";

import { useMemo, useCallback } from "react";
import KpiCards from "@/components/dashboard/KpiCards";
import TractionBanner from "@/components/dashboard/TractionBanner";
import SpendingChart from "@/components/dashboard/SpendingChart";
import CostBreakdownChart from "@/components/dashboard/CostBreakdownChart";
import RecentTransactions from "@/components/dashboard/RecentTransactions";
import ActivityFeed from "@/components/dashboard/ActivityFeed";
import { api } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import {
  kpis, tractionMetrics, spendingData, costBreakdown, transactions, activityFeed,
} from "@/lib/mock-data";
import type { BudgetStateResponse, CanvasMetrics, TransferResponse } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { Wifi, WifiOff } from "lucide-react";

const MOCK_BUDGET: BudgetStateResponse = {
  dailyUsd: 10, spentToday: 2.84, remaining: 7.16, pctUsed: 0.284,
  callsToday: 1847, burnRatePerHour: 0.118, projectedRunoutHours: 60.7,
  byCategory: [], byService: [],
};

const MOCK_CANVAS: CanvasMetrics = {
  wallet_address: "0x...", usdc_balance: 7.16, active_throughput: 0,
  last_route: "cheap_tier", daily_spend: 2.84, total_saved: 42.38,
  requests_today: 1847, budget_remaining: 7.16, circuit_breaker: false, chain: "Arc Testnet (5042002)",
};

const MOCK_TRANSFERS: TransferResponse = { transfers: [] };

export default function DashboardPage() {
  const fetchBudget = useCallback(() => api.fetchBudgetState(), []);
  const fetchMetrics = useCallback(() => api.fetchCanvasMetrics(), []);
  const fetchTransfers = useCallback(() => api.fetchTransfers(10), []);

  const budget = useApi(fetchBudget, MOCK_BUDGET, 15000);
  const metrics = useApi(fetchMetrics, MOCK_CANVAS, 10000);
  const transfers = useApi(fetchTransfers, MOCK_TRANSFERS, 15000);

  const liveKpis = useMemo(() => {
    const b = budget.data;
    const m = metrics.data;
    if (!budget.isLive && !metrics.isLive) return kpis;
    return [
      { label: "Daily Spend", value: formatCurrency(b.spentToday), change: -8.2, icon: "DollarSign" },
      { label: "Budget Utilization", value: `${(b.pctUsed * 100).toFixed(1)}%`, change: 3.1, icon: "Target" },
      { label: "Autonomous Txns", value: m.requests_today.toLocaleString(), change: 24.6, icon: "Bot" },
      { label: "Savings Generated", value: formatCurrency(m.total_saved), change: 18.3, icon: "PiggyBank" },
      { label: "Budget Remaining", value: formatCurrency(b.remaining), change: 0, icon: "Clock" },
      { label: "Active Agents", value: m.circuit_breaker ? "PAUSED" : "4/4", change: 0, icon: "Activity" },
    ];
  }, [budget.data, budget.isLive, metrics.data, metrics.isLive]);

  const liveTraction = useMemo(() => {
    const m = metrics.data;
    if (!metrics.isLive) return tractionMetrics;
    return {
      totalAutonomousPayments: m.requests_today,
      avgTransactionSize: m.daily_spend > 0 && m.requests_today > 0 ? m.daily_spend / m.requests_today : 0.0042,
      budgetUtilizationEfficiency: ((m.daily_spend / (m.daily_spend + m.budget_remaining)) * 100) || 0,
      costPerTaskCompleted: m.daily_spend > 0 && m.requests_today > 0 ? m.daily_spend / m.requests_today : 0.0018,
    };
  }, [metrics.data, metrics.isLive]);

  const liveTransactions = useMemo(() => {
    if (!transfers.isLive || transfers.data.transfers.length === 0) return transactions;
    return transfers.data.transfers.map((t, i) => ({
      id: t.id.slice(0, 8),
      vendor: `x402 Settlement`,
      amount: parseFloat(t.amount) / 1_000_000,
      status: t.status === "completed" || t.status === "confirmed" ? "completed" as const : "pending" as const,
      agent: "Payment Agent",
      category: "x402",
      timestamp: new Date(t.createdAt).toLocaleTimeString(),
    }));
  }, [transfers.data, transfers.isLive]);

  const anyLive = budget.isLive || metrics.isLive || transfers.isLive;

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
            <span className="flex items-center gap-1.5 text-muted-dark"><WifiOff size={12} /> Demo</span>
          )}
        </div>
      </div>

      <TractionBanner data={liveTraction} />
      <KpiCards data={liveKpis} />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <SpendingChart data={spendingData} />
        </div>
        <div className="lg:col-span-2">
          <CostBreakdownChart data={costBreakdown} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentTransactions data={liveTransactions} />
        <ActivityFeed data={activityFeed} />
      </div>
    </div>
  );
}
