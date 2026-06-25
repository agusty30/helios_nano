"use client";

import { motion } from "framer-motion";
import { cn, formatCurrency } from "@/lib/utils";
import { budgets, spendingData } from "@/lib/mock-data";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";

export default function BudgetsPage() {
  const totalAllocated = budgets.reduce((s, b) => s + b.allocated, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
  const totalForecast = budgets.reduce((s, b) => s + b.forecast, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Budgets</h1>
        <p className="text-sm text-muted-dark mt-1">Department budget allocation and spend tracking</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Allocated", value: formatCurrency(totalAllocated), color: "text-primary-light" },
          { label: "Total Spent", value: formatCurrency(totalSpent), color: "text-foreground" },
          { label: "Forecasted", value: formatCurrency(totalForecast), color: "text-warning" },
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

      {/* Chart */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-bright rounded-xl p-6"
      >
        <h3 className="text-sm font-semibold text-foreground mb-5">Budget vs Actual by Department</h3>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={budgets} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis dataKey="department" tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: "#151B2E", border: "1px solid #1E293B", borderRadius: 8, fontSize: 12 }}
                formatter={(value: number) => [formatCurrency(value), undefined]}
              />
              <Bar dataKey="allocated" fill="#4F46E5" radius={[4, 4, 0, 0]} opacity={0.3} />
              <Bar dataKey="spent" radius={[4, 4, 0, 0]}>
                {budgets.map((b, i) => (
                  <Cell key={i} fill={b.spent / b.allocated > 0.9 ? "#EF4444" : b.spent / b.allocated > 0.75 ? "#F59E0B" : "#10B981"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Department list */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {budgets.map((b, i) => {
          const pct = (b.spent / b.allocated) * 100;
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
                <h4 className="text-[14px] font-semibold text-foreground">{b.department}</h4>
                <div className="flex items-center gap-1.5">
                  {b.trend > 0 ? (
                    <TrendingUp size={12} className="text-danger" />
                  ) : (
                    <TrendingDown size={12} className="text-success" />
                  )}
                  <span className={cn("text-[11px] font-semibold font-mono", b.trend > 0 ? "text-danger" : "text-success")}>
                    {b.trend > 0 ? "+" : ""}{b.trend}%
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 mb-3 text-[12px]">
                <div>
                  <span className="text-muted-dark">Spent: </span>
                  <span className="font-semibold text-foreground font-mono">{formatCurrency(b.spent)}</span>
                </div>
                <span className="text-muted-dark">/</span>
                <div>
                  <span className="text-muted-dark">Budget: </span>
                  <span className="font-semibold text-foreground font-mono">{formatCurrency(b.allocated)}</span>
                </div>
              </div>

              <div className="w-full bg-white/5 rounded-full h-2 mb-2">
                <div
                  className={cn(
                    "h-2 rounded-full transition-all",
                    pct > 90 ? "bg-danger" : pct > 75 ? "bg-warning" : "bg-success"
                  )}
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px]">
                <span className="text-muted-dark">{pct.toFixed(1)}% utilized</span>
                {overBudget && (
                  <span className="flex items-center gap-1 text-warning">
                    <AlertTriangle size={10} /> Over forecast
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
