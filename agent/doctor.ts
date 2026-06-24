/**
 * Preflight / readiness check ("doctor").
 *
 * Runs through every dependency the agent needs to operate live and reports
 * PASS / WARN / FAIL for each, so you can tell at a glance whether the agent is
 * ready to deploy. Designed to run on localhost before going live.
 *
 * Hard requirements (FAIL blocks go-live):
 *   - wallet key present & valid
 *   - Arc Testnet RPC reachable and reporting the right chain id
 *   - Circle Gateway API reachable (needed to settle payments)
 * Soft (WARN only):
 *   - on-chain USDC balance > 0 (needed to deposit)
 *   - Gateway available balance > 0 (needed to actually pay)
 */
import { GatewayClient } from "@circle-fin/x402-batching/client";
import type { AgentConfig } from "./config.ts";
import { ARC_TESTNET_NETWORK, GATEWAY_API_TESTNET } from "./config.ts";

type Level = "PASS" | "WARN" | "FAIL";
interface Check {
  name: string;
  level: Level;
  detail: string;
}

const ARC_CHAIN_ID = 5042002;

async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, rej) =>
      setTimeout(() => rej(new Error(`timed out after ${ms}ms`)), ms),
    ),
  ]);
}

export interface DoctorResult {
  checks: Check[];
  ready: boolean;
}

export async function runDoctor(cfg: AgentConfig): Promise<DoctorResult> {
  const checks: Check[] = [];
  const add = (name: string, level: Level, detail: string) =>
    checks.push({ name, level, detail });

  // 1. Wallet key
  let client: GatewayClient | undefined;
  try {
    client = new GatewayClient({
      chain: cfg.chain,
      privateKey: cfg.privateKey,
      rpcUrl: cfg.rpcUrl,
    });
    add("wallet key", "PASS", `address ${client.address}`);
  } catch (e) {
    add("wallet key", "FAIL", (e as Error).message);
  }

  // 2. RPC reachability + chain id
  if (client) {
    try {
      const id = await withTimeout(client.publicClient.getChainId(), 8000);
      const block = await withTimeout(client.publicClient.getBlockNumber(), 8000);
      if (id === ARC_CHAIN_ID) {
        add("RPC (Arc Testnet)", "PASS", `chainId ${id}, block #${block}`);
      } else {
        add("RPC (Arc Testnet)", "FAIL", `wrong chainId ${id} (expected ${ARC_CHAIN_ID})`);
      }
    } catch (e) {
      add("RPC (Arc Testnet)", "FAIL", `unreachable: ${(e as Error).message}`);
    }
  }

  // 3. On-chain USDC balance
  if (client) {
    try {
      const bal = await withTimeout(client.getUsdcBalance(), 8000);
      const n = Number(bal.formatted);
      add(
        "on-chain USDC",
        n > 0 ? "PASS" : "WARN",
        n > 0 ? `${bal.formatted} USDC` : "0 USDC — fund at https://faucet.circle.com/",
      );
    } catch (e) {
      add("on-chain USDC", "WARN", `could not read: ${(e as Error).message}`);
    }
  }

  // 4. Gateway API reachability (the settlement dependency)
  try {
    const res = await withTimeout(
      fetch(`${GATEWAY_API_TESTNET}/v1/x402/supported`),
      8000,
    );
    add(
      "Circle Gateway API",
      res.ok ? "PASS" : "FAIL",
      `${GATEWAY_API_TESTNET} → HTTP ${res.status}`,
    );
  } catch (e) {
    add(
      "Circle Gateway API",
      "FAIL",
      `unreachable (${(e as Error).message}) — payments cannot settle`,
    );
  }

  // 5. Gateway available balance (needs API; best-effort)
  if (client) {
    try {
      const b = await withTimeout(client.getBalances(), 8000);
      const n = Number(b.gateway.formattedAvailable);
      add(
        "Gateway balance",
        n > 0 ? "PASS" : "WARN",
        n > 0
          ? `${b.gateway.formattedAvailable} USDC available`
          : "0 available — run `gateway deposit` first",
      );
    } catch (e) {
      add("Gateway balance", "WARN", `could not read (API): ${(e as Error).message}`);
    }
  }

  // 6. Guardrails sanity
  const g = cfg.guardrails;
  add(
    "guardrails",
    "PASS",
    `per-pay ≤ $${g.maxPerPayment}, hour ≤ $${g.maxPerHour}, day ≤ $${g.maxPerDay}, ` +
      `floor $${g.minPerPayment}, allowlist ${g.allowedHosts.length || "(open)"}`,
  );

  // 7. Network id used for x402 accepts
  add("x402 network", "PASS", ARC_TESTNET_NETWORK);

  const ready = !checks.some((c) => c.level === "FAIL");
  return { checks, ready };
}

export function formatDoctor(result: DoctorResult): string {
  const icon = (l: Level) => (l === "PASS" ? "✓" : l === "WARN" ? "!" : "✗");
  const lines = result.checks.map(
    (c) => `  ${icon(c.level)} ${c.name.padEnd(22)} ${c.detail}`,
  );
  lines.push("");
  lines.push(
    result.ready
      ? "READY — all hard dependencies green. Safe to run live."
      : "NOT READY — a hard dependency failed (see ✗ above).",
  );
  return lines.join("\n");
}
