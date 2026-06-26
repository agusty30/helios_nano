"use client";

import { useCallback } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import type { ApiStatus } from "@/lib/types";
import {
  Building2, Shield, Key, Bell, Globe, Users,
  ExternalLink, Copy, Wifi, WifiOff,
} from "lucide-react";

const MOCK_STATUS: ApiStatus = {
  seller: "0x933a...9682", network: "eip155:5042002", chainId: 5042002,
  chainName: "Arc Testnet", prices: { nano: "$0.000001", helloWorld: "$0.01" },
  endpoints: ["/nano", "/hello-world"], explorer: "https://testnet.arcscan.app",
  time: new Date().toISOString(),
};

const sections = [
  {
    title: "Organization",
    icon: Building2,
    fields: [
      { label: "Company Name", value: "Acme Corp", type: "text" },
      { label: "Industry", value: "Technology / SaaS", type: "text" },
      { label: "Default Currency", value: "USDC", type: "select" },
      { label: "Timezone", value: "UTC-8 (Pacific)", type: "select" },
    ],
  },
  {
    title: "Spending Policies",
    icon: Shield,
    fields: [
      { label: "Auto-approve Threshold", value: "$500", type: "text" },
      { label: "Daily Spend Limit", value: "$10.00", type: "text" },
      { label: "Require 2FA for > $10,000", value: true, type: "toggle" },
      { label: "AI Agent Autonomous Limit", value: "$1,000", type: "text" },
    ],
  },
  {
    title: "Notifications",
    icon: Bell,
    fields: [
      { label: "Email on Failed Transactions", value: true, type: "toggle" },
      { label: "Slack Alerts for Anomalies", value: true, type: "toggle" },
      { label: "Weekly Digest", value: true, type: "toggle" },
      { label: "Real-time Agent Updates", value: false, type: "toggle" },
    ],
  },
];

const apiKey = "sk-bb-live-a4f8...7d2e";

export default function SettingsPage() {
  const fetchStatus = useCallback(() => api.fetchStatus(), []);
  const status = useApi(fetchStatus, MOCK_STATUS, 30000);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-sm text-muted-dark mt-1">Organization configuration, policies, and API access</p>
        </div>
        {status.isLive ? (
          <span className="flex items-center gap-1.5 text-[11px] font-medium text-success"><Wifi size={12} /> Live</span>
        ) : (
          <span className="flex items-center gap-1.5 text-[11px] font-medium text-muted-dark"><WifiOff size={12} /> Demo</span>
        )}
      </div>

      {/* Live network config from backend */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-bright rounded-xl p-6"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-lg bg-primary/10">
            <Globe size={16} className="text-primary-light" />
          </div>
          <h3 className="text-[14px] font-semibold text-foreground">Network Configuration</h3>
          {status.isLive && <span className="text-[9px] px-2 py-0.5 rounded-full bg-success/10 text-success font-semibold uppercase">Live from server</span>}
        </div>
        <div className="space-y-4">
          {[
            { label: "Network", value: `${status.data.chainName} (Chain ${status.data.chainId})` },
            { label: "Seller Address", value: status.data.seller },
            { label: "Gas Token", value: "USDC (Native)" },
            { label: "Settlement Protocol", value: "x402 + EIP-3009" },
            { label: "Gateway", value: "Circle Gateway (gas-free)" },
            { label: "Nano Price", value: status.data.prices.nano },
            { label: "Hello World Price", value: status.data.prices.helloWorld },
            { label: "Explorer", value: status.data.explorer },
          ].map((field) => (
            <div key={field.label} className="flex items-center justify-between">
              <span className="text-[12px] text-muted">{field.label}</span>
              <span className="text-[12px] font-medium text-foreground font-mono">{field.value}</span>
            </div>
          ))}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sections.map((section, i) => {
          const Icon = section.icon;
          return (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 + i * 0.05 }}
              className="glass-bright rounded-xl p-6"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Icon size={16} className="text-primary-light" />
                </div>
                <h3 className="text-[14px] font-semibold text-foreground">{section.title}</h3>
              </div>
              <div className="space-y-4">
                {section.fields.map((field) => (
                  <div key={field.label} className="flex items-center justify-between">
                    <span className="text-[12px] text-muted">{field.label}</span>
                    {field.type === "toggle" ? (
                      <div className={cn(
                        "w-9 h-5 rounded-full relative cursor-pointer transition-colors",
                        field.value ? "bg-primary" : "bg-white/10"
                      )}>
                        <div className={cn(
                          "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform",
                          field.value ? "left-[18px]" : "left-0.5"
                        )} />
                      </div>
                    ) : (
                      <span className="text-[12px] font-medium text-foreground font-mono">{String(field.value)}</span>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* API Keys */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-bright rounded-xl p-6"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-lg bg-primary/10">
            <Key size={16} className="text-primary-light" />
          </div>
          <h3 className="text-[14px] font-semibold text-foreground">API Keys</h3>
        </div>
        <div className="p-4 rounded-lg bg-white/[0.02] border border-border mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-muted-dark">Live API Key</span>
            <div className="flex gap-2">
              <button className="flex items-center gap-1 text-[10px] text-muted hover:text-foreground transition-colors"><Copy size={10} /> Copy</button>
              <button className="flex items-center gap-1 text-[10px] text-muted hover:text-foreground transition-colors"><ExternalLink size={10} /> Docs</button>
            </div>
          </div>
          <code className="text-[13px] font-mono text-foreground">{apiKey}</code>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-[11px] font-medium px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/80 transition-colors">Generate New Key</button>
          <button className="text-[11px] font-medium px-4 py-2 rounded-lg border border-border text-muted hover:text-foreground hover:border-primary/30 transition-colors">Manage Webhooks</button>
        </div>
      </motion.div>

      {/* Team */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="glass-bright rounded-xl p-6"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-lg bg-primary/10">
            <Users size={16} className="text-primary-light" />
          </div>
          <h3 className="text-[14px] font-semibold text-foreground">Team Members</h3>
        </div>
        <div className="space-y-3">
          {[
            { name: "Sarah Chen", role: "Admin", email: "sarah@acmecorp.com" },
            { name: "Alex Rivera", role: "Finance", email: "alex@acmecorp.com" },
            { name: "Jordan Kim", role: "Viewer", email: "jordan@acmecorp.com" },
          ].map((member) => (
            <div key={member.email} className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-border">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-[12px] font-semibold text-primary-light">
                {member.name.split(" ").map((n) => n[0]).join("")}
              </div>
              <div className="flex-1">
                <span className="text-[13px] font-medium text-foreground">{member.name}</span>
                <span className="block text-[11px] text-muted-dark">{member.email}</span>
              </div>
              <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-primary/10 text-primary-light uppercase">{member.role}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
