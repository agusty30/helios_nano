"use client";

import { motion } from "framer-motion";
import { cn, formatCurrency } from "@/lib/utils";
import type { Transaction } from "@/lib/types";
import { ArrowUpRight, ArrowDownRight, Clock } from "lucide-react";

const statusStyle: Record<string, string> = {
  completed: "bg-success/10 text-success",
  pending: "bg-warning/10 text-warning",
  failed: "bg-danger/10 text-danger",
};

export default function RecentTransactions({ data }: { data: Transaction[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25, duration: 0.4 }}
      className="glass-bright rounded-xl p-6"
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Recent Transactions</h3>
          <p className="text-[11px] text-muted-dark mt-0.5">Last 24 hours of autonomous payments</p>
        </div>
        <span className="text-[11px] text-primary-light font-medium cursor-pointer hover:underline">View All</span>
      </div>

      <div className="space-y-1">
        {data.slice(0, 6).map((tx) => (
          <div key={tx.id} className="flex items-center gap-3 py-2.5 px-2 rounded-lg hover:bg-white/[0.02] transition-colors">
            <div className={cn("p-1.5 rounded-lg", tx.status === "failed" ? "bg-danger/10" : "bg-primary/10")}>
              {tx.status === "failed" ? (
                <ArrowDownRight size={14} className="text-danger" />
              ) : (
                <ArrowUpRight size={14} className="text-primary-light" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-medium text-foreground">{tx.vendor}</span>
                <span className={cn("text-[9px] font-semibold px-1.5 py-0.5 rounded-full uppercase", statusStyle[tx.status])}>
                  {tx.status}
                </span>
              </div>
              <span className="text-[11px] text-muted-dark">{tx.agent} · {tx.category}</span>
            </div>
            <div className="text-right">
              <span className="text-[13px] font-semibold font-mono text-foreground">{formatCurrency(tx.amount)}</span>
              <span className="block text-[10px] text-muted-dark">{tx.timestamp}</span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
