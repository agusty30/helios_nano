"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  FileText, Download, Calendar, PieChart, TrendingUp, Shield,
  BarChart3, Clock, CheckCircle2, Loader2, Wifi, WifiOff, Plus,
} from "lucide-react";

const typeIcons: Record<string, React.FC<{ size?: number; className?: string }>> = {
  "monthly-spend": PieChart,
  "savings-analysis": TrendingUp,
  "compliance-audit": Shield,
  "budget-variance": BarChart3,
  "vendor-performance": FileText,
  "executive-summary": BarChart3,
};

interface Report {
  id: string;
  type: string;
  name: string;
  status: string;
  data: Record<string, unknown>;
  createdAt: string;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [generating, setGenerating] = useState(false);

  const fetchReports = () => {
    fetch("/api/reports")
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.reports) {
          setReports(data.reports);
          setLoaded(true);
        }
      })
      .catch(() => {});
  };

  useEffect(() => { fetchReports(); }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "executive-summary",
          name: `Executive Summary — ${new Date().toLocaleDateString()}`,
        }),
      });
      if (res.ok) {
        fetchReports();
      }
    } catch {
      // silently fail
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports</h1>
          <p className="text-sm text-muted-dark mt-1">AI-generated financial reports and compliance documentation</p>
        </div>
        <div className="flex items-center gap-3">
          {loaded ? (
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-success"><Wifi size={12} /> Live</span>
          ) : (
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-muted-dark"><WifiOff size={12} /> Loading...</span>
          )}
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-2 text-[12px] font-medium px-4 py-2.5 rounded-lg bg-primary text-white hover:bg-primary/80 transition-colors disabled:opacity-50"
          >
            {generating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Generate Report
          </button>
        </div>
      </div>

      {reports.length === 0 && loaded && (
        <div className="glass-bright rounded-xl p-12 text-center">
          <FileText size={32} className="text-muted-dark mx-auto mb-3" />
          <p className="text-[14px] font-medium text-foreground">No reports yet</p>
          <p className="text-[12px] text-muted-dark mt-1">Click &quot;Generate Report&quot; to create your first executive summary.</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {reports.map((report, i) => {
          const Icon = typeIcons[report.type] || FileText;
          const isGenerating = report.status === "generating";
          const reportData = report.data as { summary?: { totalTransactions?: number; totalSpend?: number; activeAgents?: number } };
          return (
            <motion.div
              key={report.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-bright rounded-xl p-6 hover:border-primary/20 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-primary/10 shrink-0">
                  <Icon size={20} className="text-primary-light" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-[14px] font-semibold text-foreground truncate">{report.name}</h3>
                    {isGenerating ? (
                      <span className="flex items-center gap-1 text-[9px] font-semibold text-primary-light bg-primary/10 px-2 py-0.5 rounded-full uppercase shrink-0">
                        <Loader2 size={9} className="animate-spin" /> Generating
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[9px] font-semibold text-success bg-success/10 px-2 py-0.5 rounded-full uppercase shrink-0">
                        <CheckCircle2 size={9} /> Ready
                      </span>
                    )}
                  </div>
                  {reportData?.summary && (
                    <p className="text-[12px] text-muted mb-3">
                      {reportData.summary.totalTransactions} transactions | ${(reportData.summary.totalSpend || 0).toFixed(2)} total spend | {reportData.summary.activeAgents} agents
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-[10px] text-muted-dark">
                    <span className="flex items-center gap-1"><Calendar size={10} /> {report.type}</span>
                    <span className="flex items-center gap-1"><Clock size={10} /> {new Date(report.createdAt).toLocaleString()}</span>
                  </div>
                </div>
                <button
                  disabled={isGenerating}
                  className={cn(
                    "flex items-center gap-1.5 text-[11px] font-medium px-3 py-2 rounded-lg transition-colors shrink-0",
                    isGenerating
                      ? "text-muted-dark border border-border cursor-not-allowed"
                      : "text-foreground border border-border hover:border-primary/30 hover:text-primary-light"
                  )}
                >
                  <Download size={12} /> Download
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
