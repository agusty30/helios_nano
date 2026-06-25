import type { Transaction, Agent, Approval, Budget, ActivityEvent, SpendingData, CostBreakdown, TimelineEvent, TractionMetrics } from "./types";

export const kpis = [
  { label: "Monthly Spend", value: "$284,520", change: -8.2, icon: "DollarSign" },
  { label: "Budget Utilization", value: "76.4%", change: 3.1, icon: "Target" },
  { label: "Autonomous Txns", value: "1,847", change: 24.6, icon: "Bot" },
  { label: "Savings Generated", value: "$42,380", change: 18.3, icon: "PiggyBank" },
  { label: "Pending Approvals", value: "12", change: -33.0, icon: "Clock" },
  { label: "Active Agents", value: "4/4", change: 0, icon: "Activity" },
];

export const tractionMetrics: TractionMetrics = {
  totalAutonomousPayments: 14_892,
  avgTransactionSize: 0.0042,
  budgetUtilizationEfficiency: 94.2,
  costPerTaskCompleted: 0.0018,
};

export const transactions: Transaction[] = [
  { id: "TXN-001", vendor: "AWS", amount: 12450.00, status: "completed", agent: "Budget Agent", category: "Cloud", timestamp: "2 min ago" },
  { id: "TXN-002", vendor: "Figma", amount: 1200.00, status: "completed", agent: "Procurement Agent", category: "SaaS", timestamp: "18 min ago" },
  { id: "TXN-003", vendor: "Google Cloud", amount: 8920.00, status: "pending", agent: "Payment Agent", category: "Cloud", timestamp: "1 hr ago" },
  { id: "TXN-004", vendor: "Notion", amount: 960.00, status: "completed", agent: "Procurement Agent", category: "SaaS", timestamp: "2 hr ago" },
  { id: "TXN-005", vendor: "Datadog", amount: 3400.00, status: "completed", agent: "Budget Agent", category: "DevOps", timestamp: "3 hr ago" },
  { id: "TXN-006", vendor: "Linear", amount: 480.00, status: "completed", agent: "Procurement Agent", category: "SaaS", timestamp: "5 hr ago" },
  { id: "TXN-007", vendor: "Vercel", amount: 1890.00, status: "failed", agent: "Payment Agent", category: "Cloud", timestamp: "6 hr ago" },
  { id: "TXN-008", vendor: "Slack", amount: 2100.00, status: "completed", agent: "Procurement Agent", category: "SaaS", timestamp: "8 hr ago" },
  { id: "TXN-009", vendor: "CircleCI", amount: 750.00, status: "completed", agent: "Budget Agent", category: "DevOps", timestamp: "12 hr ago" },
  { id: "TXN-010", vendor: "MongoDB Atlas", amount: 5200.00, status: "pending", agent: "Treasury Agent", category: "Cloud", timestamp: "1 day ago" },
];

export const agents: Agent[] = [
  { id: "agent-1", name: "Payment Agent", status: "active", currentTask: "Processing invoice batch #847", successRate: 99.2, transactionsExecuted: 4821, lastActivity: "2 min ago", icon: "CreditCard", savings: 12400 },
  { id: "agent-2", name: "Procurement Agent", status: "active", currentTask: "Evaluating vendor contracts for Q3", successRate: 97.8, transactionsExecuted: 2340, lastActivity: "8 min ago", icon: "ShoppingCart", savings: 18200 },
  { id: "agent-3", name: "Treasury Agent", status: "active", currentTask: "Optimizing cash reserves allocation", successRate: 98.5, transactionsExecuted: 1205, lastActivity: "15 min ago", icon: "Landmark", savings: 8900 },
  { id: "agent-4", name: "Budget Agent", status: "active", currentTask: "Analyzing department spend anomalies", successRate: 96.4, transactionsExecuted: 6526, lastActivity: "1 min ago", icon: "Wallet", savings: 24600 },
];

export const approvals: Approval[] = [
  { id: "APR-001", requester: "Engineering", amount: 15000, vendor: "AWS Reserved Instances", reason: "Annual compute reservation — projected 32% savings", aiRecommendation: "approve", confidence: 94, timestamp: "10 min ago", department: "Engineering" },
  { id: "APR-002", requester: "Marketing", amount: 8500, vendor: "HubSpot", reason: "Marketing automation platform upgrade", aiRecommendation: "review", confidence: 72, timestamp: "1 hr ago", department: "Marketing" },
  { id: "APR-003", requester: "Design", amount: 2400, vendor: "Figma Enterprise", reason: "Team plan upgrade for 12 seats", aiRecommendation: "approve", confidence: 88, timestamp: "2 hr ago", department: "Design" },
  { id: "APR-004", requester: "Sales", amount: 22000, vendor: "Salesforce", reason: "CRM license renewal + 5 new seats", aiRecommendation: "reject", confidence: 81, timestamp: "3 hr ago", department: "Sales" },
  { id: "APR-005", requester: "DevOps", amount: 4800, vendor: "PagerDuty", reason: "Incident management platform", aiRecommendation: "approve", confidence: 91, timestamp: "5 hr ago", department: "DevOps" },
];

export const budgets: Budget[] = [
  { department: "Engineering", allocated: 120000, spent: 89400, forecast: 115000, trend: -3.2 },
  { department: "Marketing", allocated: 80000, spent: 62300, forecast: 78000, trend: 5.1 },
  { department: "Sales", allocated: 95000, spent: 71200, forecast: 88000, trend: -1.8 },
  { department: "Design", allocated: 35000, spent: 28100, forecast: 34000, trend: 2.4 },
  { department: "DevOps", allocated: 45000, spent: 38700, forecast: 46000, trend: 8.2 },
  { department: "Product", allocated: 25000, spent: 18900, forecast: 24000, trend: -5.6 },
];

export const activityFeed: ActivityEvent[] = [
  { id: "1", agent: "Payment Agent", action: "Invoice Processed", detail: "Paid AWS invoice #INV-8847 — $12,450.00", timestamp: "2 min ago", type: "success" },
  { id: "2", agent: "Budget Agent", action: "Anomaly Detected", detail: "Unusual spike in GCP egress costs (+340%)", timestamp: "8 min ago", type: "warning" },
  { id: "3", agent: "Procurement Agent", action: "Contract Renewed", detail: "Figma Enterprise — negotiated 15% discount", timestamp: "18 min ago", type: "success" },
  { id: "4", agent: "Treasury Agent", action: "Cash Optimized", detail: "Moved $50K to high-yield reserve account", timestamp: "32 min ago", type: "action" },
  { id: "5", agent: "Budget Agent", action: "Forecast Updated", detail: "Q3 spending projected 8% under budget", timestamp: "1 hr ago", type: "info" },
  { id: "6", agent: "Payment Agent", action: "Batch Settled", detail: "17 vendor payments settled via x402 — gas-free", timestamp: "2 hr ago", type: "success" },
];

export const spendingData: SpendingData[] = [
  { month: "Jan", actual: 310000, budget: 340000, optimized: 295000 },
  { month: "Feb", actual: 298000, budget: 340000, optimized: 280000 },
  { month: "Mar", actual: 325000, budget: 340000, optimized: 300000 },
  { month: "Apr", actual: 305000, budget: 340000, optimized: 278000 },
  { month: "May", actual: 290000, budget: 340000, optimized: 265000 },
  { month: "Jun", actual: 284000, budget: 340000, optimized: 258000 },
];

export const costBreakdown: CostBreakdown[] = [
  { category: "Cloud Infrastructure", amount: 98400, percentage: 34.6, color: "#4F46E5" },
  { category: "SaaS Subscriptions", amount: 64200, percentage: 22.6, color: "#6366F1" },
  { category: "Vendor Services", amount: 48900, percentage: 17.2, color: "#10B981" },
  { category: "Payroll Tools", amount: 38700, percentage: 13.6, color: "#F59E0B" },
  { category: "Marketing", amount: 21400, percentage: 7.5, color: "#EF4444" },
  { category: "Other", amount: 12920, percentage: 4.5, color: "#64748B" },
];

export const timelineEvents: TimelineEvent[] = [
  { time: "08:00", agent: "Budget Agent", action: "Anomaly Detected", detail: "AWS cost spike: EC2 instances in us-east-1 running 3x normal capacity", status: "completed" },
  { time: "08:03", agent: "Procurement Agent", action: "Negotiation Started", detail: "Initiated reserved instance pricing negotiation with AWS", status: "completed", savings: 450 },
  { time: "08:07", agent: "Treasury Agent", action: "Funds Allocated", detail: "Reserved $13,500 from operating budget for annual commitment", status: "completed" },
  { time: "08:10", agent: "Payment Agent", action: "Payment Executed", detail: "Executed payment via Circle Gateway — gas-free EIP-3009 settlement", status: "completed", savings: 450 },
  { time: "08:12", agent: "Budget Agent", action: "Forecast Updated", detail: "Monthly cloud spend projection reduced by $450/mo ($5,400/yr)", status: "completed", savings: 5400 },
  { time: "08:15", agent: "Budget Agent", action: "Monitoring", detail: "Continuous cost monitoring re-engaged for all cloud providers", status: "in_progress" },
];

export const commandSuggestions = [
  "Reduce cloud spending by 15%",
  "Pay all approved invoices",
  "Optimize marketing budget for Q3",
  "Find and cancel duplicate subscriptions",
  "Renegotiate vendor contracts expiring this quarter",
  "Generate savings report for board meeting",
];
