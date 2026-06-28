"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  Wallet, Plus, Copy, ExternalLink, Loader2, Shield, Bot, X,
} from "lucide-react";

interface WalletRecord {
  id: string;
  label: string;
  address: string;
  type: string;
  chain: string;
  network: string;
  createdAt: string;
}

interface WalletBalance {
  balance: number;
  loading: boolean;
}

export default function WalletsPage() {
  const [wallets, setWallets] = useState<WalletRecord[]>([]);
  const [balances, setBalances] = useState<Record<string, WalletBalance>>({});
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ label: "", address: "", type: "AGENT" });
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/wallets")
      .then((r) => (r.ok ? r.json() : { wallets: [] }))
      .then((data) => {
        const wList = data.wallets || [];
        setWallets(wList);
        for (const w of wList) {
          setBalances((prev) => ({ ...prev, [w.id]: { balance: 0, loading: true } }));
          fetch(`/api/wallets/${w.id}/balance`)
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => {
              if (d) setBalances((prev) => ({ ...prev, [w.id]: { balance: d.balance, loading: false } }));
            })
            .catch(() => setBalances((prev) => ({ ...prev, [w.id]: { balance: 0, loading: false } })));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/wallets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.wallet) {
        setWallets((prev) => [data.wallet, ...prev]);
        setShowCreate(false);
        setForm({ label: "", address: "", type: "AGENT" });
      }
    } catch {}
    setCreating(false);
  };

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopied(address);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Wallets</h1>
          <p className="text-sm text-muted-dark mt-1">Manage treasury and agent wallets</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-[13px] font-medium rounded-lg hover:bg-primary/80 transition-colors"
        >
          <Plus size={14} /> Add Wallet
        </button>
      </div>

      {/* Create wallet form */}
      {showCreate && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-bright rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Add New Wallet</h3>
            <button onClick={() => setShowCreate(false)} className="text-muted-dark hover:text-foreground">
              <X size={16} />
            </button>
          </div>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-[11px] text-muted-dark mb-1 block">Label</label>
              <input
                type="text"
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                required
                className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-[13px] text-foreground focus:outline-none focus:border-primary/50 transition-all"
                placeholder="Main Treasury"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-[11px] text-muted-dark mb-1 block">Address</label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                required
                className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-[13px] text-foreground font-mono focus:outline-none focus:border-primary/50 transition-all"
                placeholder="0x..."
              />
            </div>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className="text-[11px] text-muted-dark mb-1 block">Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-[13px] text-foreground focus:outline-none focus:border-primary/50 transition-all"
                >
                  <option value="AGENT">Agent</option>
                  <option value="TREASURY">Treasury</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={creating}
                className="px-4 py-2 bg-primary text-white text-[13px] font-medium rounded-lg hover:bg-primary/80 transition-colors disabled:opacity-50"
              >
                {creating ? <Loader2 size={14} className="animate-spin" /> : "Add"}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Portfolio summary */}
      {wallets.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-bright rounded-xl p-5"
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <span className="text-[10px] text-muted-dark uppercase tracking-wide">Total Wallets</span>
              <p className="text-lg font-bold text-foreground">{wallets.length}</p>
            </div>
            <div>
              <span className="text-[10px] text-muted-dark uppercase tracking-wide">Treasury</span>
              <p className="text-lg font-bold text-primary-light">{wallets.filter(w => w.type === "TREASURY").length}</p>
            </div>
            <div>
              <span className="text-[10px] text-muted-dark uppercase tracking-wide">Agent</span>
              <p className="text-lg font-bold text-success">{wallets.filter(w => w.type === "AGENT").length}</p>
            </div>
            <div>
              <span className="text-[10px] text-muted-dark uppercase tracking-wide">Portfolio Value</span>
              <p className="text-lg font-bold text-foreground">
                ${Object.values(balances).reduce((sum, b) => sum + b.balance, 0).toFixed(4)} USDC
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Wallet list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="text-primary-light animate-spin" />
        </div>
      ) : wallets.length === 0 ? (
        <div className="glass-bright rounded-xl">
          <EmptyState
            icon={Wallet}
            title="No wallets yet"
            description="Add your first wallet to start managing your treasury and agent funds."
            action={{ label: "Add Wallet", onClick: () => setShowCreate(true) }}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {wallets.map((wallet, i) => (
            <motion.div
              key={wallet.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-bright rounded-xl p-5 hover:border-primary/20 transition-colors"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center",
                  wallet.type === "TREASURY" ? "bg-primary/10" : "bg-success/10"
                )}>
                  {wallet.type === "TREASURY" ? (
                    <Shield size={18} className="text-primary-light" />
                  ) : (
                    <Bot size={18} className="text-success" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="text-[14px] font-semibold text-foreground">{wallet.label}</h4>
                  <span className={cn(
                    "text-[10px] font-semibold uppercase tracking-wider",
                    wallet.type === "TREASURY" ? "text-primary-light" : "text-success"
                  )}>
                    {wallet.type}
                  </span>
                </div>
                <div className="text-right">
                  {balances[wallet.id]?.loading ? (
                    <Loader2 size={14} className="text-muted-dark animate-spin" />
                  ) : (
                    <span className="text-sm font-bold text-foreground">
                      ${(balances[wallet.id]?.balance || 0).toFixed(4)}
                    </span>
                  )}
                  <span className="text-[9px] text-muted-dark block">USDC</span>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <span className="text-[11px] font-mono text-muted-dark flex-1 truncate">{wallet.address}</span>
                <button
                  onClick={() => copyAddress(wallet.address)}
                  className={cn(
                    "p-1.5 rounded-md transition-colors",
                    copied === wallet.address ? "text-success bg-success/10" : "text-muted-dark hover:text-foreground hover:bg-white/[0.04]"
                  )}
                >
                  <Copy size={12} />
                </button>
                <a
                  href={`https://testnet.arcscan.app/address/${wallet.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-md text-muted-dark hover:text-foreground hover:bg-white/[0.04] transition-colors"
                >
                  <ExternalLink size={12} />
                </a>
              </div>

              <div className="flex items-center gap-3 text-[10px] text-muted-dark">
                <span>{wallet.chain}</span>
                <span>·</span>
                <span>{new Date(wallet.createdAt).toLocaleDateString()}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
