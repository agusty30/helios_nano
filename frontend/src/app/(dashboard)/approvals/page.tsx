"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { cn, formatCurrency } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { CheckCircle2, XCircle, Bot, ThumbsUp, ThumbsDown, Eye, Wifi, WifiOff, Loader2 } from "lucide-react";

const recConfig: Record<string, { color: string; bg: string; icon: React.FC<{ size?: number; className?: string }>; label: string }> = {
  approve: { color: "text-success", bg: "bg-success/10", icon: ThumbsUp, label: "Approve" },
  reject: { color: "text-danger", bg: "bg-danger/10", icon: ThumbsDown, label: "Reject" },
  review: { color: "text-warning", bg: "bg-warning/10", icon: Eye, label: "Review" },
};

interface Approval {
  id: string;
  amount: number;
  vendor: string;
  reason: string;
  status: string;
  aiRecommendation: string;
  confidence: number;
  department: string;
  createdAt: string;
  requesterId: string | null;
}

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchApprovals = () => {
    fetch("/api/approvals")
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.approvals) {
          setApprovals(data.approvals);
          setLoaded(true);
        }
      })
      .catch(() => { toast("Failed to load approvals", "error"); });
  };

  useEffect(() => { fetchApprovals(); }, []);

  const handleAction = async (id: string, action: "approved" | "rejected") => {
    setProcessing(id);
    try {
      const res = await fetch(`/api/approvals/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: action }),
      });
      if (res.ok) {
        toast(`Request ${action}`, "success");
        fetchApprovals();
      }
    } catch {
      toast("Action failed, please try again", "error");
    } finally {
      setProcessing(null);
    }
  };

  const pending = approvals.filter(a => a.status === "pending");
  const resolved = approvals.filter(a => a.status !== "pending");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Approvals</h1>
          <p className="text-sm text-muted-dark mt-1">AI-recommended spend approvals with confidence scoring</p>
        </div>
        <div className="flex items-center gap-3">
          {loaded ? (
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-success"><Wifi size={12} /> Live</span>
          ) : (
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-muted-dark"><WifiOff size={12} /> Loading...</span>
          )}
          {pending.length > 0 && (
            <span className="text-[11px] font-medium bg-warning/10 text-warning px-3 py-1.5 rounded-full">{pending.length} Pending</span>
          )}
        </div>
      </div>

      {!loaded && (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
        </div>
      )}

      {pending.length === 0 && loaded && (
        <div className="glass-bright rounded-xl p-12 text-center">
          <CheckCircle2 size={32} className="text-success mx-auto mb-3" />
          <p className="text-[14px] font-medium text-foreground">All caught up!</p>
          <p className="text-[12px] text-muted-dark mt-1">No pending approvals at the moment.</p>
        </div>
      )}

      <div className="space-y-4">
        {pending.map((apr, i) => {
          const rec = recConfig[apr.aiRecommendation] || recConfig.review;
          const RecIcon = rec.icon;
          const isProcessing = processing === apr.id;
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
                    <span className="text-[10px] font-mono text-muted-dark">{apr.id.slice(0, 8)}</span>
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
                  <span className="text-[10px] text-muted-dark block">Submitted</span>
                  <span className="text-[12px] font-medium text-foreground">{new Date(apr.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

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
                        <div className={cn("h-1.5 rounded-full", apr.confidence > 0.7 ? "bg-success" : apr.confidence > 0.5 ? "bg-warning" : "bg-danger")} style={{ width: `${apr.confidence * 100}%` }} />
                      </div>
                      <span className="text-[10px] text-muted-dark font-mono">{(apr.confidence * 100).toFixed(0)}% confidence</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAction(apr.id, "approved")}
                    disabled={isProcessing}
                    className="flex items-center gap-1.5 text-[11px] font-medium px-4 py-2 rounded-lg bg-success/10 text-success hover:bg-success/20 transition-colors disabled:opacity-50"
                  >
                    {isProcessing ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />} Approve
                  </button>
                  <button
                    onClick={() => handleAction(apr.id, "rejected")}
                    disabled={isProcessing}
                    className="flex items-center gap-1.5 text-[11px] font-medium px-4 py-2 rounded-lg bg-danger/10 text-danger hover:bg-danger/20 transition-colors disabled:opacity-50"
                  >
                    {isProcessing ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />} Reject
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {resolved.length > 0 && (
        <>
          <h2 className="text-lg font-semibold text-foreground pt-4">Resolved</h2>
          <div className="space-y-3">
            {resolved.map((apr) => (
              <div key={apr.id} className="glass-bright rounded-xl p-4 opacity-70">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={cn("text-[10px] font-semibold px-2 py-1 rounded-full uppercase",
                      apr.status === "approved" ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
                    )}>{apr.status}</span>
                    <span className="text-[13px] font-medium text-foreground">{apr.vendor}</span>
                    <span className="text-[12px] text-muted">{apr.reason}</span>
                  </div>
                  <span className="text-[13px] font-mono font-semibold text-foreground">{formatCurrency(apr.amount)}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
