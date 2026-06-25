export interface KpiData {
  label: string;
  value: string;
  change: number;
  icon: string;
}

export interface Transaction {
  id: string;
  vendor: string;
  amount: number;
  status: "completed" | "pending" | "failed";
  agent: string;
  category: string;
  timestamp: string;
}

export interface Agent {
  id: string;
  name: string;
  status: "active" | "idle" | "paused";
  currentTask: string;
  successRate: number;
  transactionsExecuted: number;
  lastActivity: string;
  icon: string;
  savings: number;
}

export interface Approval {
  id: string;
  requester: string;
  amount: number;
  vendor: string;
  reason: string;
  aiRecommendation: "approve" | "reject" | "review";
  confidence: number;
  timestamp: string;
  department: string;
}

export interface Budget {
  department: string;
  allocated: number;
  spent: number;
  forecast: number;
  trend: number;
}

export interface ActivityEvent {
  id: string;
  agent: string;
  action: string;
  detail: string;
  timestamp: string;
  type: "success" | "info" | "warning" | "action";
}

export interface SpendingData {
  month: string;
  actual: number;
  budget: number;
  optimized: number;
}

export interface CostBreakdown {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

export interface TimelineEvent {
  time: string;
  agent: string;
  action: string;
  detail: string;
  status: "completed" | "in_progress" | "pending";
  savings?: number;
}

export interface TractionMetrics {
  totalAutonomousPayments: number;
  avgTransactionSize: number;
  budgetUtilizationEfficiency: number;
  costPerTaskCompleted: number;
}
