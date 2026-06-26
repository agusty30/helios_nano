import { apiUrl, backendUrl } from "./config";
import type {
  ApiStatus, BudgetStateResponse, BudgetOptimizeResponse,
  PaidServiceResponse, CanvasMetrics, AgentRouteResponse, TransferResponse,
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

export const api = {
  fetchStatus: () => get<ApiStatus>(apiUrl("/api/status")),
  fetchBudgetState: () => get<BudgetStateResponse>(apiUrl("/api/budget")),
  fetchBudgetOptimize: () => get<BudgetOptimizeResponse>(apiUrl("/api/budget/optimize")),
  fetchCatalog: () => get<PaidServiceResponse[]>(apiUrl("/api/budget/catalog")),
  fetchTransfers: (limit = 10) => get<TransferResponse>(apiUrl(`/api/transfers?limit=${limit}`)),
  fetchCanvasMetrics: () => get<CanvasMetrics>(backendUrl("/v1/canvas-metrics")),
  postAgentRoute: (prompt: string, priority = "low") =>
    post<AgentRouteResponse>(backendUrl("/v1/agent-route"), { prompt, priority }),
  postResetDaily: () => post<{ status: string }>(backendUrl("/v1/reset-daily"), {}),
};
