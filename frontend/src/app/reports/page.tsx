"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  FileText, Download, Calendar, PieChart, TrendingUp, Shield,
  BarChart3, Clock, CheckCircle2, Loader2,
} from "lucide-react";

const reports = [
  { id: "monthly-spend", name: "Monthly Spend Report", description: "Comprehensive breakdown of all expenditures by department, category, and vendor", icon: PieChart, frequency: "Monthly", lastGenerated: "Jun 1, 2026", status: "ready" },
  { id: "savings-analysis", name: "AI Savings Analysis", description: "Detailed ROI analysis of AI agent optimizations and cost reductions", icon: TrendingUp, frequency: "Weekly", lastGenerated: "Jun 23, 2026", status: "ready" },
  { id: "compliance-audit", name: "Compliance Audit Trail", description: "Complete audit log of all autonomous transactions with policy compliance verification", icon: Shield, frequency: "Monthly", lastGenerated: "Jun 1, 2026", status: "ready" },
  { id: "budget-variance", name: "Budget Variance Report", description: "Actual vs budget analysis with AI-generated insights and forecasting", icon: BarChart3, frequency: "Monthly", lastGenerated: "Jun 1, 2026", status: "ready" },
  { id: "vendor-performance", name: "Vendor Performance", description: "Vendor spend analysis, contract utilization, and renegotiation opportunities", icon: FileText, frequency: "Quarterly", lastGenerated: "Apr 1, 2026", status: "ready" },
  { id: "executive-summary", name: "Executive Summary", description: "Board-ready financial overview with key metrics, trends, and strategic recommendations", icon: BarChart3, frequency: "Monthly", lastGenerated: "Jun 1, 2026", status: "generating" },
];

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports</h1>
          <p className="text-sm text-muted-dark mt-1">AI-generated financial reports and compliance documentation</p>
        </div>
        <button className="flex items-center gap-2 text-[12px] font-medium px-4 py-2.5 rounded-lg bg-primary text-white hover:bg-primary/80 transition-colors">
          <FileText size={14} /> Generate Report
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {reports.map((report, i) => {
          const Icon = report.icon;
          const generating = report.status === "generating";
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
                    <h3 className="text-[14px] font-semibold text-foreground">{report.name}</h3>
                    {generating ? (
                      <span className="flex items-center gap-1 text-[9px] font-semibold text-primary-light bg-primary/10 px-2 py-0.5 rounded-full uppercase">
                        <Loader2 size={9} className="animate-spin" /> Generating
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[9px] font-semibold text-success bg-success/10 px-2 py-0.5 rounded-full uppercase">
                        <CheckCircle2 size={9} /> Ready
                      </span>
                    )}
                  </div>
                  <p className="text-[12px] text-muted mb-3">{report.description}</p>
                  <div className="flex items-center gap-4 text-[10px] text-muted-dark">
                    <span className="flex items-center gap-1"><Calendar size={10} /> {report.frequency}</span>
                    <span className="flex items-center gap-1"><Clock size={10} /> {report.lastGenerated}</span>
                  </div>
                </div>
                <button
                  disabled={generating}
                  className={cn(
                    "flex items-center gap-1.5 text-[11px] font-medium px-3 py-2 rounded-lg transition-colors shrink-0",
                    generating
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
