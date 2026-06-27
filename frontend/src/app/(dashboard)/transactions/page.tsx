"use client";

import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { cn, formatCurrency } from "@/lib/utils";
import { api } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { transactions } from "@/lib/mock-data";
import type { TransferResponse, Transaction } from "@/lib/types";
import { Search, Download, ArrowUpDown, Wifi, WifiOff } from "lucide-react";

const statusStyle: Record<string, string> = {
  completed: "bg-success/10 text-success",
  pending: "bg-warning/10 text-warning",
  failed: "bg-danger/10 text-danger",
};

const MOCK_TRANSFERS: TransferResponse = { transfers: [] };

export default function TransactionsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const fetchTransfers = useCallback(() => api.fetchTransfers(50), []);
  const transfers = useApi(fetchTransfers, MOCK_TRANSFERS, 15000);

  const allTx: Transaction[] = useMemo(() => {
    if (!transfers.isLive || transfers.data.transfers.length === 0) return transactions;
    return transfers.data.transfers.map((t, i) => ({
      id: t.id.length > 10 ? t.id.slice(0, 8).toUpperCase() : t.id,
      vendor: `x402 Settlement`,
      amount: parseFloat(t.amount) / 1_000_000,
      status: (t.status === "completed" || t.status === "confirmed" ? "completed" : t.status === "failed" ? "failed" : "pending") as Transaction["status"],
      agent: "Payment Agent",
      category: "x402",
      timestamp: new Date(t.createdAt).toLocaleString(),
    }));
  }, [transfers.data, transfers.isLive]);

  const filtered = allTx.filter((tx) => {
    const matchSearch = tx.vendor.toLowerCase().includes(search.toLowerCase()) ||
      tx.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || tx.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Transactions</h1>
          <p className="text-sm text-muted-dark mt-1">Complete history of autonomous payments and settlements</p>
        </div>
        <div className="flex items-center gap-3">
          {transfers.isLive ? (
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-success"><Wifi size={12} /> Live</span>
          ) : (
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-muted-dark"><WifiOff size={12} /> Demo</span>
          )}
          <button className="flex items-center gap-2 text-[12px] font-medium text-muted hover:text-foreground px-4 py-2 rounded-lg border border-border hover:border-primary/30 transition-all">
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-dark" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search transactions..."
            className="w-full bg-bg border border-border rounded-lg pl-9 pr-4 py-2.5 text-[13px] text-foreground placeholder-muted-dark focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>
        <div className="flex gap-1.5">
          {["all", "completed", "pending", "failed"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "text-[11px] font-medium px-3 py-2 rounded-lg transition-colors capitalize",
                statusFilter === s
                  ? "bg-primary/10 text-primary-light border border-primary/30"
                  : "text-muted hover:text-foreground border border-border hover:border-primary/20"
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-bright rounded-xl overflow-hidden"
      >
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {["ID", "Vendor", "Category", "Agent", "Amount", "Status", "Time"].map((h) => (
                <th key={h} className="text-left px-5 py-3.5 text-[10px] font-semibold uppercase tracking-wider text-muted-dark">
                  <button className="flex items-center gap-1 hover:text-foreground transition-colors">
                    {h} <ArrowUpDown size={10} />
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((tx) => (
              <tr key={tx.id} className="border-b border-border/50 hover:bg-white/[0.02] transition-colors">
                <td className="px-5 py-3.5 text-[12px] font-mono text-muted">{tx.id}</td>
                <td className="px-5 py-3.5 text-[13px] font-medium text-foreground">{tx.vendor}</td>
                <td className="px-5 py-3.5 text-[12px] text-muted">{tx.category}</td>
                <td className="px-5 py-3.5 text-[12px] text-muted">{tx.agent}</td>
                <td className="px-5 py-3.5 text-[13px] font-semibold font-mono text-foreground">{formatCurrency(tx.amount)}</td>
                <td className="px-5 py-3.5">
                  <span className={cn("text-[10px] font-semibold px-2 py-1 rounded-full uppercase", statusStyle[tx.status])}>
                    {tx.status}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-[11px] text-muted-dark">{tx.timestamp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </div>
  );
}
