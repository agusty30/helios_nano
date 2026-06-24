/**
 * x402 service discovery.
 *
 * Two ways the agent finds paid endpoints:
 *  1. `probe(url)` — directly hit a URL; if it answers `402 Payment Required`
 *     with a `PAYMENT-REQUIRED` header, decode the challenge into structured
 *     payment requirements (price, network, scheme, seller).
 *  2. `search(keyword)` — query the Circle services marketplace via the `circle`
 *     CLI (`circle services search`) for endpoints matching a keyword.
 *
 * The decoded `accepts[]` entries feed straight into the payment loop and the
 * guardrail check (amount + host + network).
 */
import { execFileSync } from "node:child_process";

export interface PaymentOption {
  scheme: string;
  network: string;
  /** Atomic-unit amount as a string (USDC, 6 decimals). */
  amount: string;
  /** Whole-USDC amount, derived from `amount`. */
  amountUsdc: number;
  payTo: string;
  asset?: string;
  maxTimeoutSeconds?: number;
  extra?: Record<string, unknown>;
}

export interface DiscoveredService {
  url: string;
  host: string;
  /** True if the endpoint returned a 402 challenge we could decode. */
  paid: boolean;
  /** HTTP status the probe saw (402 when paywalled). */
  status: number;
  resource?: string;
  accepts: PaymentOption[];
}

/** Decode the base64 JSON x402 challenge from the PAYMENT-REQUIRED header. */
function decodeChallenge(headerValue: string): {
  resource?: string;
  accepts: PaymentOption[];
} {
  const json = JSON.parse(Buffer.from(headerValue, "base64").toString("utf8"));
  const accepts: PaymentOption[] = (json.accepts ?? []).map((a: any) => ({
    scheme: a.scheme,
    network: a.network,
    amount: String(a.amount),
    amountUsdc: Number(a.amount) / 1_000_000,
    payTo: a.payTo,
    asset: a.asset,
    maxTimeoutSeconds: a.maxTimeoutSeconds,
    extra: a.extra,
  }));
  return { resource: json.resource, accepts };
}

/**
 * Probe a single URL for an x402 paywall without paying.
 *
 * A non-402 response means the resource is free (or unavailable); a 402 with a
 * decodable `PAYMENT-REQUIRED` header yields the structured payment options.
 */
export async function probe(url: string): Promise<DiscoveredService> {
  const host = new URL(url).host;
  let res: Response;
  try {
    res = await fetch(url, { method: "GET" });
  } catch (e) {
    return { url, host, paid: false, status: 0, accepts: [] };
  }

  if (res.status !== 402) {
    return { url, host, paid: false, status: res.status, accepts: [] };
  }

  const header =
    res.headers.get("PAYMENT-REQUIRED") ?? res.headers.get("payment-required");
  if (!header) {
    return { url, host, paid: true, status: 402, accepts: [] };
  }
  const { resource, accepts } = decodeChallenge(header);
  return { url, host, paid: true, status: 402, resource, accepts };
}

/** Probe several URLs concurrently, returning only the ones that are paywalled. */
export async function discover(urls: string[]): Promise<DiscoveredService[]> {
  const results = await Promise.all(urls.map((u) => probe(u)));
  return results.filter((r) => r.paid);
}

export interface MarketplaceService {
  name?: string;
  url?: string;
  description?: string;
  price?: string;
  chains?: string[];
  [key: string]: unknown;
}

/**
 * Search the Circle services marketplace via the `circle` CLI.
 *
 * Requires the CLI on PATH and a `--chain`. Returns [] if the discovery API is
 * unreachable (the CLI errors), so callers can fall back to direct `probe`.
 */
export function searchMarketplace(
  keyword: string,
  chain: string,
  circleBin = "circle",
): MarketplaceService[] {
  try {
    const out = execFileSync(
      circleBin,
      ["services", "search", keyword, "--chain", chain, "--output", "json"],
      { encoding: "utf8", env: { ...process.env, CIRCLE_ACCEPT_TERMS: "1" } },
    );
    const parsed = JSON.parse(out);
    return parsed?.data?.services ?? parsed?.data?.results ?? [];
  } catch {
    return [];
  }
}
