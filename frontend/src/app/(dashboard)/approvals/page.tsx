"use client";

import { motion } from "framer-motion";
import { cn, formatCurrency } from "@/lib/utils";
import { approvals } from "@/lib/mock-data";
import { CheckCircle2, XCircle, AlertCircle, Bot, ThumbsUp, ThumbsDown, Eye } from "lucide-react";

const recConfig: Record<string, { color: string; bg: string; icon: React.FC<{ size?: number; className?: string }>; label: string }> = {
  approve: { color: "text-success", bg: "bg-success/10", icon: ThumbsUp, label: "Approve" },
  reject: { color: "text-danger", bg: "bg-danger/10", icon: ThumbsDown, label: "Reject" },
  review: { color: "text-warning", bg: "bg-warning/10", icon: Eye, label: "Review" },
};

export default function ApprovalsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Approvals</h1>
          <p className="text-sm text-muted-dark mt-1">AI-recommended spend approvals with confidence scoring</p>
        </div>
        <div className="flex gap-2">
          <span className="text-[11px] font-medium text-foreground bg-warning/10 text-warning px-3 py-1.5 rounded-full">{approvals.length} Pending</span>
        </div>
      </div>

      <div className="space-y-4">
        {approvals.map((apr, i) => {
          const rec = recConfig[apr.aiRecommendation];
          const RecIcon = rec.icon;
          return (
            <motion.div
              key={apr.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-bright rounded-xl p-6 hover:border-primary/20 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-[15px] font-semibold text-foreground">{apr.vendor}</span>
                    <span className="text-[10px] font-mono text-muted-dark">{apr.id}</span>
                  </div>
                  <p className="text-[13px] text-muted">{apr.reason}</p>
                </div>
                <span className="text-xl font-bold font-mono text-foreground">{formatCurrency(apr.amount)}</span>
              </div>

              <div className="flex items-center gap-6 mb-4">
                <div>
                  <span className="text-[10px] text-muted-dark block">Department</span>
                  <span className="text-[12px] font-medium text-foreground">{apr.department}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-dark block">Requester</span>
                  <span className="text-[12px] font-medium text-foreground">{apr.requester}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-dark block">Submitted</span>
                  <span className="text-[12px] font-medium text-foreground">{apr.timestamp}</span>
                </div>
              </div>

              {/* AI Recommendation */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-border">
                <div className="flex items-center gap-3">
                  <div className={cn("p-1.5 rounded-lg", rec.bg)}>
                    <Bot size={14} className={rec.color} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-medium text-foreground">AI Recommendation:</span>
                      <span className={cn("text-[11px] font-semibold uppercase", rec.color)}>{rec.label}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="w-20 bg-white/5 rounded-full h-1.5">
                        <div className={cn("h-1.5 rounded-full", rec.bg.replace("/10", ""))} style={{ width: `${apr.confidence}%` }} />
                      </div>
                      <span className="text-[10px] text-muted-dark font-mono">{apr.confidence}% confidence</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="flex items-center gap-1.5 text-[11px] font-medium px-4 py-2 rounded-lg bg-success/10 text-success hover:bg-success/20 transition-colors">
                    <CheckCircle2 size={12} /> Approve
                  </button>
                  <button className="flex items-center gap-1.5 text-[11px] font-medium px-4 py-2 rounded-lg bg-danger/10 text-danger hover:bg-danger/20 transition-colors">
                    <XCircle size={12} /> Reject
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
