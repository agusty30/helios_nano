"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { cn, formatCurrency } from "@/lib/utils";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import {
  DollarSign, TrendingUp, Zap, AlertTriangle, Plus,
  Server, Activity, ExternalLink,
} from "lucide-react";
import type { ApiCostsResponse } from "@/lib/types";

const PROVIDER_COLORS: Record<string, string> = {
  OpenAI: "#10A37F",
  Anthropic: "#D97706",
  Google: "#4285F4",
  AWS: "#FF9900",
  OpenRouter: "#8B5CF6",
  Cohere: "#39D6A0",
  Mistral: "#FF6B35",
};

function getProviderColor(provider: string, idx: number) {
  return PROVIDER_COLORS[provider] || ["#6366F1", "#EC4899", "#14B8A6", "#F59E0B", "#8B5CF6"][idx % 5];
}

export default function ApiCostsPage() {
  const [data, setData] = useState<ApiCostsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [showAddService, setShowAddService] = useState(false);
  const [newService, setNewService] = useState({ name: "", provider: "", monthlyBudget: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/api-costs?days=${days}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [days]);

  const handleAddService = async () => {
    if (!newService.name || !newService.provider) return;
    setSaving(true);
    try {
      const res = await fetch("/api/api-services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newService.name,
          provider: newService.provider,
          monthlyBudget: parseFloat(newService.monthlyBudget) || 0,
        }),
      });
      if (res.ok) {
        setShowAddService(false);
        setNewService({ name: "", provider: "", monthlyBudget: "" });
        const r = await fetch(`/api/api-costs?days=${days}`);
        if (r.ok) setData(await r.json());
      }
    } finally {
      setSaving(false);
    }
  };

  const chartData = data
    ? Object.entries(data.dailyCosts)
        .map(([date, cost]) => ({ date: date.slice(5), cost: +cost.toFixed(4) }))
        .sort((a, b) => a.date.localeCompare(b.date))
    : [];

  const providerData = data
    ? Object.entries(data.byProvider).map(([name, v], i) => ({
        name,
        value: +v.cost.toFixed(4),
        requests: v.requests,
        tokens: v.tokens,
        color: getProviderColor(name, i),
      }))
    : [];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-white/5 rounded animate-pulse" />
          <div className="h-9 w-32 bg-white/5 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass rounded-xl p-5 space-y-3">
              <div className="h-4 w-24 bg-white/5 rounded animate-pulse" />
              <div className="h-7 w-20 bg-white/5 rounded animate-pulse" />
            </div>
          ))}
        </div>
        <div className="glass rounded-xl p-6 h-72 animate-pulse" />
      </div>
    );
  }

  const summary = data?.summary;
  const kpis = [
    { label: "Total Spend", value: formatCurrency(summary?.totalCost || 0), icon: DollarSign, color: "text-primary-light" },
    { label: "Daily Average", value: formatCurrency(summary?.dailyAvg || 0), icon: TrendingUp, color: "text-success" },
    { label: "Projected Monthly", value: formatCurrency(summary?.projectedMonthly || 0), icon: Zap, color: "text-warning" },
    { label: "Total Requests", value: (summary?.totalRequests || 0).toLocaleString(), icon: Activity, color: "text-accent" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">API Costs</h1>
          <p className="text-sm text-muted mt-0.5">Track and optimize your AI API spending</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="bg-white/5 border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value={7}>7 days</option>
            <option value={14}>14 days</option>
            <option value={30}>30 days</option>
            <option value={90}>90 days</option>
          </select>
          <button
            onClick={() => setShowAddService(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/20 text-primary-light text-sm font-medium hover:bg-primary/30 transition-colors"
          >
            <Plus size={14} /> Add Service
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass rounded-xl p-5"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted uppercase tracking-wide">{kpi.label}</span>
              <kpi.icon size={16} className={kpi.color} />
            </div>
            <span className="text-xl font-bold text-foreground">{kpi.value}</span>
          </motion.div>
        ))}
      </div>

      {/* Budget Alerts */}
      {data?.alerts && data.alerts.length > 0 && (
        <div className="glass rounded-xl p-4 border border-warning/30 bg-warning/5">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-warning" />
            <span className="text-sm font-semibold text-warning">Budget Alerts</span>
          </div>
          <div className="space-y-1.5">
            {data.alerts.map((alert) => (
              <div key={alert.id} className="flex items-center justify-between text-xs text-muted">
                <span>{alert.name}</span>
                <span className="text-warning font-medium">{alert.pct.toFixed(0)}% of {formatCurrency(alert.limit)} limit</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Daily Spending Chart */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-xl p-5 lg:col-span-2"
        >
          <h3 className="text-sm font-semibold text-foreground mb-4">Daily Spending</h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#6B7280" }} />
                <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  contentStyle={{ background: "#1A1F2E", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }}
                  labelStyle={{ color: "#9CA3AF" }}
                  formatter={(value: number) => [`$${value.toFixed(4)}`, "Cost"]}
                />
                <Area type="monotone" dataKey="cost" stroke="#6366F1" fill="url(#costGradient)" strokeWidth={2} />
                <defs>
                  <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366F1" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-60 flex items-center justify-center text-sm text-muted">
              No usage data yet. Add API services and record usage to see charts.
            </div>
          )}
        </motion.div>

        {/* Provider Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="glass rounded-xl p-5"
        >
          <h3 className="text-sm font-semibold text-foreground mb-4">By Provider</h3>
          {providerData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={providerData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={65}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {providerData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "#1A1F2E", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }}
                    formatter={(value: number) => [`$${value.toFixed(4)}`, "Cost"]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {providerData.map((p) => (
                  <div key={p.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                      <span className="text-muted">{p.name}</span>
                    </div>
                    <span className="text-foreground font-medium">${p.value.toFixed(4)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-40 flex items-center justify-center text-sm text-muted">No data yet</div>
          )}
        </motion.div>
      </div>

      {/* API Services Table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass rounded-xl p-5"
      >
        <h3 className="text-sm font-semibold text-foreground mb-4">Connected API Services</h3>
        {data?.services && data.services.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted uppercase tracking-wide border-b border-border">
                  <th className="pb-3 pr-4">Service</th>
                  <th className="pb-3 pr-4">Provider</th>
                  <th className="pb-3 pr-4">Budget</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3">Usage Records</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.services.map((svc) => (
                  <tr key={svc.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <Server size={14} className="text-muted-dark" />
                        <span className="text-foreground font-medium">{svc.name}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-muted">{svc.provider}</td>
                    <td className="py-3 pr-4 text-foreground">{svc.monthlyBudget > 0 ? formatCurrency(svc.monthlyBudget) : "—"}</td>
                    <td className="py-3 pr-4">
                      <span className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                        svc.status === "active" ? "bg-success/10 text-success" : "bg-muted/10 text-muted"
                      )}>
                        <div className={cn("w-1.5 h-1.5 rounded-full", svc.status === "active" ? "bg-success" : "bg-muted")} />
                        {svc.status}
                      </span>
                    </td>
                    <td className="py-3 text-muted">{svc._count?.usages || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center">
            <Server size={32} className="mx-auto text-muted-dark mb-3" />
            <p className="text-sm text-muted mb-1">No API services connected</p>
            <p className="text-xs text-muted-dark">Add your first API service to start tracking costs</p>
            <button
              onClick={() => setShowAddService(true)}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary/20 text-primary-light text-sm font-medium hover:bg-primary/30 transition-colors"
            >
              <Plus size={14} /> Add API Service
            </button>
          </div>
        )}
      </motion.div>

      {/* Vendors */}
      {data?.vendors && data.vendors.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="glass rounded-xl p-5"
        >
          <h3 className="text-sm font-semibold text-foreground mb-4">Vendors</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.vendors.map((vendor) => (
              <div key={vendor.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-border hover:border-primary/30 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary-light text-xs font-bold">
                  {vendor.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-foreground truncate block">{vendor.name}</span>
                  <span className="text-xs text-muted">{vendor.category}</span>
                </div>
                {vendor.website && (
                  <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="text-muted hover:text-primary-light transition-colors">
                    <ExternalLink size={14} />
                  </a>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Add Service Modal */}
      {showAddService && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowAddService(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-2xl p-6 w-full max-w-md space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-foreground">Add API Service</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted block mb-1">Service Name</label>
                <input
                  type="text"
                  value={newService.name}
                  onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                  placeholder="e.g. GPT-4 Production"
                  className="w-full bg-white/5 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-dark focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-xs text-muted block mb-1">Provider</label>
                <select
                  value={newService.provider}
                  onChange={(e) => setNewService({ ...newService, provider: e.target.value })}
                  className="w-full bg-white/5 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Select provider...</option>
                  <option value="OpenAI">OpenAI</option>
                  <option value="Anthropic">Anthropic</option>
                  <option value="Google">Google AI</option>
                  <option value="AWS">AWS Bedrock</option>
                  <option value="OpenRouter">OpenRouter</option>
                  <option value="Cohere">Cohere</option>
                  <option value="Mistral">Mistral AI</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted block mb-1">Monthly Budget (USD)</label>
                <input
                  type="number"
                  value={newService.monthlyBudget}
                  onChange={(e) => setNewService({ ...newService, monthlyBudget: e.target.value })}
                  placeholder="0.00"
                  className="w-full bg-white/5 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-dark focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowAddService(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-border text-sm text-muted hover:text-foreground hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddService}
                disabled={saving || !newService.name || !newService.provider}
                className="flex-1 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/80 disabled:opacity-50 transition-colors"
              >
                {saving ? "Adding..." : "Add Service"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
