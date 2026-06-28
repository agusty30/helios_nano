import { backendUrl } from "./config";
import type {
  ApiStatus, BudgetStateResponse, BudgetOptimizeResponse,
  PaidServiceResponse, CanvasMetrics, AgentRouteResponse, TransferResponse,
  OrganizationRecord, WalletRecord, TaskRecord, AuditLogEntry, PaymentPolicyRecord,
  VendorRecord, ApiServiceRecord, ApiCostsResponse,
} from "./types";

async function get<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function post<T>(url: string, body: unknown): Promise<T | null> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function put<T>(url: string, body: unknown): Promise<T | null> {
  try {
    const res = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export const api = {
  // Backend (FastAPI)
  fetchStatus: () => get<ApiStatus>("/api/status"),
  fetchBudgetState: () => get<BudgetStateResponse>("/api/budget"),
  fetchBudgetOptimize: () => get<BudgetOptimizeResponse>("/api/budget/optimize"),
  fetchCatalog: () => get<PaidServiceResponse[]>("/api/budget/catalog"),
  fetchTransfers: (limit = 10) => get<TransferResponse>(`/api/transfers?limit=${limit}`),
  fetchCanvasMetrics: () => get<CanvasMetrics>(backendUrl("/v1/canvas-metrics")),
  postAgentRoute: (prompt: string, priority = "low") =>
    post<AgentRouteResponse>(backendUrl("/v1/agent-route"), { prompt, priority }),
  postResetDaily: () => post<{ status: string }>(backendUrl("/v1/reset-daily"), {}),

  // Settings
  getOrganization: () => get<{ organization: OrganizationRecord }>("/api/settings/organization"),
  updateOrganization: (data: Partial<OrganizationRecord>) =>
    put<{ organization: OrganizationRecord }>("/api/settings/organization", data),
  getPolicies: () => get<{ policy: PaymentPolicyRecord }>("/api/settings/policies"),
  updatePolicies: (data: Partial<PaymentPolicyRecord>) =>
    put<{ policy: PaymentPolicyRecord }>("/api/settings/policies", data),
  getNotifications: () => get<{ notifications: Record<string, boolean>; updatedAt: string | null }>("/api/settings/notifications"),
  updateNotifications: (data: Record<string, boolean>) =>
    put<{ notifications: Record<string, boolean>; updatedAt: string }>("/api/settings/notifications", data),
  getTeam: () => get<{ members: Array<{ id: string; name: string; email: string; role: string; createdAt: string }> }>("/api/settings/team"),
  addTeamMember: (data: { name: string; email: string; password: string; role?: string }) =>
    post<{ member: { id: string; name: string; email: string; role: string } }>("/api/settings/team", data),
  getAuditLog: (page = 1, limit = 50) =>
    get<{ logs: AuditLogEntry[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(`/api/settings/audit?page=${page}&limit=${limit}`),

  // Tasks
  createTask: (command: string) => post<{ task: TaskRecord }>("/api/tasks", { command }),
  listTasks: (limit = 20) => get<{ tasks: TaskRecord[] }>(`/api/tasks?limit=${limit}`),
  getTask: (id: string) => get<{ task: TaskRecord }>(`/api/tasks/${id}`),

  // Wallets
  listWallets: () => get<{ wallets: WalletRecord[] }>("/api/wallets"),
  createWallet: (data: { label: string; address: string; type: string }) =>
    post<{ wallet: WalletRecord }>("/api/wallets", data),

  // Vendors
  listVendors: () => get<{ vendors: VendorRecord[] }>("/api/vendors"),
  createVendor: (data: { name: string; category?: string; website?: string; contactEmail?: string }) =>
    post<{ vendor: VendorRecord }>("/api/vendors", data),

  // API Services
  listApiServices: () => get<{ services: ApiServiceRecord[] }>("/api/api-services"),
  createApiService: (data: { name: string; provider: string; vendorId?: string; monthlyBudget?: number }) =>
    post<{ service: ApiServiceRecord }>("/api/api-services", data),

  // API Costs
  getApiCosts: (days = 30) => get<ApiCostsResponse>(`/api/api-costs?days=${days}`),
  recordApiUsage: (data: { serviceId: string; date: string; requests: number; tokens?: number; cost: number; model?: string }) =>
    post<{ usage: unknown }>("/api/api-costs", data),
};
