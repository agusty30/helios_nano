"use client";

import { motion } from "framer-motion";
import type { TractionMetrics } from "@/lib/types";
import { Zap, CreditCard, Target, Cpu } from "lucide-react";

const metrics = [
  { key: "totalAutonomousPayments" as const, label: "Total Autonomous Payments", icon: CreditCard, fmt: (v: number) => v.toLocaleString() },
  { key: "avgTransactionSize" as const, label: "Avg Transaction Size", icon: Zap, fmt: (v: number) => `$${v.toFixed(4)}` },
  { key: "budgetUtilizationEfficiency" as const, label: "Budget Utilization", icon: Target, fmt: (v: number) => `${v}%` },
  { key: "costPerTaskCompleted" as const, label: "Cost / Task", icon: Cpu, fmt: (v: number) => `$${v.toFixed(4)}` },
];

export default function TractionBanner({ data }: { data: TractionMetrics }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05, duration: 0.35 }}
      className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary/20 via-primary/10 to-transparent border border-primary/20 p-5"
    >
      <div className="absolute -right-16 -top-16 w-48 h-48 bg-primary/5 rounded-full blur-3xl" />
      <div className="flex items-center justify-between relative">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.key} className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Icon size={16} className="text-primary-light" />
              </div>
              <div>
                <span className="text-lg font-bold text-foreground">{m.fmt(data[m.key])}</span>
                <span className="block text-[10px] text-muted-dark">{m.label}</span>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
