"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import type { ApiStatus } from "@/lib/types";
import {
  Building2, Shield, Key, Bell, Globe, Users, Save, Check,
  ExternalLink, Copy, Wifi, WifiOff, Plus, Trash2,
} from "lucide-react";

const MOCK_STATUS: ApiStatus = {
  seller: "0x933a...9682", network: "eip155:5042002", chainId: 5042002,
  chainName: "Arc Testnet",
  endpoints: ["/nano", "/hello-world"], explorer: "https://testnet.arcscan.app",
  time: new Date().toISOString(),
};

const TIMEZONES = [
  { region: "Americas", zones: [
    "America/New_York (UTC-5)", "America/Chicago (UTC-6)", "America/Denver (UTC-7)",
    "America/Los_Angeles (UTC-8)", "America/Anchorage (UTC-9)", "Pacific/Honolulu (UTC-10)",
    "America/Toronto (UTC-5)", "America/Vancouver (UTC-8)", "America/Mexico_City (UTC-6)",
    "America/Sao_Paulo (UTC-3)", "America/Argentina/Buenos_Aires (UTC-3)", "America/Bogota (UTC-5)",
  ]},
  { region: "Europe & Africa", zones: [
    "Europe/London (UTC+0)", "Europe/Paris (UTC+1)", "Europe/Berlin (UTC+1)",
    "Europe/Amsterdam (UTC+1)", "Europe/Zurich (UTC+1)", "Europe/Madrid (UTC+1)",
    "Europe/Rome (UTC+1)", "Europe/Stockholm (UTC+1)", "Europe/Moscow (UTC+3)",
    "Europe/Istanbul (UTC+3)", "Africa/Cairo (UTC+2)", "Africa/Lagos (UTC+1)",
    "Africa/Johannesburg (UTC+2)", "Africa/Nairobi (UTC+3)",
  ]},
  { region: "Asia & Pacific", zones: [
    "Asia/Dubai (UTC+4)", "Asia/Kolkata (UTC+5:30)", "Asia/Bangkok (UTC+7)",
    "Asia/Singapore (UTC+8)", "Asia/Hong_Kong (UTC+8)", "Asia/Shanghai (UTC+8)",
    "Asia/Tokyo (UTC+9)", "Asia/Seoul (UTC+9)", "Asia/Jakarta (UTC+7)",
    "Australia/Sydney (UTC+11)", "Australia/Melbourne (UTC+11)", "Australia/Perth (UTC+8)",
    "Pacific/Auckland (UTC+13)", "Pacific/Fiji (UTC+12)",
  ]},
];

interface TeamMember {
  id?: string;
  name: string;
  role: string;
  email: string;
}

function detectTimezone(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    for (const group of TIMEZONES) {
      const match = group.zones.find((z) => z.startsWith(tz));
      if (match) return match;
    }
    return "America/Los_Angeles (UTC-8)";
  } catch {
    return "America/Los_Angeles (UTC-8)";
  }
}

export default function SettingsPage() {
  const fetchStatus = useCallback(() => api.fetchStatus(), []);
  const status = useApi(fetchStatus, MOCK_STATUS, 30000);

  // --- Organization state ---
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [timezone, setTimezone] = useState(detectTimezone);
  const [orgSaved, setOrgSaved] = useState(false);
  const [orgSaving, setOrgSaving] = useState(false);

  // --- Spending Policies state ---
  const [autoApprove, setAutoApprove] = useState("500");
  const [dailyLimit, setDailyLimit] = useState("10.00");
  const [require2fa, setRequire2fa] = useState(true);
  const [agentLimit, setAgentLimit] = useState("1000");
  const [policySaved, setPolicySaved] = useState(false);
  const [policySaving, setPolicySaving] = useState(false);

  // --- Notification state ---
  const [emailFailed, setEmailFailed] = useState(true);
  const [slackAlerts, setSlackAlerts] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [realtimeUpdates, setRealtimeUpdates] = useState(false);
  const [notifSaved, setNotifSaved] = useState(false);

  // --- API Keys state ---
  const [apiKeyValue, setApiKeyValue] = useState("sk-bb-live-a4f8...7d2e");
  const [apiKeySaved, setApiKeySaved] = useState(false);
  const [copied, setCopied] = useState(false);

  // --- Team state ---
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("Viewer");
  const [teamSaved, setTeamSaved] = useState(false);
  const [teamAdding, setTeamAdding] = useState(false);
  const [teamError, setTeamError] = useState("");

  // Load org settings from DB
  useEffect(() => {
    fetch("/api/settings/organization")
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.organization) {
          setCompanyName(data.organization.name || "");
          setIndustry(data.organization.industry || "");
          if (data.organization.timezone) setTimezone(data.organization.timezone);
        }
        orgLoaded.current = true;
      })
      .catch(() => { orgLoaded.current = true; });
  }, []);

  // Load spending policies from DB
  useEffect(() => {
    fetch("/api/settings/policies")
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.policy) {
          setAutoApprove(data.policy.autoApproveThreshold?.toString() || "500");
          setDailyLimit(data.policy.dailyLimit?.toString() || "10.00");
          setRequire2fa(data.policy.require2fa ?? true);
          setAgentLimit(data.policy.agentLimit?.toString() || "1000");
        }
        policyLoaded.current = true;
      })
      .catch(() => { policyLoaded.current = true; });
  }, []);

  const orgLoaded = useRef(false);
  const policyLoaded = useRef(false);
  const orgTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const policyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!orgLoaded.current) return;
    if (orgTimer.current) clearTimeout(orgTimer.current);
    orgTimer.current = setTimeout(() => { saveOrg(); }, 1500);
    return () => { if (orgTimer.current) clearTimeout(orgTimer.current); };
  }, [companyName, industry, timezone]);

  useEffect(() => {
    if (!policyLoaded.current) return;
    if (policyTimer.current) clearTimeout(policyTimer.current);
    policyTimer.current = setTimeout(() => { savePolicy(); }, 1500);
    return () => { if (policyTimer.current) clearTimeout(policyTimer.current); };
  }, [autoApprove, dailyLimit, agentLimit, require2fa]);

  // Load team members from DB
  const loadTeam = () => {
    fetch("/api/settings/team")
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.members) {
          setMembers(data.members.map((m: { id: string; name: string; email: string; role: string }) => ({
            id: m.id, name: m.name || "", email: m.email, role: m.role || "VIEWER",
          })));
        }
      })
      .catch(() => {});
  };

  useEffect(() => { loadTeam(); }, []);

  const flashSave = (setter: (v: boolean) => void) => {
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(apiKeyValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const saveOrg = async () => {
    setOrgSaving(true);
    try {
      const res = await fetch("/api/settings/organization", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: companyName, industry, timezone }),
      });
      if (res.ok) flashSave(setOrgSaved);
    } catch {}
    setOrgSaving(false);
  };

  const savePolicy = async () => {
    setPolicySaving(true);
    try {
      const res = await fetch("/api/settings/policies", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          autoApproveThreshold: parseFloat(autoApprove) || 500,
          dailyLimit: parseFloat(dailyLimit) || 10,
          agentLimit: parseFloat(agentLimit) || 1000,
          require2fa,
        }),
      });
      if (res.ok) flashSave(setPolicySaved);
    } catch {}
    setPolicySaving(false);
  };

  const addMember = async () => {
    if (!newName.trim() || !newEmail.trim()) return;
    setTeamAdding(true);
    setTeamError("");
    try {
      const res = await fetch("/api/settings/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          email: newEmail,
          password: "Welcome123!",
          role: newRole.toUpperCase(),
        }),
      });
      if (res.ok) {
        setNewName("");
        setNewEmail("");
        setNewRole("Viewer");
        loadTeam();
        flashSave(setTeamSaved);
      } else {
        const err = await res.json();
        setTeamError(err.error || "Failed to add member");
      }
    } catch {
      setTeamError("Network error");
    }
    setTeamAdding(false);
  };

  const removeMember = async (member: TeamMember) => {
    if (!member.id) return;
    try {
      const res = await fetch(`/api/settings/team?id=${member.id}`, { method: "DELETE" });
      if (res.ok) loadTeam();
    } catch {}
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-sm text-muted-dark mt-1">Organization configuration, policies, and API access</p>
        </div>
        <div className="flex items-center gap-3">
          {status.isLive ? (
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-success"><Wifi size={12} /> Live</span>
          ) : (
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-muted-dark"><WifiOff size={12} /> Offline</span>
          )}
          <span className="flex items-center gap-1.5 text-[11px] font-medium text-success">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-success" />
            </span>
            All Systems Operational
          </span>
        </div>
      </div>

      {/* Network Config — read-only */}
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
          <span className="text-[9px] px-2 py-0.5 rounded-full bg-white/5 text-muted-dark font-semibold uppercase">Read Only</span>
          {status.isLive && <span className="text-[9px] px-2 py-0.5 rounded-full bg-success/10 text-success font-semibold uppercase">Live from server</span>}
        </div>
        <div className="space-y-4">
          {[
            { label: "Network", value: `${status.data.chainName} (Chain ${status.data.chainId})` },
            { label: "Default Currency", value: "USDC (Native)" },
            { label: "Settlement Protocol", value: "x402" },
            { label: "Gateway", value: "Circle Gateway (gas-free)" },
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
        {/* Organization — editable */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass-bright rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 rounded-lg bg-primary/10">
              <Building2 size={16} className="text-primary-light" />
            </div>
            <h3 className="text-[14px] font-semibold text-foreground">Organization</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-[11px] text-muted-dark mb-1.5 block">Company Name</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-[12px] font-medium text-foreground focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
            <div>
              <label className="text-[11px] text-muted-dark mb-1.5 block">Industry</label>
              <input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-[12px] font-medium text-foreground focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
            <div>
              <label className="text-[11px] text-muted-dark mb-1.5 block">Default Currency</label>
              <div className="w-full bg-bg/50 border border-border rounded-lg px-3 py-2 text-[12px] font-medium text-muted-dark cursor-not-allowed">USDC</div>
            </div>
            <div>
              <label className="text-[11px] text-muted-dark mb-1.5 block">Timezone</label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-[12px] font-medium text-foreground focus:outline-none focus:border-primary/50 transition-colors appearance-none cursor-pointer"
              >
                {TIMEZONES.map((group) => (
                  <optgroup key={group.region} label={group.region}>
                    {group.zones.map((z) => (
                      <option key={z} value={z}>{z}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          </div>
          <button
            onClick={saveOrg}
            disabled={orgSaving}
            className={cn(
              "mt-5 flex items-center gap-2 text-[11px] font-medium px-4 py-2 rounded-lg transition-all",
              orgSaved ? "bg-success/20 text-success" : "bg-primary text-white hover:bg-primary/80",
              orgSaving && "opacity-50"
            )}
          >
            {orgSaved ? <><Check size={12} /> Saved</> : <><Save size={12} /> Save Changes</>}
          </button>
        </motion.div>

        {/* Spending Policies — editable */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-bright rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 rounded-lg bg-primary/10">
              <Shield size={16} className="text-primary-light" />
            </div>
            <h3 className="text-[14px] font-semibold text-foreground">Spending Policies</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-[11px] text-muted-dark mb-1.5 block">Auto-approve Threshold ($)</label>
              <input
                type="number"
                value={autoApprove}
                onChange={(e) => setAutoApprove(e.target.value)}
                className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-[12px] font-medium text-foreground focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
            <div>
              <label className="text-[11px] text-muted-dark mb-1.5 block">Daily Spend Limit ($)</label>
              <input
                type="number"
                step="0.01"
                value={dailyLimit}
                onChange={(e) => setDailyLimit(e.target.value)}
                className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-[12px] font-medium text-foreground focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-muted">Require 2FA for &gt; $10,000</span>
              <button
                onClick={() => setRequire2fa(!require2fa)}
                className={cn(
                  "w-9 h-5 rounded-full relative transition-colors",
                  require2fa ? "bg-primary" : "bg-white/10"
                )}
              >
                <div className={cn(
                  "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform",
                  require2fa ? "left-[18px]" : "left-0.5"
                )} />
              </button>
            </div>
            <div>
              <label className="text-[11px] text-muted-dark mb-1.5 block">AI Agent Autonomous Limit ($)</label>
              <input
                type="number"
                value={agentLimit}
                onChange={(e) => setAgentLimit(e.target.value)}
                className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-[12px] font-medium text-foreground focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
          </div>
          <button
            onClick={savePolicy}
            disabled={policySaving}
            className={cn(
              "mt-5 flex items-center gap-2 text-[11px] font-medium px-4 py-2 rounded-lg transition-all",
              policySaved ? "bg-success/20 text-success" : "bg-primary text-white hover:bg-primary/80",
              policySaving && "opacity-50"
            )}
          >
            {policySaved ? <><Check size={12} /> Saved</> : <><Save size={12} /> Save Changes</>}
          </button>
        </motion.div>

        {/* Notifications — editable */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-bright rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 rounded-lg bg-primary/10">
              <Bell size={16} className="text-primary-light" />
            </div>
            <h3 className="text-[14px] font-semibold text-foreground">Notifications</h3>
          </div>
          <div className="space-y-4">
            {[
              { label: "Email on Failed Transactions", value: emailFailed, set: setEmailFailed },
              { label: "Slack Alerts for Anomalies", value: slackAlerts, set: setSlackAlerts },
              { label: "Weekly Digest", value: weeklyDigest, set: setWeeklyDigest },
              { label: "Real-time Agent Updates", value: realtimeUpdates, set: setRealtimeUpdates },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-[12px] text-muted">{item.label}</span>
                <button
                  onClick={() => item.set(!item.value)}
                  className={cn(
                    "w-9 h-5 rounded-full relative transition-colors",
                    item.value ? "bg-primary" : "bg-white/10"
                  )}
                >
                  <div className={cn(
                    "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform",
                    item.value ? "left-[18px]" : "left-0.5"
                  )} />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() => flashSave(setNotifSaved)}
            className={cn(
              "mt-5 flex items-center gap-2 text-[11px] font-medium px-4 py-2 rounded-lg transition-all",
              notifSaved ? "bg-success/20 text-success" : "bg-primary text-white hover:bg-primary/80"
            )}
          >
            {notifSaved ? <><Check size={12} /> Saved</> : <><Save size={12} /> Save Changes</>}
          </button>
        </motion.div>

        {/* API Keys — editable */}
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
          <div className="space-y-4">
            <div>
              <label className="text-[11px] text-muted-dark mb-1.5 block">Live API Key</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={apiKeyValue}
                  onChange={(e) => setApiKeyValue(e.target.value)}
                  className="flex-1 bg-bg border border-border rounded-lg px-3 py-2 text-[12px] font-medium text-foreground font-mono focus:outline-none focus:border-primary/50 transition-colors"
                />
                <button
                  onClick={handleCopy}
                  className={cn(
                    "flex items-center gap-1 text-[10px] px-3 py-2 rounded-lg border border-border transition-all",
                    copied ? "text-success border-success/30" : "text-muted hover:text-foreground hover:border-primary/30"
                  )}
                >
                  {copied ? <><Check size={10} /> Copied</> : <><Copy size={10} /> Copy</>}
                </button>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-5">
            <button
              onClick={() => flashSave(setApiKeySaved)}
              className={cn(
                "flex items-center gap-2 text-[11px] font-medium px-4 py-2 rounded-lg transition-all",
                apiKeySaved ? "bg-success/20 text-success" : "bg-primary text-white hover:bg-primary/80"
              )}
            >
              {apiKeySaved ? <><Check size={12} /> Saved</> : <><Save size={12} /> Save Key</>}
            </button>
            <button className="text-[11px] font-medium px-4 py-2 rounded-lg border border-border text-muted hover:text-foreground hover:border-primary/30 transition-colors">
              Generate New Key
            </button>
            <button className="flex items-center gap-1 text-[11px] font-medium px-4 py-2 rounded-lg border border-border text-muted hover:text-foreground hover:border-primary/30 transition-colors">
              <ExternalLink size={10} /> Docs
            </button>
          </div>
        </motion.div>
      </div>

      {/* Team Members — editable with add/remove */}
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
        <div className="space-y-3 mb-5">
          {members.map((member) => (
            <div key={member.email} className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-border group">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-[12px] font-semibold text-primary-light">
                {member.name.split(" ").map((n) => n[0]).join("")}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[13px] font-medium text-foreground">{member.name}</span>
                <span className="block text-[11px] text-muted-dark truncate">{member.email}</span>
              </div>
              <select
                value={member.role}
                onChange={(e) => setMembers((prev) => prev.map((m) => m.email === member.email ? { ...m, role: e.target.value } : m))}
                className="text-[10px] font-semibold px-2 py-1 rounded-full bg-primary/10 text-primary-light border-none focus:outline-none cursor-pointer appearance-none text-center"
              >
                <option value="Admin">Admin</option>
                <option value="Finance">Finance</option>
                <option value="Viewer">Viewer</option>
              </select>
              <button
                onClick={() => removeMember(member)}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-danger/10 text-muted-dark hover:text-danger transition-all"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>

        {/* Add member form */}
        <div className="p-4 rounded-lg bg-white/[0.02] border border-border border-dashed">
          <span className="text-[11px] text-muted-dark mb-3 block">Add Team Member</span>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <input
              type="text"
              placeholder="Full name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="bg-bg border border-border rounded-lg px-3 py-2 text-[12px] text-foreground placeholder-muted-dark focus:outline-none focus:border-primary/50 transition-colors"
            />
            <input
              type="email"
              placeholder="Email address"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="bg-bg border border-border rounded-lg px-3 py-2 text-[12px] text-foreground placeholder-muted-dark focus:outline-none focus:border-primary/50 transition-colors"
            />
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className="bg-bg border border-border rounded-lg px-3 py-2 text-[12px] text-foreground focus:outline-none focus:border-primary/50 transition-colors appearance-none cursor-pointer"
            >
              <option value="Admin">Admin</option>
              <option value="Finance">Finance</option>
              <option value="Viewer">Viewer</option>
            </select>
            <button
              onClick={addMember}
              disabled={!newName.trim() || !newEmail.trim() || teamAdding}
              className="flex items-center justify-center gap-1.5 text-[11px] font-medium px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/80 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Plus size={12} /> {teamAdding ? "Adding..." : "Add"}
            </button>
          </div>
          {teamError && <p className="text-[11px] text-danger mt-2">{teamError}</p>}
        </div>

        {teamSaved && (
          <div className="mt-3 flex items-center gap-2 text-[11px] font-medium text-success">
            <Check size={12} /> Team updated
          </div>
        )}
      </motion.div>
    </div>
  );
}
