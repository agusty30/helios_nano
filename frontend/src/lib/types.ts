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

// --- Backend response types ---

export interface ApiStatus {
  seller: string;
  network: string;
  chainId: number;
  chainName: string;
  prices: { nano: string; helloWorld: string };
  endpoints: string[];
  explorer: string;
  time: string;
}

export interface BudgetBucket {
  key: string;
  spent: number;
  calls: number;
}

export interface BudgetStateResponse {
  dailyUsd: number;
  spentToday: number;
  remaining: number;
  pctUsed: number;
  callsToday: number;
  burnRatePerHour: number;
  projectedRunoutHours: number | null;
  byCategory: BudgetBucket[];
  byService: BudgetBucket[];
}

export interface PaidServiceResponse {
  name: string;
  host: string;
  category: string;
  pricePerCallUsd: number;
  valueScore: number;
  maxCallsPerDay: number;
}

export interface AllocationItem {
  service: PaidServiceResponse;
  calls: number;
  cost: number;
  value: number;
  valuePerDollar: number;
}

export interface AllocationPlan {
  remaining: number;
  items: AllocationItem[];
  totalCost: number;
  totalValue: number;
  utilization: number;
}

export interface BudgetOptimizeResponse {
  state: BudgetStateResponse;
  plan: AllocationPlan;
}

export interface CanvasMetrics {
  wallet_address: string;
  usdc_balance: number;
  active_throughput: number;
  last_route: string;
  daily_spend: number;
  total_saved: number;
  requests_today: number;
  budget_remaining: number;
  circuit_breaker: boolean;
  chain: string;
}

export interface AgentRouteResponse {
  response: string;
  model_used: string;
  cost: number;
  route: string;
  settlement: string;
}

export interface GatewayTransfer {
  id: string;
  from: string;
  to: string;
  amount: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransferResponse {
  transfers: GatewayTransfer[];
}

// --- DB entity types ---

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "FINANCE" | "VIEWER";
  orgId: string;
}

export interface OrganizationRecord {
  id: string;
  name: string;
  industry: string;
  timezone: string;
  currency: string;
  updatedAt: string;
}

export interface WalletRecord {
  id: string;
  label: string;
  address: string;
  type: "TREASURY" | "AGENT";
  chain: string;
  network: string;
  status: string;
  isDefault: boolean;
  deletedAt: string | null;
  createdAt: string;
}

export interface WalletGenerateResponse {
  wallet: WalletRecord;
  privateKey: string;
  warning: string;
}

export interface WalletTransactionRecord {
  id: string;
  orgId: string;
  walletId: string | null;
  fromWalletId: string | null;
  toWalletId: string | null;
  type: string;
  amount: number;
  currency: string;
  status: string;
  reference: string | null;
  txHash: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface TransferRequest {
  toWalletId: string;
  amount: number;
  note?: string;
}

export interface TaskRecord {
  id: string;
  command: string;
  commandType: string;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
  priority: string;
  progress: number;
  retryCount: number;
  correlationId: string | null;
  agentId: string | null;
  agentName: string;
  steps: Array<{ step: number; action: string; status: string; detail: string }>;
  result: Record<string, unknown> | null;
  cost: number;
  executionTimeMs: number | null;
  createdAt: string;
  completedAt: string | null;
}

export interface ExecutionLogRecord {
  id: string;
  taskId: string | null;
  agentId: string | null;
  severity: string;
  component: string;
  action: string;
  detail: string;
  correlationId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  userId: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  before: unknown;
  after: unknown;
  createdAt: string;
  user?: { name: string; email: string };
}

export interface PaymentPolicyRecord {
  id: string;
  autoApproveThreshold: number;
  dailyLimit: number;
  agentLimit: number;
  require2fa: boolean;
}

export interface VendorRecord {
  id: string;
  name: string;
  category: string;
  website: string | null;
  contactEmail: string | null;
  logo: string | null;
  status: string;
  createdAt: string;
  _count?: { subscriptions: number; apiServices: number };
}

export interface ApiServiceRecord {
  id: string;
  name: string;
  provider: string;
  dailyBudget: number;
  status: string;
  createdAt: string;
  vendor?: { id: string; name: string; logo: string | null } | null;
  _count?: { usages: number };
}

export interface ApiCostSummary {
  totalCost: number;
  totalRequests: number;
  totalTokens: number;
  dailyAvg: number;
  projectedMonthly: number;
  days: number;
}

export interface ApiCostsResponse {
  summary: ApiCostSummary;
  byProvider: Record<string, { cost: number; requests: number; tokens: number }>;
  dailyCosts: Record<string, number>;
  services: ApiServiceRecord[];
  vendors: VendorRecord[];
  alerts: Array<{ id: string; name: string; limit: number; spent: number; pct: number; triggered: boolean }>;
}
