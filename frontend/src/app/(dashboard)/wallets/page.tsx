"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  Wallet, Plus, Copy, ExternalLink, Loader2, Shield, Bot, X,
  ArrowRightLeft, ArrowDownToLine, ArrowUpFromLine, History,
  AlertTriangle, CheckCircle2, Key, Import, Trash2, Pencil, RefreshCw,
} from "lucide-react";

interface WalletRecord {
  id: string;
  label: string;
  address: string;
  type: string;
  chain: string;
  network: string;
  status: string;
  isDefault: boolean;
  deletedAt: string | null;
  createdAt: string;
}

interface WalletBalance {
  balance: number;
  loading: boolean;
}

interface WalletTx {
  id: string;
  type: string;
  amount: number;
  status: string;
  reference: string | null;
  txHash: string | null;
  fromWalletId: string | null;
  toWalletId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

type ModalType = "create" | "import" | "deposit" | "transfer" | "transactions" | "delete" | null;

export default function WalletsPage() {
  const [wallets, setWallets] = useState<WalletRecord[]>([]);
  const [balances, setBalances] = useState<Record<string, WalletBalance>>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [modal, setModal] = useState<ModalType>(null);
  const [selectedWallet, setSelectedWallet] = useState<WalletRecord | null>(null);

  // Create wallet state
  const [createForm, setCreateForm] = useState({ label: "", type: "TREASURY" });
  const [creating, setCreating] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [keyCopied, setKeyCopied] = useState(false);

  // Import wallet state
  const [importForm, setImportForm] = useState({ label: "", privateKey: "", type: "AGENT" });
  const [importing, setImporting] = useState(false);
  const [derivedAddress, setDerivedAddress] = useState<string | null>(null);

  // Rename state
  const [editingLabel, setEditingLabel] = useState<string | null>(null);
  const [editLabelValue, setEditLabelValue] = useState("");
  const [renaming, setRenaming] = useState(false);

  // Delete state
  const [deleting, setDeleting] = useState(false);

  // Transfer state
  const [transferForm, setTransferForm] = useState({ toWalletId: "", amount: "", note: "" });
  const [transferring, setTransferring] = useState(false);
  const [transferResult, setTransferResult] = useState<{ txHash: string; explorerUrl: string } | null>(null);

  // Transactions state
  const [transactions, setTransactions] = useState<WalletTx[]>([]);
  const [txLoading, setTxLoading] = useState(false);

  const fetchBalance = useCallback((walletId: string) => {
    setBalances((prev) => ({ ...prev, [walletId]: { balance: prev[walletId]?.balance || 0, loading: true } }));
    fetch(`/api/wallets/${walletId}/balance`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) setBalances((prev) => ({ ...prev, [walletId]: { balance: d.balance, loading: false } }));
        else setBalances((prev) => ({ ...prev, [walletId]: { balance: 0, loading: false } }));
      })
      .catch(() => setBalances((prev) => ({ ...prev, [walletId]: { balance: 0, loading: false } })));
  }, []);

  useEffect(() => {
    fetch("/api/wallets")
      .then((r) => (r.ok ? r.json() : { wallets: [] }))
      .then((data) => {
        const wList = data.wallets || [];
        setWallets(wList);
        for (const w of wList) fetchBalance(w.id);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [fetchBalance]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/wallets/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });
      const data = await res.json();
      if (data.wallet) {
        setWallets((prev) => [data.wallet, ...prev]);
        setGeneratedKey(data.privateKey);
        fetchBalance(data.wallet.id);
      }
    } catch {}
    setCreating(false);
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setImporting(true);
    try {
      const res = await fetch("/api/wallets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: importForm.label, privateKey: importForm.privateKey, type: importForm.type }),
      });
      const data = await res.json();
      if (data.wallet) {
        setWallets((prev) => [data.wallet, ...prev]);
        setModal(null);
        setImportForm({ label: "", privateKey: "", type: "AGENT" });
        setDerivedAddress(null);
        fetchBalance(data.wallet.id);
        toast("Wallet imported successfully", "success");
      } else {
        toast(data.error || "Import failed", "error");
      }
    } catch {
      toast("Failed to import wallet", "error");
    }
    setImporting(false);
  };

  const handleRename = async (walletId: string) => {
    if (!editLabelValue.trim()) return;
    setRenaming(true);
    try {
      const res = await fetch(`/api/wallets/${walletId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: editLabelValue }),
      });
      const data = await res.json();
      if (data.wallet) {
        setWallets((prev) => prev.map((w) => (w.id === walletId ? { ...w, label: data.wallet.label } : w)));
        toast("Wallet renamed", "success");
      }
    } catch {
      toast("Failed to rename wallet", "error");
    }
    setEditingLabel(null);
    setRenaming(false);
  };

  const handleDelete = async () => {
    if (!selectedWallet) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/wallets/${selectedWallet.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setWallets((prev) => prev.filter((w) => w.id !== selectedWallet.id));
        toast("Wallet deleted", "success");
        closeModal();
      } else {
        toast(data.error || "Delete failed", "error");
      }
    } catch {
      toast("Failed to delete wallet", "error");
    }
    setDeleting(false);
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWallet) return;
    setTransferring(true);
    try {
      const res = await fetch(`/api/wallets/${selectedWallet.id}/transfer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toWalletId: transferForm.toWalletId,
          amount: parseFloat(transferForm.amount),
          note: transferForm.note || undefined,
        }),
      });
      const data = await res.json();
      if (data.transaction) {
        setTransferResult({ txHash: data.transaction.txHash, explorerUrl: data.explorerUrl });
        fetchBalance(selectedWallet.id);
        fetchBalance(transferForm.toWalletId);
      }
    } catch {}
    setTransferring(false);
  };

  const loadTransactions = async (wallet: WalletRecord) => {
    setSelectedWallet(wallet);
    setModal("transactions");
    setTxLoading(true);
    try {
      const res = await fetch(`/api/wallets/${wallet.id}/transactions?limit=50`);
      const data = await res.json();
      setTransactions(data.transactions || []);
    } catch {
      setTransactions([]);
    }
    setTxLoading(false);
  };

  const openTransfer = (wallet: WalletRecord) => {
    setSelectedWallet(wallet);
    setTransferForm({ toWalletId: "", amount: "", note: "" });
    setTransferResult(null);
    setModal("transfer");
  };

  const openDeposit = (wallet: WalletRecord) => {
    setSelectedWallet(wallet);
    setModal("deposit");
  };

  const copyText = (text: string, label = "Copied to clipboard") => {
    navigator.clipboard.writeText(text);
    toast(label, "success");
  };

  const closeModal = () => {
    setModal(null);
    setSelectedWallet(null);
    setGeneratedKey(null);
    setKeyCopied(false);
    setTransferResult(null);
    setCreateForm({ label: "", type: "TREASURY" });
    setDerivedAddress(null);
  };

  const totalBalance = Object.values(balances).reduce((sum, b) => sum + b.balance, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Wallets</h1>
          <p className="text-sm text-muted-dark mt-1">Manage treasury and agent wallets on Arc Testnet</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setGeneratedKey(null); setCreateForm({ label: "", type: "TREASURY" }); setModal("create"); }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-[13px] font-medium rounded-lg hover:bg-primary/80 transition-colors"
          >
            <Plus size={14} /> Create Wallet
          </button>
          <button
            onClick={() => { setImportForm({ label: "", privateKey: "", type: "AGENT" }); setDerivedAddress(null); setModal("import"); }}
            className="flex items-center gap-2 px-4 py-2 bg-white/[0.04] border border-border text-[13px] font-medium text-muted rounded-lg hover:text-foreground hover:border-primary/30 transition-colors"
          >
            <Import size={14} /> Import
          </button>
        </div>
      </div>

      {/* Portfolio summary */}
      {wallets.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-bright rounded-xl p-5">
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
              <p className="text-lg font-bold text-foreground">{totalBalance.toFixed(4)} USDC</p>
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
            description="Create your first treasury or agent wallet to get started."
            action={{ label: "Create Wallet", onClick: () => setModal("create") }}
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
              className="group glass-bright rounded-xl p-5 hover:border-primary/20 transition-colors"
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
                <div className="flex-1 min-w-0">
                  {editingLabel === wallet.id ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={editLabelValue}
                        onChange={(e) => setEditLabelValue(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") handleRename(wallet.id); if (e.key === "Escape") setEditingLabel(null); }}
                        autoFocus
                        className="bg-white/[0.03] border border-primary/50 rounded px-2 py-0.5 text-[14px] text-foreground w-full focus:outline-none"
                      />
                      <button
                        onClick={() => handleRename(wallet.id)}
                        disabled={renaming}
                        className="text-success hover:text-success/80 p-1"
                      >
                        <CheckCircle2 size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-[14px] font-semibold text-foreground truncate">{wallet.label}</h4>
                      <button
                        onClick={() => { setEditingLabel(wallet.id); setEditLabelValue(wallet.label); }}
                        className="text-muted-dark hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
                      >
                        <Pencil size={11} />
                      </button>
                    </div>
                  )}
                  <span className={cn(
                    "text-[10px] font-semibold uppercase tracking-wider",
                    wallet.type === "TREASURY" ? "text-primary-light" : "text-success"
                  )}>
                    {wallet.type}
                  </span>
                </div>
                <div className="text-right flex items-start gap-2">
                  <div>
                    {balances[wallet.id]?.loading ? (
                      <Loader2 size={14} className="text-muted-dark animate-spin" />
                    ) : (
                      <span className="text-sm font-bold text-foreground">
                        {(balances[wallet.id]?.balance || 0).toFixed(4)}
                      </span>
                    )}
                    <span className="text-[9px] text-muted-dark block">USDC</span>
                  </div>
                  <button
                    onClick={() => { setSelectedWallet(wallet); setModal("delete"); }}
                    title="Delete wallet"
                    className="p-1.5 rounded-lg text-muted-dark hover:text-danger hover:bg-danger/10 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <span className="text-[11px] font-mono text-muted-dark flex-1 truncate">{wallet.address}</span>
                <button
                  onClick={() => copyText(wallet.address, "Wallet address copied")}
                  className="p-1.5 rounded-md text-muted-dark hover:text-foreground hover:bg-white/[0.04] transition-colors"
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

              {/* Quick actions */}
              <div className="flex items-center gap-2 pt-3 border-t border-border">
                <button
                  onClick={() => openDeposit(wallet)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-muted-dark hover:text-success hover:bg-success/5 rounded-lg transition-colors"
                >
                  <ArrowDownToLine size={12} /> Deposit
                </button>
                <button
                  onClick={() => openTransfer(wallet)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-muted-dark hover:text-primary-light hover:bg-primary/5 rounded-lg transition-colors"
                >
                  <ArrowRightLeft size={12} /> Transfer
                </button>
                <button
                  onClick={() => loadTransactions(wallet)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-muted-dark hover:text-foreground hover:bg-white/[0.04] rounded-lg transition-colors"
                >
                  <History size={12} /> History
                </button>
                <button
                  onClick={() => fetchBalance(wallet.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-muted-dark hover:text-primary-light hover:bg-primary/5 rounded-lg transition-colors ml-auto"
                >
                  <RefreshCw size={12} />
                </button>
              </div>

              <div className="flex items-center gap-3 text-[10px] text-muted-dark mt-3">
                <span>{wallet.chain}</span>
                <span>·</span>
                <span>{new Date(wallet.createdAt).toLocaleDateString()}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {modal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#0F1629] border border-border rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl"
            >
              {/* Create Wallet Modal */}
              {modal === "create" && (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-lg font-semibold text-foreground">Create Wallet</h3>
                    <button onClick={closeModal} className="text-muted-dark hover:text-foreground"><X size={18} /></button>
                  </div>

                  {generatedKey ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-success/10 border border-success/20">
                        <CheckCircle2 size={16} className="text-success shrink-0" />
                        <span className="text-[13px] text-success">Wallet created successfully!</span>
                      </div>

                      <div className="p-4 rounded-xl bg-warning/5 border border-warning/20">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle size={14} className="text-warning" />
                          <span className="text-[12px] font-semibold text-warning">Save your private key now</span>
                        </div>
                        <p className="text-[11px] text-muted-dark mb-3">This key will NOT be shown again. Store it securely.</p>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 text-[10px] font-mono text-foreground bg-black/30 p-2 rounded-lg break-all select-all">
                            {generatedKey}
                          </code>
                          <button
                            onClick={() => { navigator.clipboard.writeText(generatedKey); setKeyCopied(true); }}
                            className={cn(
                              "p-2 rounded-lg shrink-0 transition-colors",
                              keyCopied ? "text-success bg-success/10" : "text-muted-dark hover:text-foreground hover:bg-white/[0.04]"
                            )}
                          >
                            {keyCopied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={closeModal}
                        className="w-full py-2.5 bg-primary text-white text-[13px] font-medium rounded-lg hover:bg-primary/80 transition-colors"
                      >
                        Done
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleCreate} className="space-y-4">
                      <div>
                        <label className="text-[11px] text-muted-dark mb-1.5 block font-medium">Wallet Type</label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { value: "TREASURY", icon: Shield, label: "Treasury", desc: "Organization funds" },
                            { value: "AGENT", icon: Bot, label: "Agent", desc: "Autonomous spending" },
                          ].map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => setCreateForm({ ...createForm, type: opt.value })}
                              className={cn(
                                "p-3 rounded-xl border text-left transition-all",
                                createForm.type === opt.value
                                  ? "border-primary/50 bg-primary/5"
                                  : "border-border hover:border-primary/20"
                              )}
                            >
                              <opt.icon size={16} className={cn(
                                "mb-1",
                                opt.value === "TREASURY" ? "text-primary-light" : "text-success"
                              )} />
                              <span className="text-[13px] font-medium text-foreground block">{opt.label}</span>
                              <span className="text-[10px] text-muted-dark">{opt.desc}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="text-[11px] text-muted-dark mb-1.5 block font-medium">Label</label>
                        <input
                          type="text"
                          value={createForm.label}
                          onChange={(e) => setCreateForm({ ...createForm, label: e.target.value })}
                          required
                          className="w-full bg-white/[0.03] border border-border rounded-lg px-3 py-2.5 text-[13px] text-foreground placeholder-muted-dark/50 focus:outline-none focus:border-primary/50 transition-all"
                          placeholder={createForm.type === "TREASURY" ? "Main Treasury" : "Payment Agent"}
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={creating || !createForm.label.trim()}
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-white text-[13px] font-medium rounded-lg hover:bg-primary/80 transition-colors disabled:opacity-50"
                      >
                        {creating ? <Loader2 size={14} className="animate-spin" /> : <><Key size={14} /> Generate Wallet</>}
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* Import Wallet Modal */}
              {modal === "import" && (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-lg font-semibold text-foreground">Import Wallet</h3>
                    <button onClick={closeModal} className="text-muted-dark hover:text-foreground"><X size={18} /></button>
                  </div>
                  <form onSubmit={handleImport} className="space-y-4">
                    <div>
                      <label className="text-[11px] text-muted-dark mb-1.5 block font-medium">Label</label>
                      <input
                        type="text"
                        value={importForm.label}
                        onChange={(e) => setImportForm({ ...importForm, label: e.target.value })}
                        required
                        className="w-full bg-white/[0.03] border border-border rounded-lg px-3 py-2.5 text-[13px] text-foreground placeholder-muted-dark/50 focus:outline-none focus:border-primary/50 transition-all"
                        placeholder="My Wallet"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-muted-dark mb-1.5 block font-medium">Private Key</label>
                      <input
                        type="password"
                        value={importForm.privateKey}
                        onChange={(e) => {
                          const val = e.target.value;
                          setImportForm({ ...importForm, privateKey: val });
                          const normalized = val.startsWith("0x") ? val : `0x${val}`;
                          if (/^0x[a-fA-F0-9]{64}$/.test(normalized)) {
                            setDerivedAddress(null);
                            import("ethers").then(({ Wallet: EthWallet }) => {
                              try { setDerivedAddress(new EthWallet(normalized).address); } catch {}
                            });
                          } else {
                            setDerivedAddress(null);
                          }
                        }}
                        required
                        className="w-full bg-white/[0.03] border border-border rounded-lg px-3 py-2.5 text-[13px] text-foreground font-mono placeholder-muted-dark/50 focus:outline-none focus:border-primary/50 transition-all"
                        placeholder="Enter 64-char hex private key"
                      />
                      <p className="text-[10px] text-muted-dark mt-1">Your key is encrypted with AES-256-GCM before storage</p>
                    </div>
                    {derivedAddress && (
                      <div className="p-3 rounded-xl bg-success/5 border border-success/20">
                        <span className="text-[10px] text-success block mb-1 font-medium">Derived Address</span>
                        <code className="text-[11px] font-mono text-foreground break-all">{derivedAddress}</code>
                      </div>
                    )}
                    <div>
                      <label className="text-[11px] text-muted-dark mb-1.5 block font-medium">Type</label>
                      <select
                        value={importForm.type}
                        onChange={(e) => setImportForm({ ...importForm, type: e.target.value })}
                        className="w-full bg-white/[0.03] border border-border rounded-lg px-3 py-2.5 text-[13px] text-foreground focus:outline-none focus:border-primary/50 transition-all"
                      >
                        <option value="AGENT">Agent</option>
                        <option value="TREASURY">Treasury</option>
                      </select>
                    </div>
                    <div className="p-3 rounded-xl bg-warning/5 border border-warning/20">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Shield size={12} className="text-warning" />
                        <span className="text-[11px] font-semibold text-warning">Security</span>
                      </div>
                      <p className="text-[10px] text-muted-dark">Private keys are encrypted using AES-256-GCM and never stored in plaintext.</p>
                    </div>
                    <button
                      type="submit"
                      disabled={importing || !derivedAddress}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-white text-[13px] font-medium rounded-lg hover:bg-primary/80 transition-colors disabled:opacity-50"
                    >
                      {importing ? <Loader2 size={14} className="animate-spin" /> : <><Import size={14} /> Import Wallet</>}
                    </button>
                  </form>
                </div>
              )}

              {/* Deposit Modal */}
              {modal === "deposit" && selectedWallet && (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-lg font-semibold text-foreground">Deposit USDC</h3>
                    <button onClick={closeModal} className="text-muted-dark hover:text-foreground"><X size={18} /></button>
                  </div>
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-white/[0.02] border border-border">
                      <span className="text-[10px] text-muted-dark uppercase tracking-wide block mb-1">Send USDC to this address</span>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-[12px] font-mono text-foreground break-all select-all">{selectedWallet.address}</code>
                        <button
                          onClick={() => copyText(selectedWallet.address, "Deposit address copied")}
                          className="p-2 rounded-lg shrink-0 text-muted-dark hover:text-foreground hover:bg-white/[0.04] transition-colors"
                        >
                          <Copy size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-primary/5 border border-primary/20">
                      <p className="text-[12px] text-primary-light mb-1 font-medium">Arc Testnet (Chain ID: 5042002)</p>
                      <p className="text-[11px] text-muted-dark">USDC is the native gas token on Arc Testnet. Send USDC directly to this address.</p>
                    </div>

                    <a
                      href="https://faucet.circle.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-white/[0.04] border border-border text-[13px] font-medium text-foreground rounded-lg hover:border-primary/30 hover:bg-white/[0.06] transition-colors"
                    >
                      <ExternalLink size={14} /> Get Testnet USDC from Circle Faucet
                    </a>

                    <a
                      href={`https://testnet.arcscan.app/address/${selectedWallet.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 py-2.5 text-[13px] font-medium text-muted-dark hover:text-foreground transition-colors"
                    >
                      <ExternalLink size={12} /> View on Block Explorer
                    </a>
                  </div>
                </div>
              )}

              {/* Transfer Modal */}
              {modal === "transfer" && selectedWallet && (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-lg font-semibold text-foreground">Transfer USDC</h3>
                    <button onClick={closeModal} className="text-muted-dark hover:text-foreground"><X size={18} /></button>
                  </div>

                  {transferResult ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-success/10 border border-success/20">
                        <CheckCircle2 size={16} className="text-success shrink-0" />
                        <span className="text-[13px] text-success">Transfer completed!</span>
                      </div>
                      <div className="p-3 rounded-xl bg-white/[0.02] border border-border">
                        <span className="text-[10px] text-muted-dark block mb-1">Transaction Hash</span>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 text-[10px] font-mono text-foreground truncate">{transferResult.txHash}</code>
                          <a
                            href={transferResult.explorerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-md text-muted-dark hover:text-foreground hover:bg-white/[0.04] transition-colors shrink-0"
                          >
                            <ExternalLink size={12} />
                          </a>
                        </div>
                      </div>
                      <button onClick={closeModal} className="w-full py-2.5 bg-primary text-white text-[13px] font-medium rounded-lg hover:bg-primary/80 transition-colors">
                        Done
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleTransfer} className="space-y-4">
                      <div className="p-3 rounded-xl bg-white/[0.02] border border-border">
                        <span className="text-[10px] text-muted-dark block">From</span>
                        <div className="flex items-center gap-2 mt-1">
                          {selectedWallet.type === "TREASURY" ? <Shield size={14} className="text-primary-light" /> : <Bot size={14} className="text-success" />}
                          <span className="text-[13px] font-medium text-foreground">{selectedWallet.label}</span>
                          <span className="text-[11px] text-muted-dark ml-auto">
                            {(balances[selectedWallet.id]?.balance || 0).toFixed(4)} USDC
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] text-muted-dark mb-1.5 block font-medium">To Wallet</label>
                        <select
                          value={transferForm.toWalletId}
                          onChange={(e) => setTransferForm({ ...transferForm, toWalletId: e.target.value })}
                          required
                          className="w-full bg-white/[0.03] border border-border rounded-lg px-3 py-2.5 text-[13px] text-foreground focus:outline-none focus:border-primary/50 transition-all"
                        >
                          <option value="">Select destination wallet</option>
                          {wallets.filter(w => w.id !== selectedWallet.id).map(w => (
                            <option key={w.id} value={w.id}>
                              {w.label} ({w.type}) — {(balances[w.id]?.balance || 0).toFixed(4)} USDC
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] text-muted-dark mb-1.5 block font-medium">Amount (USDC)</label>
                        <input
                          type="number"
                          step="0.000001"
                          min="0.000001"
                          value={transferForm.amount}
                          onChange={(e) => setTransferForm({ ...transferForm, amount: e.target.value })}
                          required
                          className="w-full bg-white/[0.03] border border-border rounded-lg px-3 py-2.5 text-[13px] text-foreground placeholder-muted-dark/50 focus:outline-none focus:border-primary/50 transition-all"
                          placeholder="0.00"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] text-muted-dark mb-1.5 block font-medium">Note (optional)</label>
                        <input
                          type="text"
                          value={transferForm.note}
                          onChange={(e) => setTransferForm({ ...transferForm, note: e.target.value })}
                          className="w-full bg-white/[0.03] border border-border rounded-lg px-3 py-2.5 text-[13px] text-foreground placeholder-muted-dark/50 focus:outline-none focus:border-primary/50 transition-all"
                          placeholder="Agent funding allocation"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={transferring || !transferForm.toWalletId || !transferForm.amount}
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-white text-[13px] font-medium rounded-lg hover:bg-primary/80 transition-colors disabled:opacity-50"
                      >
                        {transferring ? <Loader2 size={14} className="animate-spin" /> : <><ArrowRightLeft size={14} /> Transfer</>}
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* Transaction History Modal */}
              {modal === "transactions" && selectedWallet && (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Transaction History</h3>
                      <p className="text-[12px] text-muted-dark">{selectedWallet.label}</p>
                    </div>
                    <button onClick={closeModal} className="text-muted-dark hover:text-foreground"><X size={18} /></button>
                  </div>

                  {txLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 size={20} className="text-primary-light animate-spin" />
                    </div>
                  ) : transactions.length === 0 ? (
                    <div className="text-center py-12">
                      <History size={24} className="text-muted-dark mx-auto mb-2" />
                      <p className="text-[13px] text-muted-dark">No transactions yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                      {transactions.map((tx) => {
                        const meta = tx.metadata as Record<string, Record<string, string>>;
                        const isOutgoing = tx.fromWalletId === selectedWallet.id;
                        return (
                          <div key={tx.id} className="p-3 rounded-xl bg-white/[0.02] border border-border">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                {tx.type === "transfer" ? (
                                  <ArrowRightLeft size={12} className="text-primary-light" />
                                ) : tx.type === "deposit" ? (
                                  <ArrowDownToLine size={12} className="text-success" />
                                ) : (
                                  <ArrowUpFromLine size={12} className="text-warning" />
                                )}
                                <span className="text-[12px] font-medium text-foreground capitalize">{tx.type}</span>
                              </div>
                              <span className={cn(
                                "text-[13px] font-semibold font-mono",
                                isOutgoing ? "text-danger" : "text-success"
                              )}>
                                {isOutgoing ? "-" : "+"}{tx.amount.toFixed(4)} USDC
                              </span>
                            </div>
                            {tx.reference && (
                              <p className="text-[11px] text-muted-dark mb-1">{tx.reference}</p>
                            )}
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-muted-dark">
                                {new Date(tx.createdAt).toLocaleString()}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className={cn(
                                  "text-[9px] font-semibold px-1.5 py-0.5 rounded-full uppercase",
                                  tx.status === "COMPLETED" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                                )}>
                                  {tx.status}
                                </span>
                                {tx.txHash && (
                                  <a
                                    href={`https://testnet.arcscan.app/tx/${tx.txHash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[10px] text-primary-light hover:text-primary flex items-center gap-1"
                                  >
                                    <ExternalLink size={10} /> Tx
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Delete Wallet Modal */}
              {modal === "delete" && selectedWallet && (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-lg font-semibold text-foreground">Delete Wallet</h3>
                    <button onClick={closeModal} className="text-muted-dark hover:text-foreground"><X size={18} /></button>
                  </div>
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-danger/5 border border-danger/20">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle size={16} className="text-danger" />
                        <span className="text-[13px] font-semibold text-danger">This action cannot be undone</span>
                      </div>
                      <p className="text-[12px] text-muted-dark">
                        Are you sure you want to delete <strong className="text-foreground">{selectedWallet.label}</strong>?
                        The wallet address <code className="text-[10px]">{selectedWallet.address.slice(0, 10)}...{selectedWallet.address.slice(-6)}</code> will be soft-deleted.
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={closeModal}
                        className="flex-1 py-2.5 bg-white/[0.04] border border-border text-[13px] font-medium text-foreground rounded-lg hover:bg-white/[0.06] transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-danger text-white text-[13px] font-medium rounded-lg hover:bg-danger/80 transition-colors disabled:opacity-50"
                      >
                        {deleting ? <Loader2 size={14} className="animate-spin" /> : <><Trash2 size={14} /> Delete</>}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
