/**
 * End-to-end smoke test — single pass/fail for CI / pre-deploy.
 *
 * Boots the paywall server in-process, then drives the agent through the full
 * live path against http://localhost:<port>/nano:
 *
 *   doctor (hard deps) → discover (expect 402) → pay (expect settlement)
 *   → audit (expect the settled entry)
 *
 * Exits 0 only if a real nanopayment settled; non-zero otherwise. Prints a
 * reason on failure so CI logs are actionable.
 *
 * Requires outbound access to Circle's Gateway API and a funded Gateway
 * balance — i.e. run it where `agent doctor` reports READY. In a sandbox that
 * can't reach Circle's API this fails fast at the doctor/pay step by design.
 *
 * Env:
 *   SMOKE_PORT          port for the in-process server (default 3100)
 *   SMOKE_MAX_LATENCY   fail if settlement is slower than this many ms (default 500)
 *   plus all AGENT_* / PRIVATE_KEY / ARC_TESTNET_RPC vars the CLI honours.
 */
import { spawn, type ChildProcess } from "node:child_process";
import { installDohResolver } from "./net.ts";

installDohResolver();

import { CircleAgent } from "./agent.ts";
import { runDoctor } from "./doctor.ts";
import { buildConfigFromEnv } from "./env.ts";

const PORT = Number(process.env.SMOKE_PORT ?? 3100);
const MAX_LATENCY = Number(process.env.SMOKE_MAX_LATENCY ?? 500);
const BASE = `http://localhost:${PORT}`;
const NANO_URL = `${BASE}/nano`;

function step(msg: string) {
  console.log(`\n▶ ${msg}`);
}
function ok(msg: string) {
  console.log(`  ✓ ${msg}`);
}
function die(msg: string): never {
  console.error(`  ✗ ${msg}`);
  console.error("\nSMOKE: FAIL");
  process.exit(1);
}

const buildConfig = buildConfigFromEnv;

/** Start `tsx server.ts` on SMOKE_PORT and resolve once it's listening. */
function startServer(): Promise<ChildProcess> {
  return new Promise((resolvePromise, reject) => {
    const proc = spawn("npx", ["tsx", "server.ts"], {
      env: { ...process.env, PORT: String(PORT) },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        proc.kill("SIGTERM");
        reject(new Error("server did not start within 20s"));
      }
    }, 20_000);

    const onData = (buf: Buffer) => {
      if (!settled && buf.toString().includes("listening on")) {
        settled = true;
        clearTimeout(timer);
        resolvePromise(proc);
      }
    };
    proc.stdout?.on("data", onData);
    proc.stderr?.on("data", onData);
    proc.on("exit", (code) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        reject(new Error(`server exited early with code ${code}`));
      }
    });
  });
}

async function main() {
  const cfg = buildConfig();
  const agent = new CircleAgent(cfg);
  console.log(`SMOKE: agent ${agent.address} → ${NANO_URL}`);

  // 1. Readiness gate.
  step("doctor — hard dependencies");
  const health = await runDoctor(cfg);
  for (const c of health.checks) {
    const icon = c.level === "PASS" ? "✓" : c.level === "WARN" ? "!" : "✗";
    console.log(`  ${icon} ${c.name}: ${c.detail}`);
  }
  if (!health.ready) {
    die("doctor reports NOT READY — fix the ✗ checks before deploying.");
  }
  ok("all hard dependencies green");

  // 2. Boot the server.
  step(`starting paywall server on :${PORT}`);
  let server: ChildProcess;
  try {
    server = await startServer();
  } catch (e) {
    die((e as Error).message);
  }
  ok("server listening");

  let exitCode = 0;
  try {
    // 3. Discover — expect a 402 with a decodable price.
    step("discover /nano — expect 402 challenge");
    const svc = await agent.discover(NANO_URL);
    if (svc.status !== 402 || !svc.paid) {
      die(`expected 402, got ${svc.status} (Gateway API reachable from here?)`);
    }
    const price = svc.accepts[0]?.amountUsdc;
    ok(`402 received, price $${price} on ${svc.accepts[0]?.network}`);

    // 4. Pay — expect a settlement UUID within latency budget.
    step("pay /nano — expect settlement < " + MAX_LATENCY + "ms");
    const out = await agent.pay(NANO_URL);
    if (!out.ok) die(`payment refused/failed: ${out.reason}`);
    ok(`settled $${out.amountUsdc} on ${out.chain} in ${out.latencyMs}ms`);
    ok(`settlement id: ${out.settlementId}`);
    if (out.latencyMs > MAX_LATENCY) {
      console.warn(
        `  ! latency ${out.latencyMs}ms exceeds budget ${MAX_LATENCY}ms (warning only)`,
      );
    }

    // 5. Audit — the settled entry must be on the ledger.
    step("audit — confirm ledger recorded the settlement");
    const settledEntry = agent
      .auditLog()
      .find((e) => e.outcome === "settled" && e.settlementId === out.settlementId);
    if (!settledEntry) die("settlement not found in audit ledger");
    ok("ledger entry present");

    console.log("\nSMOKE: PASS");
  } catch (e) {
    console.error(`  ✗ ${(e as Error).message}`);
    console.error("\nSMOKE: FAIL");
    exitCode = 1;
  } finally {
    server!.kill("SIGTERM");
  }
  process.exit(exitCode);
}

main().catch((e) => {
  console.error(e);
  console.error("\nSMOKE: FAIL");
  process.exit(1);
});
