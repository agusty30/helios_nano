"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  ArrowLeft, Copy, Check, ExternalLink, Hash, Wallet, Clock, Fuel,
  Box, Activity, User,
} from "lucide-react";

const statusStyle: Record<string, string> = {
  COMPLETED: "bg-success/10 text-success",
  completed: "bg-success/10 text-success",
  PENDING: "bg-warning/10 text-warning",
  pending: "bg-warning/10 text-warning",
  FAILED: "bg-danger/10 text-danger",
  failed: "bg-danger/10 text-danger",
};

const EXPLORER = "https://testnet.arcscan.app";

interface TxDetail {
  id: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  reference: string | null;
  txHash: string | null;
  fromWalletId: string | null;
  toWalletId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  wallet: { id: string; label: string; address: string } | null;
  fromWallet: { id: string; label: string; address: string } | null;
  toWallet: { id: string; label: string; address: string } | null;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="p-1 rounded hover:bg-white/5 transition-colors">
      {copied ? <Check size={12} className="text-success" /> : <Copy size={12} className="text-muted-dark" />}
    </button>
  );
}

function InfoRow({ icon: Icon, label, value, mono, copyable, link }: {
  icon: React.FC<{ size?: number; className?: string }>;
  label: string;
  value: string;
  mono?: boolean;
  copyable?: boolean;
  link?: string;
}) {
  return (
    <div className="flex items-start justify-between py-3 border-b border-border/50 last:border-0">
      <div className="flex items-center gap-2 text-muted-dark">
        <Icon size={14} />
        <span className="text-[12px]">{label}</span>
      </div>
      <div className="flex items-center gap-1.5 max-w-[60%] text-right">
        <span className={cn("text-[12px] text-foreground break-all", mono && "font-mono")}>{value}</span>
        {copyable && <CopyButton text={value} />}
        {link && (
          <a href={link} target="_blank" rel="noopener noreferrer" className="p-1 rounded hover:bg-white/5 transition-colors">
            <ExternalLink size={12} className="text-primary-light" />
          </a>
        )}
      </div>
    </div>
  );
}

export default function TransactionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [tx, setTx] = useState<TxDetail | null>(null);
  const [agentName, setAgentName] = useState<string | null>(null);
  const [onChain, setOnChain] = useState<{ gasUsed?: string; blockNumber?: number; gasPrice?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/transactions/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.transaction) {
          setTx(data.transaction);
          setAgentName(data.agentName || null);
          setOnChain(data.onChain || null);
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/transactions")} className="p-2 rounded-lg hover:bg-white/5 transition-colors">
            <ArrowLeft size={16} className="text-muted-dark" />
          </button>
          <h1 className="text-2xl font-bold text-foreground">Transaction Detail</h1>
        </div>
        <div className="glass-bright rounded-xl p-8 flex items-center justify-center">
          <span className="text-[13px] text-muted-dark">Loading...</span>
        </div>
      </div>
    );
  }

  if (!tx) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/transactions")} className="p-2 rounded-lg hover:bg-white/5 transition-colors">
            <ArrowLeft size={16} className="text-muted-dark" />
          </button>
          <h1 className="text-2xl font-bold text-foreground">Transaction Not Found</h1>
        </div>
      </div>
    );
  }

  const senderWallet = tx.fromWallet || tx.wallet;
  const statusKey = tx.status.toUpperCase();

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <button onClick={() => router.push("/transactions")} className="p-2 rounded-lg hover:bg-white/5 transition-colors">
          <ArrowLeft size={16} className="text-muted-dark" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Transaction Detail</h1>
          <p className="text-[11px] text-muted-dark font-mono mt-0.5">{tx.id}</p>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-bright rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <span className="text-[10px] text-muted-dark uppercase tracking-wider">Amount</span>
            <div className="text-2xl font-bold text-foreground mt-1">{tx.amount.toFixed(4)} {tx.currency}</div>
          </div>
          <span className={cn("text-[10px] font-semibold px-3 py-1.5 rounded-full uppercase", statusStyle[statusKey] || statusStyle[tx.status])}>
            {tx.status}
          </span>
        </div>

        <div className="space-y-0">
          {tx.txHash && (
            <InfoRow icon={Hash} label="Tx Hash" value={tx.txHash} mono copyable link={`${EXPLORER}/tx/${tx.txHash}`} />
          )}

          {senderWallet && (
            <InfoRow icon={Wallet} label="From" value={`${senderWallet.label} (${senderWallet.address})`} mono copyable />
          )}

          {tx.toWallet && (
            <InfoRow icon={Wallet} label="To" value={`${tx.toWallet.label} (${tx.toWallet.address})`} mono copyable />
          )}

          {agentName && (
            <InfoRow icon={User} label="Agent" value={agentName} />
          )}

          <InfoRow icon={Activity} label="Type" value={tx.type} />
          <InfoRow icon={Activity} label="Network" value="Arc Testnet (5042002)" />
          <InfoRow icon={Clock} label="Timestamp" value={new Date(tx.createdAt).toLocaleString()} />

          {tx.reference && (
            <InfoRow icon={Hash} label="Reference" value={tx.reference} />
          )}

          {onChain?.gasUsed && (
            <InfoRow icon={Fuel} label="Gas Used" value={onChain.gasUsed} mono />
          )}

          {onChain?.gasPrice && (
            <InfoRow icon={Fuel} label="Gas Price" value={`${onChain.gasPrice} wei`} mono />
          )}

          {onChain?.blockNumber && (
            <InfoRow icon={Box} label="Block Number" value={onChain.blockNumber.toString()} mono link={`${EXPLORER}/block/${onChain.blockNumber}`} />
          )}
        </div>
      </motion.div>

      {tx.metadata && Object.keys(tx.metadata).length > 0 && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-bright rounded-xl p-6">
          <h3 className="text-[14px] font-semibold text-foreground mb-4">Metadata</h3>
          <pre className="text-[11px] font-mono text-muted bg-bg/50 rounded-lg p-4 overflow-x-auto">
            {JSON.stringify(tx.metadata, null, 2)}
          </pre>
        </motion.div>
      )}
    </div>
  );
}
