"use client";

import { motion } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import type { SpendingData } from "@/lib/types";

export default function SpendingChart({ data }: { data: SpendingData[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.4 }}
      className="glass-bright rounded-xl p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Spend vs Budget</h3>
          <p className="text-[11px] text-muted-dark mt-0.5">Monthly trend with AI-optimized projections</p>
        </div>
        <div className="flex gap-4 text-[10px] font-medium">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-primary" />Actual</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-muted-dark" />Budget</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-success" />Optimized</span>
        </div>
      </div>
      <div className="h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="gActual" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gOptimized" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
            <XAxis dataKey="month" tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k USDC` : `${v.toFixed(1)} USDC`} />
            <Tooltip
              contentStyle={{
                background: "#151B2E",
                border: "1px solid #1E293B",
                borderRadius: 8,
                fontSize: 12,
              }}
              labelStyle={{ color: "#94A3B8" }}
              formatter={(value: number) => [`${value.toFixed(4)} USDC`, undefined]}
            />
            <Area type="monotone" dataKey="budget" stroke="#475569" strokeWidth={1.5} strokeDasharray="4 4" fill="none" />
            <Area type="monotone" dataKey="actual" stroke="#4F46E5" strokeWidth={2} fill="url(#gActual)" />
            <Area type="monotone" dataKey="optimized" stroke="#10B981" strokeWidth={1.5} strokeDasharray="6 3" fill="url(#gOptimized)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
