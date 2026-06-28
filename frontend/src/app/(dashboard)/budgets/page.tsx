"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { cn, formatUsdc } from "@/lib/utils";
import { api } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import type { BudgetStateResponse } from "@/lib/types";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { TrendingUp, TrendingDown, AlertTriangle, Wifi, WifiOff } from "lucide-react";

const MOCK_BUDGET: BudgetStateResponse = {
  dailyUsd: 10, spentToday: 0, remaining: 10, pctUsed: 0,
  callsToday: 0, burnRatePerHour: 0, projectedRunoutHours: null,
  byCategory: [], byService: [],
};

interface CostItem {
  category: string;
  amount: number;
  percentage: number;
}

interface AnalyticsData {
  summary: { totalSpend: number; transactionCount: number; completedTransactions: number; activeAgents: number; totalTasks: number };
  costBreakdown: CostItem[];
  spendingTrend: Array<{ date: string; amount: number }>;
}

export default function BudgetsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    fetch("/api/analytics")
      .then(r => r.ok ? r.json() : null)
      .then(data => data && setAnalytics(data))
      .catch(() => {});
  }, []);

  const fetchBudget = useCallback(() => api.fetchBudgetState(), []);
  const budget = useApi(fetchBudget, MOCK_BUDGET, 15000);

  const displayBudgets = useMemo(() => {
    if (budget.isLive && budget.data.byCategory.length > 0) {
      return budget.data.byCategory.map((cat) => ({
        department: cat.key,
        allocated: budget.data.dailyUsd / budget.data.byCategory.length,
        spent: cat.spent,
        forecast: cat.spent * 1.1,
        trend: 0,
      }));
    }
    if (analytics?.costBreakdown?.length) {
      const total = analytics.summary.totalSpend;
      return analytics.costBreakdown.map(c => ({
        department: c.category,
        allocated: total > 0 ? (total / analytics.costBreakdown.length) * 1.3 : 1000,
        spent: c.amount,
        forecast: c.amount * 1.05,
        trend: 0,
      }));
    }
    return [];
  }, [budget.data, budget.isLive, analytics]);

  const totalAllocated = displayBudgets.reduce((s, b) => s + b.allocated, 0);
  const totalSpent = displayBudgets.reduce((s, b) => s + b.spent, 0);
  const totalForecast = displayBudgets.reduce((s, b) => s + b.forecast, 0);
  const anyLive = !!analytics || budget.isLive;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Budgets</h1>
          <p className="text-sm text-muted-dark mt-1">
            {budget.isLive ? "Live budget state from x402 budget engine" : "Department budget allocation and spend tracking"}
          </p>
        </div>
        {anyLive ? (
          <span className="flex items-center gap-1.5 text-[11px] font-medium text-success"><Wifi size={12} /> Live</span>
        ) : (
          <span className="flex items-center gap-1.5 text-[11px] font-medium text-muted-dark"><WifiOff size={12} /> Loading...</span>
        )}
      </div>

      {budget.isLive && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary/20 via-primary/10 to-transparent border border-primary/20 p-5"
        >
          <div className="grid grid-cols-5 gap-4">
            <div><span className="text-[10px] text-muted-dark block">Daily Budget</span><span className="text-lg font-bold font-mono text-foreground">{budget.data.dailyUsd.toFixed(2)} USDC</span></div>
            <div><span className="text-[10px] text-muted-dark block">Spent Today</span><span className="text-lg font-bold font-mono text-foreground">{budget.data.spentToday.toFixed(4)} USDC</span></div>
            <div><span className="text-[10px] text-muted-dark block">Remaining</span><span className="text-lg font-bold font-mono text-success">{budget.data.remaining.toFixed(4)} USDC</span></div>
            <div><span className="text-[10px] text-muted-dark block">Calls Today</span><span className="text-lg font-bold font-mono text-foreground">{budget.data.callsToday}</span></div>
            <div><span className="text-[10px] text-muted-dark block">Burn Rate</span><span className="text-lg font-bold font-mono text-foreground">{budget.data.burnRatePerHour.toFixed(4)} USDC/hr</span></div>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Allocated", value: formatUsdc(totalAllocated, 2), color: "text-primary-light" },
          { label: "Total Spent", value: formatUsdc(totalSpent, 2), color: "text-foreground" },
          { label: "Forecasted", value: formatUsdc(totalForecast, 2), color: "text-warning" },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-bright rounded-xl p-5"
          >
            <span className="text-[11px] text-muted-dark block mb-1">{s.label}</span>
            <span className={cn("text-2xl font-bold font-mono", s.color)}>{s.value}</span>
          </motion.div>
        ))}
      </div>

      {displayBudgets.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-bright rounded-xl p-6"
        >
          <h3 className="text-sm font-semibold text-foreground mb-5">
            {budget.isLive ? "Spend by Category (Live)" : "Budget vs Actual by Department"}
          </h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={displayBudgets} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="department" tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => budget.isLive ? `${v.toFixed(2)} USDC` : `${(v / 1000).toFixed(0)}k USDC`} />
                <Tooltip contentStyle={{ background: "#151B2E", border: "1px solid #1E293B", borderRadius: 8, fontSize: 12 }} formatter={(value: number) => [formatUsdc(value, 4), undefined]} />
                <Bar dataKey="allocated" fill="#4F46E5" radius={[4, 4, 0, 0]} opacity={0.3} />
                <Bar dataKey="spent" radius={[4, 4, 0, 0]}>
                  {displayBudgets.map((b, i) => (
                    <Cell key={i} fill={b.spent / b.allocated > 0.9 ? "#EF4444" : b.spent / b.allocated > 0.75 ? "#F59E0B" : "#10B981"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {displayBudgets.length === 0 ? (
          <div className="col-span-2 text-center py-12 text-[13px] text-muted-dark">No budget data available yet. Transactions will populate department budgets.</div>
        ) : displayBudgets.map((b, i) => {
          const pct = b.allocated > 0 ? (b.spent / b.allocated) * 100 : 0;
          const overBudget = b.forecast > b.allocated;
          return (
            <motion.div
              key={b.department}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.04 }}
              className="glass-bright rounded-xl p-5 hover:border-primary/20 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-[14px] font-semibold text-foreground capitalize">{b.department}</h4>
                {b.trend !== 0 && (
                  <div className="flex items-center gap-1.5">
                    {b.trend > 0 ? <TrendingUp size={12} className="text-danger" /> : <TrendingDown size={12} className="text-success" />}
                    <span className={cn("text-[11px] font-semibold font-mono", b.trend > 0 ? "text-danger" : "text-success")}>
                      {b.trend > 0 ? "+" : ""}{b.trend}%
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4 mb-3 text-[12px]">
                <div><span className="text-muted-dark">Spent: </span><span className="font-semibold text-foreground font-mono">{formatUsdc(b.spent, 4)}</span></div>
                <span className="text-muted-dark">/</span>
                <div><span className="text-muted-dark">Budget: </span><span className="font-semibold text-foreground font-mono">{formatUsdc(b.allocated, 2)}</span></div>
              </div>
              <div className="w-full bg-white/5 rounded-full h-2 mb-2">
                <div className={cn("h-2 rounded-full transition-all", pct > 90 ? "bg-danger" : pct > 75 ? "bg-warning" : "bg-success")} style={{ width: `${Math.min(pct, 100)}%` }} />
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-muted-dark">{pct.toFixed(1)}% utilized</span>
                {overBudget && <span className="flex items-center gap-1 text-warning"><AlertTriangle size={10} /> Over forecast</span>}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
