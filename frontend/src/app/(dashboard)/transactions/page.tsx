"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { cn, formatUsdc } from "@/lib/utils";
import { api } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { useToast } from "@/components/ui/Toast";
import { SkeletonTable } from "@/components/ui/Skeleton";
import type { TransferResponse, Transaction } from "@/lib/types";
import { Search, Download, ArrowUpDown, Wifi, WifiOff, ExternalLink, Copy, Check } from "lucide-react";

const statusStyle: Record<string, string> = {
  completed: "bg-success/10 text-success",
  pending: "bg-warning/10 text-warning",
  failed: "bg-danger/10 text-danger",
};

const MOCK_TRANSFERS: TransferResponse = { transfers: [] };
const EXPLORER = "https://testnet.arcscan.app";

interface DbTransaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  reference: string;
  currency: string;
  txHash: string | null;
  metadata: { vendor?: string; department?: string };
  createdAt: string;
  fromWallet: { label: string; address: string } | null;
  toWallet: { label: string; address: string } | null;
  wallet: { label: string; address: string } | null;
}

function TxHashCell({ hash }: { hash: string }) {
  const [copied, setCopied] = useState(false);
  const short = `${hash.slice(0, 6)}...${hash.slice(-4)}`;
  return (
    <div className="flex items-center gap-1">
      <span className="text-[11px] font-mono text-muted">{short}</span>
      <button
        onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(hash); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
        className="p-0.5 rounded hover:bg-white/5"
      >
        {copied ? <Check size={10} className="text-success" /> : <Copy size={10} className="text-muted-dark" />}
      </button>
      <a href={`${EXPLORER}/tx/${hash}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="p-0.5 rounded hover:bg-white/5">
        <ExternalLink size={10} className="text-primary-light" />
      </a>
    </div>
  );
}

export default function TransactionsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dbTransactions, setDbTransactions] = useState<DbTransaction[]>([]);
  const [dbLoaded, setDbLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetch("/api/transactions")
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.transactions) {
          setDbTransactions(data.transactions);
          setDbLoaded(true);
        }
      })
      .catch(() => { toast("Failed to load transactions", "error"); })
      .finally(() => setLoading(false));
  }, []);

  const fetchTransfers = useCallback(() => api.fetchTransfers(50), []);
  const transfers = useApi(fetchTransfers, MOCK_TRANSFERS, 15000);

  const allTx: (Transaction & { fullId?: string; txHash?: string | null; fromAddr?: string; toAddr?: string })[] = useMemo(() => {
    const txs: (Transaction & { fullId?: string; txHash?: string | null; fromAddr?: string; toAddr?: string })[] = [];

    if (transfers.isLive && transfers.data.transfers.length > 0) {
      for (const t of transfers.data.transfers) {
        txs.push({
          id: t.id.slice(0, 8).toUpperCase(),
          fullId: t.id,
          vendor: "x402 Settlement",
          amount: parseFloat(t.amount) / 1_000_000,
          status: (t.status === "completed" || t.status === "confirmed" ? "completed" : t.status === "failed" ? "failed" : "pending") as Transaction["status"],
          agent: "Payment Agent",
          category: "x402",
          timestamp: new Date(t.createdAt).toLocaleString(),
        });
      }
    }

    for (const t of dbTransactions) {
      const meta = t.metadata || {};
      const sender = t.fromWallet || t.wallet;
      txs.push({
        id: t.id.slice(0, 8).toUpperCase(),
        fullId: t.id,
        vendor: meta.vendor || t.reference || t.type,
        amount: t.amount,
        status: (t.status === "COMPLETED" ? "completed" : t.status === "FAILED" ? "failed" : "pending") as Transaction["status"],
        agent: "HeliOS",
        category: meta.department || t.type,
        timestamp: new Date(t.createdAt).toLocaleString(),
        txHash: t.txHash,
        fromAddr: sender ? `${sender.label.slice(0, 8)}` : undefined,
        toAddr: t.toWallet ? `${t.toWallet.label.slice(0, 8)}` : undefined,
      });
    }

    if (txs.length === 0) return [];
    return txs;
  }, [transfers.data, transfers.isLive, dbTransactions]);

  const filtered = allTx.filter((tx) => {
    const matchSearch = tx.vendor.toLowerCase().includes(search.toLowerCase()) ||
      tx.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || tx.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const anyLive = dbLoaded || transfers.isLive;

  if (loading && !dbLoaded) {
    return (
      <div className="space-y-6">
        <div><h1 className="text-2xl font-bold text-foreground">Transactions</h1></div>
        <SkeletonTable rows={8} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Transactions</h1>
          <p className="text-sm text-muted-dark mt-1">Complete history of autonomous payments and settlements</p>
        </div>
        <div className="flex items-center gap-3">
          {anyLive ? (
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-success"><Wifi size={12} /> Live</span>
          ) : (
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-muted-dark"><WifiOff size={12} /> Loading...</span>
          )}
          <button className="flex items-center gap-2 text-[12px] font-medium text-muted hover:text-foreground px-4 py-2 rounded-lg border border-border hover:border-primary/30 transition-all">
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center gap-4"
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
        className="glass-bright rounded-xl overflow-x-auto"
      >
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="border-b border-border">
              {["ID", "Vendor", "Category", "Agent", "Tx Hash", "Amount", "Status", "Time"].map((h) => (
                <th key={h} className="text-left px-5 py-3.5 text-[10px] font-semibold uppercase tracking-wider text-muted-dark">
                  <button className="flex items-center gap-1 hover:text-foreground transition-colors">
                    {h} <ArrowUpDown size={10} />
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={8} className="px-5 py-12 text-center text-[13px] text-muted-dark">No transactions found</td></tr>
            ) : filtered.map((tx) => (
              <tr
                key={tx.fullId || tx.id}
                onClick={() => tx.fullId && router.push(`/transactions/${tx.fullId}`)}
                className="border-b border-border/50 hover:bg-white/[0.02] transition-colors cursor-pointer"
              >
                <td className="px-5 py-3.5 text-[12px] font-mono text-muted">{tx.id}</td>
                <td className="px-5 py-3.5 text-[13px] font-medium text-foreground">{tx.vendor}</td>
                <td className="px-5 py-3.5 text-[12px] text-muted">{tx.category}</td>
                <td className="px-5 py-3.5 text-[12px] text-muted">{tx.agent}</td>
                <td className="px-5 py-3.5">
                  {tx.txHash ? <TxHashCell hash={tx.txHash} /> : <span className="text-[11px] text-muted-dark">—</span>}
                </td>
                <td className="px-5 py-3.5 text-[13px] font-semibold font-mono text-foreground">{formatUsdc(tx.amount, 4)}</td>
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
