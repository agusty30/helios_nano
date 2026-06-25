"use client";

import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { CostBreakdown } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

export default function CostBreakdownChart({ data }: { data: CostBreakdown[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.4 }}
      className="glass-bright rounded-xl p-6"
    >
      <h3 className="text-sm font-semibold text-foreground mb-1">Cost Breakdown</h3>
      <p className="text-[11px] text-muted-dark mb-5">Current month allocation by category</p>

      <div className="flex gap-6">
        <div className="h-[200px] w-[200px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                dataKey="amount"
                stroke="none"
              >
                {data.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "#151B2E",
                  border: "1px solid #1E293B",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(value: number) => [formatCurrency(value), undefined]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1 space-y-2.5 py-2">
          {data.map((d) => (
            <div key={d.category} className="flex items-center gap-3 text-[12px]">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
              <span className="text-muted flex-1 truncate">{d.category}</span>
              <span className="text-foreground font-medium font-mono">{d.percentage}%</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
