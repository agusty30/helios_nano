"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { formatUsdc } from "@/lib/utils";
import { api } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import type { BudgetStateResponse, CanvasMetrics } from "@/lib/types";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { TrendingDown, Zap, Shield, PiggyBank, Wifi, WifiOff } from "lucide-react";

const MOCK_BUDGET: BudgetStateResponse = {
  dailyUsd: 10, spentToday: 0, remaining: 10, pctUsed: 0,
  callsToday: 0, burnRatePerHour: 0, projectedRunoutHours: null,
  byCategory: [], byService: [],
};

const MOCK_CANVAS: CanvasMetrics = {
  wallet_address: "0x...", usdc_balance: 0, active_throughput: 0,
  last_route: "—", daily_spend: 0, total_saved: 0,
  requests_today: 0, budget_remaining: 0, circuit_breaker: false, chain: "Arc Testnet (5042002)",
};

interface AnalyticsData {
  summary: { totalSpend: number; transactionCount: number; completedTransactions: number; activeAgents: number; totalTasks: number };
  costBreakdown: Array<{ category: string; amount: number; percentage: number }>;
  spendingTrend: Array<{ date: string; amount: number }>;
  agentPerformance: Array<{ id: string; name: string; type: string; status: string }>;
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    fetch("/api/analytics")
      .then(r => r.ok ? r.json() : null)
      .then(data => data && setAnalytics(data))
      .catch(() => {});
  }, []);

  const fetchBudget = useCallback(() => api.fetchBudgetState(), []);
  const fetchMetrics = useCallback(() => api.fetchCanvasMetrics(), []);
  const budget = useApi(fetchBudget, MOCK_BUDGET, 15000);
  const metrics = useApi(fetchMetrics, MOCK_CANVAS, 10000);

  const anyLive = !!analytics || budget.isLive || metrics.isLive;

  const savingsData = useMemo(() => {
    if (analytics?.spendingTrend?.length) {
      return analytics.spendingTrend.map(d => ({
        month: d.date,
        savings: d.amount * 0.3,
        aiSavings: d.amount * 0.12,
      }));
    }
    return [];
  }, [analytics]);

  const deptEfficiency = useMemo(() => {
    if (!analytics?.costBreakdown?.length) return [];
    const total = analytics.summary.totalSpend;
    return analytics.costBreakdown.map(c => ({
      name: c.category,
      pct: c.percentage,
      amount: c.amount,
      allocated: total > 0 ? (total / analytics.costBreakdown.length) * 1.3 : 1000,
    }));
  }, [analytics]);

  const liveTraction = useMemo(() => {
    const m = metrics.data;
    const a = analytics?.summary;
    return {
      totalAutonomousPayments: metrics.isLive ? m.requests_today : a?.completedTransactions || 0,
      avgTransactionSize: a && a.transactionCount > 0 ? a.totalSpend / a.transactionCount : (metrics.isLive && m.requests_today > 0 ? m.daily_spend / m.requests_today : 0),
      budgetUtilizationEfficiency: metrics.isLive && m.daily_spend + m.budget_remaining > 0
        ? ((m.daily_spend / (m.daily_spend + m.budget_remaining)) * 100) : 0,
      costPerTaskCompleted: a && a.totalTasks > 0 ? a.totalSpend / a.totalTasks : 0,
    };
  }, [metrics.data, metrics.isLive, analytics]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
          <p className="text-sm text-muted-dark mt-1">Executive insights and AI-driven financial intelligence</p>
        </div>
        {anyLive ? (
          <span className="flex items-center gap-1.5 text-[11px] font-medium text-success"><Wifi size={12} /> Live</span>
        ) : (
          <span className="flex items-center gap-1.5 text-[11px] font-medium text-muted-dark"><WifiOff size={12} /> Loading...</span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Spend", value: analytics ? formatUsdc(analytics.summary.totalSpend, 2) : (budget.isLive ? formatUsdc(budget.data.spentToday, 4) : "—"), sub: analytics ? `${analytics.summary.completedTransactions} completed txns` : "loading...", icon: PiggyBank, color: "text-success" },
          { label: "AI Optimization", value: metrics.isLive ? formatUsdc(metrics.data.total_saved, 2) : "—", sub: metrics.isLive ? "total savings from routing" : "connect backend for data", icon: Zap, color: "text-primary-light" },
          { label: "Budget Used", value: budget.isLive ? `${(budget.data.pctUsed * 100).toFixed(1)}%` : (analytics ? `${analytics.summary.transactionCount} txns` : "—"), sub: budget.isLive ? "budget utilization" : "total transactions", icon: TrendingDown, color: "text-success" },
          { label: "Active Agents", value: analytics ? analytics.summary.activeAgents.toString() : "—", sub: "autonomous agents running", icon: Shield, color: "text-primary-light" },
        ].map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-bright rounded-xl p-5"
          >
            <div className="flex items-center gap-2 mb-3">
              <card.icon size={16} className={card.color} />
              <span className="text-[11px] text-muted-dark">{card.label}</span>
            </div>
            <span className="text-2xl font-bold text-foreground">{card.value}</span>
            <span className="block text-[11px] text-muted-dark mt-1">{card.sub}</span>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-bright rounded-xl p-6"
        >
          <h3 className="text-sm font-semibold text-foreground mb-1">Spending Trend</h3>
          <p className="text-[11px] text-muted-dark mb-5">Daily spend over the past 30 days</p>
          <div className="h-[260px]">
            {savingsData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={savingsData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gSav" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis dataKey="month" tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${v.toFixed(0)} USDC`} />
                  <Tooltip contentStyle={{ background: "#151B2E", border: "1px solid #1E293B", borderRadius: 8, fontSize: 12 }} formatter={(value: number) => [formatUsdc(value, 4), undefined]} />
                  <Area type="monotone" dataKey="savings" stroke="#10B981" strokeWidth={2} fill="url(#gSav)" />
                  <Area type="monotone" dataKey="aiSavings" stroke="#4F46E5" strokeWidth={1.5} strokeDasharray="4 4" fill="none" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-[13px] text-muted-dark">No spending data yet</div>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-bright rounded-xl p-6"
        >
          <h3 className="text-sm font-semibold text-foreground mb-1">Department Efficiency</h3>
          <p className="text-[11px] text-muted-dark mb-5">Spend distribution by department</p>
          <div className="h-[260px]">
            {deptEfficiency.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={deptEfficiency}
                  layout="vertical"
                  margin={{ top: 0, right: 0, left: 20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" horizontal={false} />
                  <XAxis type="number" tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={(v: number) => `${v}%`} />
                  <YAxis type="category" dataKey="name" tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
                  <Tooltip contentStyle={{ background: "#151B2E", border: "1px solid #1E293B", borderRadius: 8, fontSize: 12 }} formatter={(value: number) => [`${value}%`, "Share"]} />
                  <Bar dataKey="pct" radius={[0, 4, 4, 0]}>
                    {deptEfficiency.map((d, i) => (
                      <Cell key={i} fill={d.pct > 40 ? "#EF4444" : d.pct > 25 ? "#F59E0B" : "#10B981"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-[13px] text-muted-dark">No department data yet</div>
            )}
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-bright rounded-xl p-6"
      >
        <h3 className="text-sm font-semibold text-foreground mb-1">AI Agent Performance</h3>
        <p className="text-[11px] text-muted-dark mb-5">Key traction metrics for autonomous operations</p>
        <div className="grid grid-cols-4 gap-6">
          {[
            { label: "Autonomous Payments", value: liveTraction.totalAutonomousPayments.toLocaleString(), detail: "Total processed" },
            { label: "Avg Tx Size", value: `${liveTraction.avgTransactionSize.toFixed(4)} USDC`, detail: "Per transaction" },
            { label: "Budget Utilization", value: `${liveTraction.budgetUtilizationEfficiency.toFixed(1)}%`, detail: "Allocation efficiency" },
            { label: "Cost / Task", value: `${liveTraction.costPerTaskCompleted.toFixed(4)} USDC`, detail: "Per completed operation" },
          ].map((m) => (
            <div key={m.label} className="text-center p-4 rounded-lg bg-white/[0.02] border border-border">
              <span className="text-2xl font-bold text-foreground">{m.value}</span>
              <span className="block text-[12px] font-medium text-foreground mt-1">{m.label}</span>
              <span className="block text-[10px] text-muted-dark">{m.detail}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
