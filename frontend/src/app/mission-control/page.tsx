"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { commandSuggestions, timelineEvents, agents } from "@/lib/mock-data";
import type { CanvasMetrics, AgentRouteResponse } from "@/lib/types";
import {
  Send, Sparkles, CheckCircle2, Clock, Loader2, Bot, ChevronRight,
  CreditCard, ShoppingCart, Landmark, Wallet, Wifi, WifiOff,
} from "lucide-react";

const agentIcon: Record<string, React.FC<{ size?: number; className?: string }>> = {
  "Payment Agent": CreditCard,
  "Procurement Agent": ShoppingCart,
  "Treasury Agent": Landmark,
  "Budget Agent": Wallet,
};

const statusIcon: Record<string, React.FC<{ size?: number; className?: string }>> = {
  completed: CheckCircle2,
  in_progress: Loader2,
  pending: Clock,
};

const MOCK_CANVAS: CanvasMetrics = {
  wallet_address: "0x...", usdc_balance: 7.16, active_throughput: 0,
  last_route: "cheap_tier", daily_spend: 2.84, total_saved: 42.38,
  requests_today: 1847, budget_remaining: 7.16, circuit_breaker: false, chain: "Arc Testnet (5042002)",
};

export default function MissionControlPage() {
  const [command, setCommand] = useState("");
  const [sending, setSending] = useState(false);
  const [responses, setResponses] = useState<AgentRouteResponse[]>([]);

  const fetchMetrics = useCallback(() => api.fetchCanvasMetrics(), []);
  const metrics = useApi(fetchMetrics, MOCK_CANVAS, 10000);

  const handleSubmit = async () => {
    if (!command.trim() || sending) return;
    setSending(true);
    const result = await api.postAgentRoute(command, "low");
    if (result) {
      setResponses((prev) => [result, ...prev]);
    }
    setSending(false);
    setCommand("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mission Control</h1>
          <p className="text-sm text-muted-dark mt-1">Command your AI agents — natural language operations center</p>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-medium">
          {metrics.isLive ? (
            <span className="flex items-center gap-1.5 text-success"><Wifi size={12} /> Live</span>
          ) : (
            <span className="flex items-center gap-1.5 text-muted-dark"><WifiOff size={12} /> Demo</span>
          )}
        </div>
      </div>

      {/* Command input */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-bright rounded-xl p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <Sparkles size={16} className="text-primary-light" />
          <span className="text-sm font-semibold text-foreground">AI Command Center</span>
        </div>
        <div className="relative">
          <input
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="Tell BudgetBot what to do..."
            className="w-full bg-bg border border-border rounded-xl px-4 py-3.5 text-sm text-foreground placeholder-muted-dark focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
          />
          <button
            onClick={handleSubmit}
            disabled={sending}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-primary hover:bg-primary/80 transition-colors disabled:opacity-50"
          >
            {sending ? <Loader2 size={14} className="text-white animate-spin" /> : <Send size={14} className="text-white" />}
          </button>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {commandSuggestions.map((s) => (
            <button
              key={s}
              onClick={() => setCommand(s)}
              className="text-[11px] text-muted hover:text-foreground px-3 py-1.5 rounded-full border border-border hover:border-primary/30 transition-all"
            >
              {s}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Live responses */}
      {responses.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-bright rounded-xl p-6"
        >
          <h3 className="text-sm font-semibold text-foreground mb-4">Agent Responses</h3>
          <div className="space-y-3">
            {responses.map((r, i) => (
              <div key={i} className="p-4 rounded-lg bg-white/[0.02] border border-border">
                <div className="flex items-center gap-3 mb-2">
                  <Bot size={14} className="text-primary-light" />
                  <span className="text-[12px] font-semibold text-foreground">{r.model_used}</span>
                  <span className="text-[10px] text-muted-dark font-mono">{r.route} · ${r.cost.toFixed(4)}</span>
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-success/10 text-success font-semibold uppercase">{r.settlement}</span>
                </div>
                <p className="text-[13px] text-muted leading-relaxed">{r.response}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-bright rounded-xl p-6"
          >
            <h3 className="text-sm font-semibold text-foreground mb-5">Agent Execution Timeline</h3>
            <div className="space-y-0">
              {timelineEvents.map((event, i) => {
                const StatusIcon = statusIcon[event.status] || Clock;
                const AgentIcon = agentIcon[event.agent] || Bot;
                return (
                  <div key={i} className="flex gap-4 relative">
                    {i < timelineEvents.length - 1 && (
                      <div className="absolute left-[19px] top-10 w-px h-[calc(100%-16px)] bg-border" />
                    )}
                    <div className="shrink-0 mt-1">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center",
                        event.status === "completed" ? "bg-success/10" : event.status === "in_progress" ? "bg-primary/10" : "bg-white/5"
                      )}>
                        <AgentIcon size={16} className={cn(
                          event.status === "completed" ? "text-success" : event.status === "in_progress" ? "text-primary-light" : "text-muted-dark"
                        )} />
                      </div>
                    </div>
                    <div className="flex-1 pb-6">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[13px] font-medium text-foreground">{event.action}</span>
                        <StatusIcon size={12} className={cn(
                          event.status === "completed" ? "text-success" : event.status === "in_progress" ? "text-primary-light animate-spin" : "text-muted-dark"
                        )} />
                        {event.savings && (
                          <span className="text-[10px] font-semibold text-success bg-success/10 px-2 py-0.5 rounded-full">
                            -${event.savings}
                          </span>
                        )}
                      </div>
                      <p className="text-[12px] text-muted">{event.detail}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-muted-dark font-mono">{event.time}</span>
                        <span className="text-[10px] text-muted-dark">·</span>
                        <span className="text-[10px] text-muted-dark">{event.agent}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* Active agents with live metrics */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="glass-bright rounded-xl p-6"
          >
            <h3 className="text-sm font-semibold text-foreground mb-3">Active Agents</h3>
            {metrics.isLive && (
              <div className="mb-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
                <div className="grid grid-cols-2 gap-3 text-[10px]">
                  <div><span className="text-muted-dark">Throughput</span><br/><span className="text-foreground font-semibold">{metrics.data.active_throughput}/s</span></div>
                  <div><span className="text-muted-dark">Last Route</span><br/><span className="text-foreground font-semibold">{metrics.data.last_route}</span></div>
                  <div><span className="text-muted-dark">Spend Today</span><br/><span className="text-foreground font-semibold">${metrics.data.daily_spend.toFixed(4)}</span></div>
                  <div><span className="text-muted-dark">Saved</span><br/><span className="text-success font-semibold">${metrics.data.total_saved.toFixed(4)}</span></div>
                </div>
              </div>
            )}
            <div className="space-y-3">
              {agents.map((a) => {
                const Icon = agentIcon[a.name] || Bot;
                return (
                  <div key={a.id} className="p-3 rounded-lg bg-white/[0.02] border border-border hover:border-primary/20 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon size={14} className="text-primary-light" />
                      <span className="text-[12px] font-medium text-foreground flex-1">{a.name}</span>
                      <div className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
                      </div>
                    </div>
                    <p className="text-[11px] text-muted truncate">{a.currentTask}</p>
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-dark">
                      <span>{a.successRate}% success</span>
                      <span>·</span>
                      <span>{a.lastActivity}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
