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
import { Wallet, TrendingDown, PiggyBank, DollarSign } from "lucide-react";
import clsx from "clsx";

import ApiInputNode from "@/components/nodes/ApiInputNode";
import GatewayNode from "@/components/nodes/GatewayNode";
import RouterNode from "@/components/nodes/RouterNode";
import LlmNode from "@/components/nodes/LlmNode";
import { CanvasMetrics } from "@/lib/types";

const initialNodes: Node[] = [
  {
    id: "api-input",
    type: "apiInput",
    position: { x: 50, y: 250 },
    data: { throughput: 0 },
  },
  {
    id: "gateway",
    type: "gateway",
    position: { x: 350, y: 150 },
    data: { balance: 0, chain: "Arc Testnet · 5042002" },
  },
  {
    id: "router",
    type: "router",
    position: { x: 700, y: 230 },
    data: { lastRoute: "idle", dailySpend: 0 },
  },
  {
    id: "llm-heavy",
    type: "llm",
    position: { x: 1050, y: 100 },
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
    position: { x: 1050, y: 350 },
    data: {
      tier: "cheap",
      model: "gpt-4o-mini",
      costPerCall: "$0.0008",
      isActive: false,
    },
  },
];

const initialEdges: Edge[] = [
  {
    id: "e-input-gateway",
    source: "api-input",
    target: "gateway",
    animated: true,
    style: { stroke: "#27272a", strokeWidth: 2 },
  },
  {
    id: "e-gateway-router",
    source: "gateway",
    target: "router",
    animated: true,
    style: { stroke: "#27272a", strokeWidth: 2 },
  },
  {
    id: "e-router-cheap",
    source: "router",
    sourceHandle: "cheap",
    target: "llm-cheap",
    animated: false,
    style: { stroke: "#27272a", strokeWidth: 2 },
  },
  {
    id: "e-router-heavy",
    source: "router",
    sourceHandle: "heavy",
    target: "llm-heavy",
    animated: false,
    style: { stroke: "#27272a", strokeWidth: 2 },
  },
];

const defaultMetrics: CanvasMetrics = {
  wallet_address: "0x0000...0000",
  usdc_balance: 0,
  active_throughput: 0,
  last_route: "idle",
  daily_spend: 0,
  total_saved: 0,
  requests_today: 0,
  budget_remaining: 0,
  circuit_breaker: false,
  chain: "Arc Testnet · 5042002",
};

export default function Canvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [metrics, setMetrics] = useState<CanvasMetrics>(defaultMetrics);
  const lastRouteRef = useRef<string>("idle");

  const nodeTypes = useMemo(
    () => ({
      apiInput: ApiInputNode,
      gateway: GatewayNode,
      router: RouterNode,
      llm: LlmNode,
    }),
    []
  );

  const truncateAddress = useCallback((addr: string) => {
    if (!addr || addr.length < 10) return addr || "0x0000...0000";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  }, []);

  // Polling for metrics
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await fetch("http://localhost:8000/v1/canvas-metrics");
        if (res.ok) {
          const data: CanvasMetrics = await res.json();
          setMetrics(data);
        }
      } catch {
        // Backend not available, use defaults
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
            return {
              ...node,
              data: { ...node.data, throughput: metrics.active_throughput },
            };
          case "gateway":
            return {
              ...node,
              data: {
                ...node.data,
                balance: metrics.usdc_balance,
                chain: metrics.chain,
              },
            };
          case "router":
            return {
              ...node,
              data: {
                ...node.data,
                lastRoute: metrics.last_route,
                dailySpend: metrics.daily_spend,
              },
            };
          case "llm-cheap":
            return {
              ...node,
              data: {
                ...node.data,
                isActive: metrics.last_route === "cheap_tier",
              },
            };
          case "llm-heavy":
            return {
              ...node,
              data: {
                ...node.data,
                isActive: metrics.last_route === "heavy_tier",
              },
            };
          default:
            return node;
        }
      })
    );
  }, [metrics, setNodes]);

  // Update edge animations when route changes
  useEffect(() => {
    if (metrics.last_route === lastRouteRef.current) return;
    lastRouteRef.current = metrics.last_route;

    setEdges((eds) =>
      eds.map((edge) => {
        if (metrics.last_route === "circuit_breaker") {
          return {
            ...edge,
            animated: true,
            className: "edge-red",
            style: { stroke: "#ef4444", strokeWidth: 3 },
          };
        }

        if (edge.id === "e-router-cheap") {
          const isActive = metrics.last_route === "cheap_tier";
          return {
            ...edge,
            animated: isActive,
            className: isActive ? "edge-green" : "",
            style: {
              stroke: isActive ? "#10b981" : "#27272a",
              strokeWidth: isActive ? 3 : 2,
            },
          };
        }

        if (edge.id === "e-router-heavy") {
          const isActive = metrics.last_route === "heavy_tier";
          return {
            ...edge,
            animated: isActive,
            className: isActive ? "edge-gold" : "",
            style: {
              stroke: isActive ? "#f59e0b" : "#27272a",
              strokeWidth: isActive ? 3 : 2,
            },
          };
        }

        // Input and gateway edges stay subtly animated
        return {
          ...edge,
          animated: metrics.active_throughput > 0,
          className: "",
          style: {
            stroke: metrics.active_throughput > 0 ? "#3f3f46" : "#27272a",
            strokeWidth: 2,
          },
        };
      })
    );
  }, [metrics.last_route, metrics.active_throughput, setEdges]);

  return (
    <div className="relative w-full h-full">
      {/* Left Sidebar */}
      <div className="absolute left-4 top-4 bottom-4 w-64 z-10 flex flex-col gap-3">
        {/* Title */}
        <div className="px-4 py-3 rounded-xl bg-surface/80 backdrop-blur-xl border border-border">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-mint animate-pulse" />
            <span className="text-sm font-semibold text-white">BudgetBot</span>
          </div>
          <p className="text-[10px] text-zinc-500 mt-1">
            Autonomous AI Agent &middot; Gas-Free Payments
          </p>
        </div>

        {/* Wallet Info */}
        <div className="px-4 py-3 rounded-xl bg-surface/80 backdrop-blur-xl border border-border space-y-3">
          <div className="flex items-center gap-2">
            <Wallet size={14} className="text-zinc-400" />
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">
              Wallet
            </span>
          </div>
          <div className="font-mono text-xs text-zinc-300">
            {truncateAddress(metrics.wallet_address)}
          </div>
        </div>

        {/* Stats */}
        <div className="px-4 py-3 rounded-xl bg-surface/80 backdrop-blur-xl border border-border space-y-3">
          <StatRow
            icon={<DollarSign size={14} className="text-zinc-400" />}
            label="Daily Spend"
            value={`$${metrics.daily_spend.toFixed(4)}`}
            color="text-zinc-200"
          />
          <StatRow
            icon={<TrendingDown size={14} className="text-zinc-400" />}
            label="Budget Remaining"
            value={`$${metrics.budget_remaining.toFixed(2)}`}
            color={
              metrics.budget_remaining < 1 ? "text-crimson" : "text-mint"
            }
          />
          <StatRow
            icon={<PiggyBank size={14} className="text-zinc-400" />}
            label="Total Saved"
            value={`$${metrics.total_saved.toFixed(4)}`}
            color="text-mint"
          />
        </div>

        {/* Status */}
        <div className="px-4 py-3 rounded-xl bg-surface/80 backdrop-blur-xl border border-border">
          <div className="flex items-center gap-2">
            <div
              className={clsx(
                "w-2 h-2 rounded-full",
                metrics.circuit_breaker
                  ? "bg-crimson animate-pulse"
                  : metrics.active_throughput > 0
                  ? "bg-mint animate-pulse"
                  : "bg-zinc-600"
              )}
            />
            <span className="text-[10px] text-zinc-400">
              {metrics.circuit_breaker
                ? "Circuit Breaker Active"
                : metrics.active_throughput > 0
                ? "Processing Requests"
                : "Waiting for requests..."}
            </span>
          </div>
          <div className="mt-2 text-[10px] text-zinc-600 font-mono">
            {metrics.requests_today} requests today
          </div>
        </div>
      </div>

      {/* React Flow Canvas */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.5}
        maxZoom={1.5}
        defaultViewport={{ x: 0, y: 0, zoom: 0.85 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color="#1e1e22"
        />
        <Controls
          showInteractive={false}
          position="bottom-right"
        />
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
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-[10px] text-zinc-500">{label}</span>
      </div>
      <span className={clsx("text-xs font-mono font-medium", color)}>
        {value}
      </span>
    </div>
  );
}
