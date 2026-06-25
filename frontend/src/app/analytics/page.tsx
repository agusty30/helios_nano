"use client";

import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/utils";
import { spendingData, costBreakdown, budgets, tractionMetrics } from "@/lib/mock-data";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { TrendingDown, Zap, Shield, PiggyBank } from "lucide-react";

const savingsData = spendingData.map((d) => ({
  month: d.month,
  savings: d.budget - d.actual,
  aiSavings: d.actual - d.optimized,
}));

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-sm text-muted-dark mt-1">Executive insights and AI-driven financial intelligence</p>
      </div>

      {/* Insight cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Monthly Savings", value: "$56,000", sub: "vs allocated budget", icon: PiggyBank, color: "text-success" },
          { label: "AI Optimization", value: "$26,000", sub: "additional savings from AI", icon: Zap, color: "text-primary-light" },
          { label: "Cost Reduction", value: "16.5%", sub: "month-over-month", icon: TrendingDown, color: "text-success" },
          { label: "Compliance Score", value: "98.7%", sub: "all policies met", icon: Shield, color: "text-primary-light" },
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

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Savings trend */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-bright rounded-xl p-6"
        >
          <h3 className="text-sm font-semibold text-foreground mb-1">Savings Trend</h3>
          <p className="text-[11px] text-muted-dark mb-5">Budget savings + AI optimization impact</p>
          <div className="h-[260px]">
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
                <YAxis tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ background: "#151B2E", border: "1px solid #1E293B", borderRadius: 8, fontSize: 12 }} formatter={(value: number) => [formatCurrency(value), undefined]} />
                <Area type="monotone" dataKey="savings" stroke="#10B981" strokeWidth={2} fill="url(#gSav)" />
                <Area type="monotone" dataKey="aiSavings" stroke="#4F46E5" strokeWidth={1.5} strokeDasharray="4 4" fill="none" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Department efficiency */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-bright rounded-xl p-6"
        >
          <h3 className="text-sm font-semibold text-foreground mb-1">Department Efficiency</h3>
          <p className="text-[11px] text-muted-dark mb-5">Budget utilization by department</p>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={budgets.map((b) => ({ name: b.department, pct: Math.round((b.spent / b.allocated) * 100) }))}
                layout="vertical"
                margin={{ top: 0, right: 0, left: 20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" horizontal={false} />
                <XAxis type="number" tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={(v: number) => `${v}%`} />
                <YAxis type="category" dataKey="name" tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
                <Tooltip contentStyle={{ background: "#151B2E", border: "1px solid #1E293B", borderRadius: 8, fontSize: 12 }} formatter={(value: number) => [`${value}%`, "Utilization"]} />
                <Bar dataKey="pct" radius={[0, 4, 4, 0]}>
                  {budgets.map((b, i) => {
                    const pct = b.spent / b.allocated;
                    return <Cell key={i} fill={pct > 0.9 ? "#EF4444" : pct > 0.75 ? "#F59E0B" : "#10B981"} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* AI performance */}
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
            { label: "Autonomous Payments", value: tractionMetrics.totalAutonomousPayments.toLocaleString(), detail: "Total processed" },
            { label: "Avg Tx Size", value: `$${tractionMetrics.avgTransactionSize.toFixed(4)}`, detail: "Sub-cent target achieved" },
            { label: "Budget Utilization", value: `${tractionMetrics.budgetUtilizationEfficiency}%`, detail: "Allocation efficiency" },
            { label: "Cost / Task", value: `$${tractionMetrics.costPerTaskCompleted.toFixed(4)}`, detail: "Per completed operation" },
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
