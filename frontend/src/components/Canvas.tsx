"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  Edge,
  Node,
  useEdgesState,
  useNodesState,
  BackgroundVariant,
  ConnectionMode,
} from "reactflow";
import "reactflow/dist/style.css";
import { Wallet, TrendingDown, PiggyBank, DollarSign, Radio, Hexagon } from "lucide-react";
import clsx from "clsx";

import ApiInputNode from "@/components/nodes/ApiInputNode";
import GatewayNode from "@/components/nodes/GatewayNode";
import RouterNode from "@/components/nodes/RouterNode";
import LlmNode from "@/components/nodes/LlmNode";
import AnimatedFlowEdge from "@/components/edges/AnimatedFlowEdge";
import TransactionFeed from "@/components/TransactionFeed";
import StatsHud from "@/components/StatsHud";
import type { CanvasMetrics, TransactionEvent } from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const initialNodes: Node[] = [
  {
    id: "api-input",
    type: "apiInput",
    position: { x: 50, y: 260 },
    data: { throughput: 0 },
  },
  {
    id: "gateway",
    type: "gateway",
    position: { x: 380, y: 160 },
    data: { balance: 0, chain: "Arc Testnet · 5042002" },
  },
  {
    id: "router",
    type: "router",
    position: { x: 760, y: 220 },
    data: { lastRoute: "idle", dailySpend: 0 },
  },
  {
    id: "llm-heavy",
    type: "llm",
    position: { x: 1120, y: 80 },
    data: {
      tier: "heavy",
      model: "gpt-4.5-preview",
      costPerCall: "$0.05",
      isActive: false,
    },
  },
  {
    id: "llm-cheap",
    type: "llm",
    position: { x: 1120, y: 370 },
    data: {
      tier: "cheap",
      model: "gpt-4o-mini",
      costPerCall: "$0.0008",
      isActive: false,
    },
  },
];

function makeEdge(
  id: string,
  source: string,
  target: string,
  sourceHandle?: string,
  color: "mint" | "gold" | "crimson" | "idle" = "idle",
  active = false,
  speed = 2
): Edge {
  return {
    id,
    source,
    target,
    sourceHandle,
    type: "animatedFlow",
    data: { color, active, particleCount: 4, speed },
  };
}

const initialEdges: Edge[] = [
  makeEdge("e-input-gateway", "api-input", "gateway"),
  makeEdge("e-gateway-router", "gateway", "router"),
  makeEdge("e-router-cheap", "router", "llm-cheap", "cheap"),
  makeEdge("e-router-heavy", "router", "llm-heavy", "heavy"),
];

const defaultMetrics: CanvasMetrics = {
  wallet_address: "0x0000...0000",
  usdc_balance: 0,
  active_throughput: 0,
  last_route: "idle",
  daily_spend: 0,
  total_saved: 0,
  requests_today: 0,
  budget_remaining: 10,
  circuit_breaker: false,
  chain: "Arc Testnet · 5042002",
};

export default function Canvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [metrics, setMetrics] = useState<CanvasMetrics>(defaultMetrics);
  const [transactions, setTransactions] = useState<TransactionEvent[]>([]);
  const lastRouteRef = useRef<string>("idle");
  const prevRequestsRef = useRef(0);

  const nodeTypes = useMemo(
    () => ({
      apiInput: ApiInputNode,
      gateway: GatewayNode,
      router: RouterNode,
      llm: LlmNode,
    }),
    []
  );

  const edgeTypes = useMemo(
    () => ({
      animatedFlow: AnimatedFlowEdge,
    }),
    []
  );

  const truncAddr = useCallback((addr: string) => {
    if (!addr || addr.length < 10) return addr || "0x0000...0000";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  }, []);

  // Polling for metrics — 1 second heartbeat
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await fetch(`${API_URL}/v1/canvas-metrics`);
        if (res.ok) {
          const data: CanvasMetrics = await res.json();
          setMetrics(data);

          // Generate synthetic transaction events when request count changes
          if (data.requests_today > prevRequestsRef.current) {
            const newCount = data.requests_today - prevRequestsRef.current;
            const newTxs: TransactionEvent[] = [];
            for (let i = 0; i < newCount; i++) {
              newTxs.push({
                id: `tx-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
                timestamp: Date.now(),
                route: data.last_route === "heavy_tier" ? "heavy_tier" : "cheap_tier",
                cost: data.last_route === "heavy_tier" ? 0.05 : 0.0008,
                model: data.last_route === "heavy_tier" ? "gpt-4.5-preview" : "gpt-4o-mini",
                settlement: `eip3009-${Math.random().toString(36).slice(2, 10)}`,
              });
            }
            setTransactions((prev) => [...newTxs, ...prev].slice(0, 50));
          }
          prevRequestsRef.current = data.requests_today;
        }
      } catch {
        // Backend not available
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 1000);
    return () => clearInterval(interval);
  }, []);

  // Update nodes when metrics change
  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => {
        switch (node.id) {
          case "api-input":
            return { ...node, data: { ...node.data, throughput: metrics.active_throughput } };
          case "gateway":
            return { ...node, data: { ...node.data, balance: metrics.usdc_balance, chain: metrics.chain } };
          case "router":
            return { ...node, data: { ...node.data, lastRoute: metrics.last_route, dailySpend: metrics.daily_spend } };
          case "llm-cheap":
            return { ...node, data: { ...node.data, isActive: metrics.last_route === "cheap_tier" } };
          case "llm-heavy":
            return { ...node, data: { ...node.data, isActive: metrics.last_route === "heavy_tier" } };
          default:
            return node;
        }
      })
    );
  }, [metrics, setNodes]);

  // Update edge animations based on route
  useEffect(() => {
    const route = metrics.last_route;
    const isActive = metrics.active_throughput > 0;
    const speed = Math.max(1, 3 - metrics.active_throughput);

    setEdges(() => {
      if (metrics.circuit_breaker) {
        return [
          makeEdge("e-input-gateway", "api-input", "gateway", undefined, "crimson", true, 1.5),
          makeEdge("e-gateway-router", "gateway", "router", undefined, "crimson", true, 1.5),
          makeEdge("e-router-cheap", "router", "llm-cheap", "cheap", "crimson", true, 1.5),
          makeEdge("e-router-heavy", "router", "llm-heavy", "heavy", "crimson", true, 1.5),
        ];
      }

      const pipeColor = isActive ? (route === "heavy_tier" ? "gold" : "mint") : "idle";

      return [
        makeEdge("e-input-gateway", "api-input", "gateway", undefined, isActive ? "mint" : "idle", isActive, speed),
        makeEdge("e-gateway-router", "gateway", "router", undefined, isActive ? "mint" : "idle", isActive, speed),
        makeEdge("e-router-cheap", "router", "llm-cheap", "cheap", route === "cheap_tier" ? "mint" : "idle", route === "cheap_tier", speed),
        makeEdge("e-router-heavy", "router", "llm-heavy", "heavy", route === "heavy_tier" ? "gold" : "idle", route === "heavy_tier", speed),
      ];
    });

    lastRouteRef.current = route;
  }, [metrics.last_route, metrics.active_throughput, metrics.circuit_breaker, setEdges]);

  // Ambient gradient class
  const ambientClass = clsx(
    "ambient-gradient",
    metrics.active_throughput > 0 && "active",
    metrics.circuit_breaker && "route-breaker",
    !metrics.circuit_breaker && metrics.last_route === "cheap_tier" && "route-cheap",
    !metrics.circuit_breaker && metrics.last_route === "heavy_tier" && "route-heavy"
  );

  const budgetPct = Math.min(100, (metrics.daily_spend / (metrics.daily_spend + metrics.budget_remaining || 10)) * 100);

  return (
    <div className="relative w-full h-full">
      {/* Ambient canvas glow */}
      <div className={ambientClass} />

      {/* Left Sidebar */}
      <div className="absolute left-4 top-4 bottom-4 w-[240px] z-10 flex flex-col gap-2.5">
        {/* Brand */}
        <div className="glass-bright rounded-xl border border-border px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <Hexagon size={18} className="text-accent" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              </div>
            </div>
            <div>
              <span className="text-[13px] font-bold text-white tracking-tight">BudgetBot</span>
              <div className="text-[9px] text-zinc-600 font-mono">Autonomous Agent</div>
            </div>
          </div>
        </div>

        {/* Wallet */}
        <div className="glass rounded-xl border border-border px-4 py-3 space-y-2">
          <div className="flex items-center gap-2">
            <Wallet size={12} className="text-zinc-500" />
            <span className="text-[9px] font-semibold uppercase tracking-wider text-zinc-600">Wallet</span>
          </div>
          <div className="font-mono text-xs text-zinc-400">
            {truncAddr(metrics.wallet_address)}
          </div>
          <div className="flex items-center gap-1.5">
            <Radio size={9} className="text-mint" />
            <span className="text-[9px] text-zinc-600 font-mono">
              Arc Testnet · 5042002
            </span>
          </div>
        </div>

        {/* Budget progress */}
        <div className="glass rounded-xl border border-border px-4 py-3 space-y-3">
          <div className="flex items-center gap-2">
            <DollarSign size={12} className="text-zinc-500" />
            <span className="text-[9px] font-semibold uppercase tracking-wider text-zinc-600">Daily Budget</span>
          </div>

          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] font-mono">
              <span className="text-zinc-500">Spent</span>
              <span className={clsx(
                "font-semibold tabular-nums",
                budgetPct > 80 ? "text-crimson" : budgetPct > 50 ? "text-gold" : "text-mint"
              )}>
                ${metrics.daily_spend.toFixed(4)}
              </span>
            </div>
            <div className="h-[6px] bg-surface2 rounded-full overflow-hidden">
              <div
                className={clsx(
                  "h-full rounded-full transition-all duration-700",
                  budgetPct > 80 ? "bg-crimson" : budgetPct > 50 ? "bg-gold" : "bg-mint"
                )}
                style={{ width: `${budgetPct}%` }}
              />
            </div>
            <div className="flex justify-between text-[9px] font-mono text-zinc-700">
              <span>{budgetPct.toFixed(0)}% used</span>
              <span>${metrics.budget_remaining.toFixed(2)} left</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="glass rounded-xl border border-border px-4 py-3 space-y-2.5">
          <StatRow
            icon={<TrendingDown size={12} className="text-zinc-500" />}
            label="Remaining"
            value={`$${metrics.budget_remaining.toFixed(2)}`}
            color={metrics.budget_remaining < 2 ? "text-crimson" : "text-mint"}
          />
          <StatRow
            icon={<PiggyBank size={12} className="text-zinc-500" />}
            label="Total Saved"
            value={`$${metrics.total_saved.toFixed(4)}`}
            color="text-mint"
          />
        </div>

        {/* Status */}
        <div className="glass rounded-xl border border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <div className={clsx(
              "relative w-2 h-2 rounded-full",
              metrics.circuit_breaker
                ? "bg-crimson"
                : metrics.active_throughput > 0
                ? "bg-mint"
                : "bg-zinc-600"
            )}>
              {(metrics.active_throughput > 0 || metrics.circuit_breaker) && (
                <div className={clsx(
                  "absolute inset-0 w-2 h-2 rounded-full animate-ping opacity-40",
                  metrics.circuit_breaker ? "bg-crimson" : "bg-mint"
                )} />
              )}
            </div>
            <span className="text-[10px] text-zinc-500">
              {metrics.circuit_breaker
                ? "Circuit Breaker Active"
                : metrics.active_throughput > 0
                ? "Processing Requests"
                : "Idle — Waiting"}
            </span>
          </div>
          <div className="mt-1.5 text-[9px] text-zinc-700 font-mono tabular-nums">
            {metrics.requests_today} requests settled today
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Gas-free badge */}
        <div className="glass rounded-xl border border-border px-4 py-2.5 text-center">
          <span className="text-[9px] font-mono text-zinc-600">
            Powered by <span className="text-accent font-semibold">Circle Gateway</span> · Gas-Free
          </span>
        </div>
      </div>

      {/* Stats HUD — top right */}
      <div className="absolute top-4 right-4 z-10">
        <StatsHud metrics={metrics} />
      </div>

      {/* Transaction Feed — bottom right */}
      <div className="absolute bottom-4 right-4 z-10">
        <TransactionFeed transactions={transactions} />
      </div>

      {/* React Flow Canvas */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.4}
        maxZoom={1.5}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={28}
          size={1}
          color="#151518"
        />
        <Controls showInteractive={false} position="bottom-left" />
      </ReactFlow>
    </div>
  );
}

function StatRow({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-[9px] text-zinc-600 font-medium">{label}</span>
      </div>
      <span className={clsx("text-[11px] font-mono font-semibold tabular-nums", color)}>
        {value}
      </span>
    </div>
  );
}
