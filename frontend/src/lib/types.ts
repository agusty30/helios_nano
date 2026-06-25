export interface CanvasMetrics {
  wallet_address: string;
  usdc_balance: number;
  active_throughput: number;
  last_route: "cheap_tier" | "heavy_tier" | "circuit_breaker" | "idle";
  daily_spend: number;
  total_saved: number;
  requests_today: number;
  budget_remaining: number;
  circuit_breaker: boolean;
  chain: string;
}

export interface TransactionEvent {
  id: string;
  timestamp: number;
  route: "cheap_tier" | "heavy_tier";
  cost: number;
  model: string;
  settlement: string;
}

export type RouteColor = "mint" | "gold" | "crimson";

export function routeToColor(route: string): RouteColor {
  if (route === "cheap_tier") return "mint";
  if (route === "heavy_tier") return "gold";
  return "crimson";
}
