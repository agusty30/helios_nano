"use client";

import { motion } from "framer-motion";
import { cn, formatCurrency } from "@/lib/utils";
import { agents } from "@/lib/mock-data";
import {
  CreditCard, ShoppingCart, Landmark, Wallet, Bot,
  Activity, CheckCircle2, TrendingUp, Zap,
} from "lucide-react";

const iconMap: Record<string, React.FC<{ size?: number; className?: string }>> = {
  CreditCard, ShoppingCart, Landmark, Wallet,
};

export default function AgentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">AI Agents</h1>
        <p className="text-sm text-muted-dark mt-1">Monitor and manage your autonomous financial agents</p>
      </div>

      {/* Agent summary */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Agents", value: "4", icon: Bot, color: "text-primary-light" },
          { label: "Active Now", value: "4/4", icon: Activity, color: "text-success" },
          { label: "Avg Success Rate", value: "97.9%", icon: CheckCircle2, color: "text-success" },
          { label: "Total Savings", value: "$64,100", icon: TrendingUp, color: "text-primary-light" },
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

      {/* Agent cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {agents.map((agent, i) => {
          const Icon = iconMap[agent.icon] || Bot;
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
                      <div className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-success" />
                      </div>
                      <span className="text-[10px] text-success font-medium uppercase tracking-wider">Active</span>
                    </div>
                  </div>
                </div>
                <span className="text-[10px] text-muted-dark">{agent.lastActivity}</span>
              </div>

              <div className="mb-4 p-3 rounded-lg bg-white/[0.02] border border-border">
                <div className="flex items-center gap-2 mb-1">
                  <Zap size={12} className="text-primary-light" />
                  <span className="text-[11px] text-muted-dark">Current Task</span>
                </div>
                <p className="text-[13px] text-foreground">{agent.currentTask}</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <span className="text-[10px] text-muted-dark block mb-0.5">Success Rate</span>
                  <span className="text-sm font-semibold text-foreground">{agent.successRate}%</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-dark block mb-0.5">Transactions</span>
                  <span className="text-sm font-semibold text-foreground">{agent.transactionsExecuted.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-dark block mb-0.5">Savings</span>
                  <span className="text-sm font-semibold text-success">{formatCurrency(agent.savings)}</span>
                </div>
              </div>

              <div className="mt-4 w-full bg-white/5 rounded-full h-1.5">
                <div
                  className="bg-gradient-to-r from-primary to-primary-light h-1.5 rounded-full transition-all"
                  style={{ width: `${agent.successRate}%` }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
