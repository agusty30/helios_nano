"use client";

import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { cn, timeAgo } from "@/lib/utils";
import { api } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { useToast } from "@/components/ui/Toast";
import type { CanvasMetrics, AgentRouteResponse, ExecutionLogRecord } from "@/lib/types";
import {
  Send, Sparkles, CheckCircle2, Clock, Loader2, Bot, XCircle, XOctagon,
  CreditCard, ShoppingCart, Landmark, Wallet,
  Play, ListChecks, ChevronDown, ChevronUp, Terminal,
  AlertTriangle, Info, AlertCircle, Database, Globe,
} from "lucide-react";

const agentIcon: Record<string, React.FC<{ size?: number; className?: string }>> = {
  "Payment Agent": CreditCard,
  "Procurement Agent": ShoppingCart,
  "Treasury Agent": Landmark,
  "Budget Agent": Wallet,
  "API Cost Agent": Globe,
  "Reporting Agent": ListChecks,
  "Optimization Agent": Sparkles,
  "Notification Agent": AlertCircle,
};

const MOCK_CANVAS: CanvasMetrics = {
  wallet_address: "0x...", usdc_balance: 7.16, active_throughput: 0,
  last_route: "cheap_tier", daily_spend: 2.84, total_saved: 42.38,
  requests_today: 1847, budget_remaining: 7.16, circuit_breaker: false, chain: "Arc Testnet (5042002)",
};

const commandSuggestions = [
  "Reduce cloud spending by 15%",
  "Pay all approved invoices",
  "Optimize marketing budget for Q3",
  "Find and cancel duplicate subscriptions",
];

interface DbAgent {
  id: string;
  name: string;
  type: string;
  status: string;
  config: { icon?: string; description?: string };
}

interface TaskStep {
  step: number;
  action: string;
  status: string;
  detail: string;
}

interface TaskRecord {
  id: string;
  command: string;
  commandType: string;
  status: string;
  priority: string;
  progress: number;
  retryCount: number;
  correlationId: string | null;
  agentName: string;
  steps: TaskStep[];
  result: Record<string, unknown> | null;
  executionTimeMs: number | null;
  createdAt: string;
  completedAt: string | null;
}

const statusConfig: Record<string, { icon: React.FC<{ size?: number; className?: string }>; color: string; bg: string; label: string }> = {
  PENDING:   { icon: Clock,        color: "text-muted-dark",    bg: "bg-white/5",      label: "Queued" },
  RUNNING:   { icon: Loader2,      color: "text-primary-light", bg: "bg-primary/10",   label: "Running" },
  COMPLETED: { icon: CheckCircle2, color: "text-success",       bg: "bg-success/10",   label: "Success" },
  FAILED:    { icon: XCircle,      color: "text-danger",        bg: "bg-danger/10",    label: "Failed" },
  CANCELLED: { icon: XOctagon,     color: "text-warning",       bg: "bg-warning/10",   label: "Cancelled" },
};

const severityIcon: Record<string, React.FC<{ size?: number; className?: string }>> = {
  info: Info,
  warn: AlertTriangle,
  error: XCircle,
};
const severityColor: Record<string, string> = {
  info: "text-primary-light",
  warn: "text-warning",
  error: "text-danger",
};

export default function MissionControlPage() {
  const [command, setCommand] = useState("");
  const [sending, setSending] = useState(false);
  const [responses, setResponses] = useState<AgentRouteResponse[]>([]);
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [taskLogs, setTaskLogs] = useState<Record<string, ExecutionLogRecord[]>>({});
  const [mode, setMode] = useState<"agent" | "task">("task");
  const [dbAgents, setDbAgents] = useState<DbAgent[]>([]);
  const { toast } = useToast();

  const fetchMetrics = useCallback(() => api.fetchCanvasMetrics(), []);
  const metrics = useApi(fetchMetrics, MOCK_CANVAS, 10000);

  useEffect(() => {
    const loadTasks = () => {
      fetch("/api/tasks?limit=20")
        .then((r) => (r.ok ? r.json() : { tasks: [] }))
        .then((data) => setTasks(data.tasks || []))
        .catch(() => {});
    };
    loadTasks();
    fetch("/api/agents")
      .then((r) => (r.ok ? r.json() : { agents: [] }))
      .then((data) => setDbAgents(data.agents || []))
      .catch(() => {});
    const interval = setInterval(loadTasks, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadTaskLogs = async (taskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/logs`);
      const data = await res.json();
      setTaskLogs((prev) => ({ ...prev, [taskId]: data.logs || [] }));
    } catch {}
  };

  const handleSubmit = async () => {
    if (!command.trim() || sending) return;
    setSending(true);

    if (mode === "task") {
      try {
        const res = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ command }),
        });
        const data = await res.json();
        if (data.task) {
          setTasks((prev) => [data.task, ...prev]);
          setExpandedTask(data.task.id);
          toast("Task executed", "success");
        }
      } catch {
        toast("Task execution failed", "error");
      }
    } else {
      const result = await api.postAgentRoute(command, "low");
      if (result) {
        setResponses((prev) => [result, ...prev]);
        toast("Agent response received", "success");
      }
    }

    setSending(false);
    setCommand("");
  };

  const toggleExpand = (taskId: string) => {
    if (expandedTask === taskId) {
      setExpandedTask(null);
    } else {
      setExpandedTask(taskId);
      if (!taskLogs[taskId]) loadTaskLogs(taskId);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mission Control</h1>
          <p className="text-sm text-muted-dark mt-1">Command your AI agents — natural language operations center</p>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-medium">
          <span className="flex items-center gap-1.5 text-success">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-success" />
            </span>
            All Systems Operational
          </span>
        </div>
      </div>

      {/* Command input */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-bright rounded-xl p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Sparkles size={16} className="text-primary-light" />
            <span className="text-sm font-semibold text-foreground">AI Command Center</span>
          </div>
          <div className="flex items-center gap-1 bg-surface-bright rounded-lg p-0.5">
            <button
              onClick={() => setMode("task")}
              className={cn("px-3 py-1 rounded-md text-[11px] font-medium transition-colors",
                mode === "task" ? "bg-primary text-white" : "text-muted-dark hover:text-foreground")}
            >
              <Terminal size={10} className="inline mr-1" /> Task
            </button>
            <button
              onClick={() => setMode("agent")}
              className={cn("px-3 py-1 rounded-md text-[11px] font-medium transition-colors",
                mode === "agent" ? "bg-primary text-white" : "text-muted-dark hover:text-foreground")}
            >
              <Bot size={10} className="inline mr-1" /> Agent
            </button>
          </div>
        </div>
        <div className="relative">
          <input
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder={mode === "task" ? "Run a task: 'run tests', 'check status', 'optimize costs'..." : "Tell HeliOS what to do..."}
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
          {(mode === "task"
            ? ["Run tests", "Check status", "Show API costs", "List agents", "Optimize costs", "Create vendor OpenAI", "Generate report"]
            : commandSuggestions
          ).map((s) => (
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

      {/* Execution Timeline — real task data */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {/* Task history / timeline */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-bright rounded-xl p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <ListChecks size={16} className="text-primary-light" />
              <h3 className="text-sm font-semibold text-foreground">Execution Timeline</h3>
              <span className="text-[10px] text-muted-dark ml-auto">{tasks.length} executions</span>
            </div>

            {tasks.length === 0 ? (
              <div className="text-center py-12">
                <Terminal size={24} className="text-muted-dark mx-auto mb-2" />
                <p className="text-[13px] text-muted-dark">No tasks executed yet. Run a command above to get started.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {tasks.map((task) => {
                  const config = statusConfig[task.status] || statusConfig.PENDING;
                  const StatusIcon = config.icon;
                  const isExpanded = expandedTask === task.id;
                  const AgentIcon = agentIcon[task.agentName] || Bot;
                  const logs = taskLogs[task.id] || [];

                  return (
                    <div key={task.id} className="rounded-lg bg-white/[0.02] border border-border overflow-hidden">
                      <button
                        onClick={() => toggleExpand(task.id)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.02] transition-colors"
                      >
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", config.bg)}>
                          <AgentIcon size={14} className={config.color} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-[12px] font-medium text-foreground block truncate">{task.command}</span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={cn("text-[9px] font-semibold uppercase", config.color)}>{config.label}</span>
                            <span className="text-[9px] text-muted-dark font-mono">{task.commandType}</span>
                            {task.priority !== "normal" && (
                              <span className="text-[9px] text-warning font-semibold uppercase">{task.priority}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {task.executionTimeMs !== null && (
                            <span className="text-[10px] text-muted-dark font-mono">{task.executionTimeMs}ms</span>
                          )}
                          <StatusIcon size={14} className={cn(config.color, task.status === "RUNNING" && "animate-spin")} />
                          <span className="text-[10px] text-muted-dark">{timeAgo(new Date(task.createdAt))}</span>
                          {isExpanded ? <ChevronUp size={12} className="text-muted-dark" /> : <ChevronDown size={12} className="text-muted-dark" />}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="px-4 pb-4 border-t border-border/50">
                          {/* Progress bar */}
                          {task.status === "RUNNING" && (
                            <div className="mt-3 mb-2">
                              <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${task.progress}%` }} />
                              </div>
                              <span className="text-[9px] text-muted-dark mt-0.5 block">{task.progress}% complete</span>
                            </div>
                          )}

                          {/* Metadata row */}
                          <div className="flex items-center gap-4 mt-3 text-[10px] text-muted-dark">
                            <span>Agent: <strong className="text-foreground">{task.agentName}</strong></span>
                            {task.correlationId && <span className="font-mono">CID: {task.correlationId.slice(0, 10)}...</span>}
                            {task.retryCount > 0 && <span className="text-warning">Retries: {task.retryCount}</span>}
                            {task.completedAt && <span>Completed: {new Date(task.completedAt).toLocaleTimeString()}</span>}
                          </div>

                          {/* Steps */}
                          <div className="mt-3 space-y-1.5">
                            {(task.steps as TaskStep[]).map((step) => (
                              <div key={step.step} className="flex items-start gap-2">
                                <div className={cn("mt-0.5 w-1.5 h-1.5 rounded-full shrink-0",
                                  step.status === "completed" ? "bg-success" : step.status === "failed" ? "bg-danger" : "bg-primary-light")} />
                                <span className="text-[11px] text-muted">{step.detail}</span>
                              </div>
                            ))}
                          </div>

                          {/* Execution logs */}
                          {logs.length > 0 && (
                            <div className="mt-3 border-t border-border/30 pt-3">
                              <div className="flex items-center gap-1.5 mb-2">
                                <Database size={11} className="text-muted-dark" />
                                <span className="text-[10px] font-semibold text-muted-dark uppercase">Execution Logs</span>
                              </div>
                              <div className="space-y-1 max-h-[200px] overflow-y-auto">
                                {logs.map((log) => {
                                  const SevIcon = severityIcon[log.severity] || Info;
                                  return (
                                    <div key={log.id} className="flex items-start gap-2 text-[10px]">
                                      <SevIcon size={10} className={cn("mt-0.5 shrink-0", severityColor[log.severity] || "text-muted-dark")} />
                                      <span className="text-muted-dark font-mono shrink-0">{new Date(log.createdAt).toLocaleTimeString()}</span>
                                      <span className="text-muted-dark shrink-0">[{log.component}]</span>
                                      <span className="text-muted truncate">{log.detail}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Result */}
                          {task.result && (
                            <div className="mt-3 p-2 rounded-md bg-bg text-[10px] font-mono text-muted-dark max-h-[150px] overflow-y-auto">
                              <pre className="whitespace-pre-wrap">{JSON.stringify(task.result, null, 2)}</pre>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>

          {/* Live LLM responses */}
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
                      <span className="text-[10px] text-muted-dark font-mono">{r.route} · {r.cost.toFixed(4)} USDC</span>
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-success/10 text-success font-semibold uppercase">{r.settlement}</span>
                    </div>
                    <p className="text-[13px] text-muted leading-relaxed">{r.response}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Active agents sidebar */}
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
                  <div><span className="text-muted-dark">Spend Today</span><br/><span className="text-foreground font-semibold">{metrics.data.daily_spend.toFixed(4)} USDC</span></div>
                  <div><span className="text-muted-dark">Saved</span><br/><span className="text-success font-semibold">{metrics.data.total_saved.toFixed(4)} USDC</span></div>
                </div>
              </div>
            )}
            <div className="space-y-3">
              {dbAgents.map((a) => {
                const Icon = agentIcon[a.name] || Bot;
                const isActive = a.status === "active";
                return (
                  <div key={a.id} className="p-3 rounded-lg bg-white/[0.02] border border-border hover:border-primary/20 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon size={14} className="text-primary-light" />
                      <span className="text-[12px] font-medium text-foreground flex-1">{a.name}</span>
                      {isActive ? (
                        <div className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
                        </div>
                      ) : (
                        <span className="inline-flex rounded-full h-2 w-2 bg-muted-dark" />
                      )}
                    </div>
                    <p className="text-[11px] text-muted truncate capitalize">{a.type} agent</p>
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-dark">
                      <span className={isActive ? "text-success" : "text-muted-dark"}>{a.status}</span>
                    </div>
                  </div>
                );
              })}
              {dbAgents.length === 0 && (
                <p className="text-[11px] text-muted-dark text-center py-4">No agents configured</p>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
