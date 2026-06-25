/**
 * Budget engine — the "budget bot" core.
 *
 * Given a daily USD budget and a catalog of paid x402 services (each with a
 * price-per-call and a value score), it:
 *   1. tracks spend over the last 24h from the audit ledger,
 *   2. computes budget state (spent / remaining / burn rate / projected runout),
 *   3. optimizes allocation of the remaining budget across the catalog by
 *      value-per-dollar — i.e. "spend $10/day across dozens of APIs for the most
 *      total value."
 *
 * Pure functions, no I/O — fed by the ledger and a catalog, consumed by the CLI,
 * the worker, and the dashboard API.
 */
import type { LedgerEntry } from "./ledger.ts";

const DAY_MS = 24 * 60 * 60 * 1000;

export interface PaidService {
  name: string;
  host: string;
  category: string;
  /** Price per call in whole USD. */
  pricePerCallUsd: number;
  /** Subjective value of one call, 0–100 (higher = more useful to the agent). */
  valueScore: number;
  /** Cap on how many times/day the agent would ever call this (diminishing returns). */
  maxCallsPerDay: number;
}

export interface BudgetBucket {
  key: string;
  spent: number;
  calls: number;
}

export interface BudgetState {
  dailyUsd: number;
  /** Spend in the last 24h (matches the agent's rolling daily guardrail). */
  spentToday: number;
  remaining: number;
  /** 0–1 fraction of the daily budget consumed. */
  pctUsed: number;
  callsToday: number;
  /** USD/hour over the last 24h. */
  burnRatePerHour: number;
  /** Hours until the budget is exhausted at the current burn rate (null if idle/safe). */
  projectedRunoutHours: number | null;
  byCategory: BudgetBucket[];
  byService: BudgetBucket[];
}

export interface AllocationItem {
  service: PaidService;
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
  /** Fraction of the remaining budget the plan would consume. */
  utilization: number;
}

/** Settled spend in the last `windowMs`, bucketed by host. */
export function spendByHost(
  entries: LedgerEntry[],
  nowMs: number,
  windowMs = DAY_MS,
): Map<string, BudgetBucket> {
  const cutoff = nowMs - windowMs;
  const out = new Map<string, BudgetBucket>();
  for (const e of entries) {
    if (e.outcome !== "settled") continue;
    if (new Date(e.ts).getTime() < cutoff) continue;
    const b = out.get(e.host) ?? { key: e.host, spent: 0, calls: 0 };
    b.spent += e.amountUsdc;
    b.calls += 1;
    out.set(e.host, b);
  }
  return out;
}

/**
 * Compute the full budget state from the ledger + catalog. The catalog maps
 * hosts to service/category names for nicer breakdowns; unknown hosts are kept
 * under their raw hostname.
 */
export function computeBudgetState(
  dailyUsd: number,
  entries: LedgerEntry[],
  catalog: PaidService[],
  nowMs: number,
): BudgetState {
  const byHost = spendByHost(entries, nowMs);
  const hostToService = new Map(catalog.map((s) => [s.host, s]));

  let spentToday = 0;
  let callsToday = 0;
  const catAgg = new Map<string, BudgetBucket>();
  const svcAgg = new Map<string, BudgetBucket>();

  for (const [host, b] of byHost) {
    spentToday += b.spent;
    callsToday += b.calls;
    const svc = hostToService.get(host);
    const svcName = svc?.name ?? host;
    const cat = svc?.category ?? "other";
    const c = catAgg.get(cat) ?? { key: cat, spent: 0, calls: 0 };
    c.spent += b.spent; c.calls += b.calls; catAgg.set(cat, c);
    const s = svcAgg.get(svcName) ?? { key: svcName, spent: 0, calls: 0 };
    s.spent += b.spent; s.calls += b.calls; svcAgg.set(svcName, s);
  }

  const remaining = Math.max(0, dailyUsd - spentToday);
  const burnRatePerHour = spentToday / 24;
  const projectedRunoutHours =
    burnRatePerHour > 0 && remaining > 0 ? remaining / burnRatePerHour : null;

  const sortDesc = (a: BudgetBucket, b: BudgetBucket) => b.spent - a.spent;
  return {
    dailyUsd,
    spentToday,
    remaining,
    pctUsed: dailyUsd > 0 ? Math.min(1, spentToday / dailyUsd) : 0,
    callsToday,
    burnRatePerHour,
    projectedRunoutHours,
    byCategory: [...catAgg.values()].sort(sortDesc),
    byService: [...svcAgg.values()].sort(sortDesc),
  };
}

/**
 * Greedy value-per-dollar allocation of `remaining` budget across the catalog.
 *
 * This is the optimizer a budget bot runs: rank every service by value/$, then
 * buy calls (up to each service's daily cap) from the best ratio down until the
 * budget is spent. Maximizes total value for the dollars available — the
 * fractional-knapsack-style heuristic, which is optimal when calls are cheap and
 * granular relative to the budget.
 */
export function optimizeAllocation(
  remaining: number,
  catalog: PaidService[],
): AllocationPlan {
  const ranked = [...catalog]
    .filter((s) => s.pricePerCallUsd > 0)
    .map((s) => ({ s, vpd: s.valueScore / s.pricePerCallUsd }))
    .sort((a, b) => b.vpd - a.vpd);

  let budget = remaining;
  const items: AllocationItem[] = [];
  for (const { s, vpd } of ranked) {
    if (budget <= 0) break;
    const affordable = Math.floor(budget / s.pricePerCallUsd);
    const calls = Math.min(s.maxCallsPerDay, affordable);
    if (calls <= 0) continue;
    const cost = calls * s.pricePerCallUsd;
    items.push({
      service: s,
      calls,
      cost,
      value: calls * s.valueScore,
      valuePerDollar: vpd,
    });
    budget -= cost;
  }

  const totalCost = items.reduce((a, i) => a + i.cost, 0);
  const totalValue = items.reduce((a, i) => a + i.value, 0);
  return {
    remaining,
    items,
    totalCost,
    totalValue,
    utilization: remaining > 0 ? totalCost / remaining : 0,
  };
}

/**
 * Per-call gate for the worker: is this call worth making right now, given the
 * remaining budget? Rejects when it doesn't fit, or when its value-per-dollar is
 * below the budget's current opportunity cost (the cheapest value/$ in the plan
 * that still fits) — so dollars are saved for higher-value calls.
 */
export function shouldSpend(
  service: PaidService,
  remaining: number,
  plan: AllocationPlan,
): { ok: boolean; reason: string } {
  if (service.pricePerCallUsd > remaining) {
    return { ok: false, reason: `over remaining budget ($${remaining.toFixed(6)})` };
  }
  const vpd = service.valueScore / service.pricePerCallUsd;
  const floor = plan.items.length
    ? Math.min(...plan.items.map((i) => i.valuePerDollar))
    : 0;
  if (vpd < floor) {
    return {
      ok: false,
      reason: `value/$ ${vpd.toFixed(1)} below budget opportunity cost ${floor.toFixed(1)}`,
    };
  }
  return { ok: true, reason: "within budget and above opportunity cost" };
}
