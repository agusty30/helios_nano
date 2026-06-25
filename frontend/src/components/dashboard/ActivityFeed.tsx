"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ActivityEvent } from "@/lib/types";
import { CheckCircle2, AlertTriangle, Info, Zap } from "lucide-react";

const typeConfig: Record<string, { icon: React.FC<{ size?: number; className?: string }>; color: string }> = {
  success: { icon: CheckCircle2, color: "text-success" },
  warning: { icon: AlertTriangle, color: "text-warning" },
  info: { icon: Info, color: "text-primary-light" },
  action: { icon: Zap, color: "text-[#A78BFA]" },
};

export default function ActivityFeed({ data }: { data: ActivityEvent[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
      className="glass-bright rounded-xl p-6"
    >
      <h3 className="text-sm font-semibold text-foreground mb-1">Agent Activity</h3>
      <p className="text-[11px] text-muted-dark mb-5">Real-time autonomous operations log</p>

      <div className="space-y-0.5">
        {data.map((event) => {
          const cfg = typeConfig[event.type] || typeConfig.info;
          const Icon = cfg.icon;
          return (
            <div key={event.id} className="flex gap-3 py-2.5 px-2 rounded-lg hover:bg-white/[0.02] transition-colors">
              <div className="pt-0.5">
                <Icon size={14} className={cfg.color} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-medium text-foreground">{event.action}</span>
                  <span className="text-[10px] text-muted-dark">{event.agent}</span>
                </div>
                <p className="text-[11px] text-muted mt-0.5 truncate">{event.detail}</p>
              </div>
              <span className="text-[10px] text-muted-dark whitespace-nowrap pt-0.5">{event.timestamp}</span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
