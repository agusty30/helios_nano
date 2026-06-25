"use client";

import { motion } from "framer-motion";
import { cn, formatCompact } from "@/lib/utils";
import {
  DollarSign, Target, Bot, PiggyBank, Clock, Activity,
} from "lucide-react";

const iconMap: Record<string, React.FC<{ size?: number; className?: string }>> = {
  DollarSign, Target, Bot, PiggyBank, Clock, Activity,
};

interface KpiItem {
  label: string;
  value: string;
  change: number;
  icon: string;
}

export default function KpiCards({ data }: { data: KpiItem[] }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {data.map((kpi, i) => {
        const Icon = iconMap[kpi.icon] || Activity;
        const positive = kpi.change >= 0;
        return (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.35 }}
            className="glass-bright rounded-xl p-4 group hover:border-primary/30 transition-colors"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Icon size={16} className="text-primary-light" />
              </div>
              <span
                className={cn(
                  "text-[11px] font-semibold font-mono",
                  positive ? "text-success" : "text-danger"
                )}
              >
                {positive ? "+" : ""}
                {kpi.change}%
              </span>
            </div>
            <span className="text-xl font-bold text-foreground">{kpi.value}</span>
            <span className="block text-[11px] text-muted-dark mt-0.5">{kpi.label}</span>
          </motion.div>
        );
      })}
    </div>
  );
}
