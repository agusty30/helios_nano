/**
 * Scheduled buyer worker.
 *
 * A run-once-and-exit entrypoint for a Railway (or any) cron job: the agent
 * pays a target x402 endpoint once, logs the outcome, and exits 0 on success /
 * 1 on failure. Point a cron schedule at it (e.g. every hour) to have the
 * agent autonomously buy a resource on a timer, fully inside the guardrails.
 *
 * Config:
 *   WORKER_TARGET_URL   the x402 resource to pay (required)
 *   WORKER_METHOD       GET | POST (default GET)
 *   WORKER_CATEGORY     optional category tag for guardrail screening
 *   PRIVATE_KEY         the agent wallet key (required in a stateless cron box)
 *   plus all AGENT_* / ARC_TESTNET_RPC / AGENT_DOH vars the agent honours.
 *
 * The hourly/daily spend caps in the guardrails still apply across runs *only*
 * if the ledger persists between runs — mount a volume at AGENT_LEDGER_PATH for
 * that. On an ephemeral cron box without a volume, each run starts with an empty
 * ledger, so rely on the per-payment cap as the hard limit.
 */
import { installDohResolver } from "./net.ts";

installDohResolver();

import { CircleAgent } from "./agent.ts";
import { buildConfigFromEnv } from "./env.ts";

async function main() {
  const url = process.env.WORKER_TARGET_URL;
  if (!url) {
    console.error("WORKER_TARGET_URL is required (the x402 resource to pay).");
    process.exit(2);
  }
  const method = (process.env.WORKER_METHOD as "GET" | "POST") ?? "GET";
  const category = process.env.WORKER_CATEGORY;

  const agent = new CircleAgent(buildConfigFromEnv());
  console.log(
    `[worker] ${new Date().toISOString()} agent ${agent.address} → ${method} ${url}`,
  );

  const outcome = await agent.pay(url, { method, category });
  if (outcome.ok) {
    console.log(
      `[worker] ✓ settled $${outcome.amountUsdc} on ${outcome.chain} ` +
        `in ${outcome.latencyMs}ms — settlement ${outcome.settlementId}`,
    );
    process.exit(0);
  } else {
    console.error(`[worker] ✗ not paid: ${outcome.reason}`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("[worker] crashed:", e);
  process.exit(1);
});
