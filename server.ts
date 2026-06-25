import express from "express";
import { installDohResolver } from "./agent/net.ts";
import { createGatewayMiddleware } from "@circle-fin/x402-batching/server";
import { formatUnits } from "viem";
import { decodeBatch } from "./decode-batch.ts";
import { buildConfigFromEnv } from "./agent/env.ts";
import { Ledger } from "./agent/ledger.ts";
import { computeBudgetState, optimizeAllocation } from "./agent/budget.ts";
import { SERVICE_CATALOG } from "./agent/catalog.ts";

// Bypass ISP DNS hijacking of *.circle.com (resolve the facilitator via DoH).
installDohResolver();


type PaidRequest = express.Request & {
  payment?: {
    verified: boolean;
    payer: string;
    amount: string;
    network: string;
    transaction?: string;
  };
};

const SELLER = "0x933a2405f84c224be1ef373ba16e992e1f459682";

const app = express();

// Unauthenticated liveness probe for platform healthchecks (Railway, etc.).
// The paywalled routes return 402, so a dedicated 200 endpoint is needed.
app.get("/health", (_req, res) => res.json({ status: "ok", seller: SELLER }));

app.get("/", (_req, res) => res.redirect("/budget.html"));
app.use(express.static("public"));

// Read-only status for the dashboard. No secrets — just public seller config.
app.get("/api/status", (_req, res) => {
  res.json({
    seller: SELLER,
    network: "eip155:5042002",
    chainId: 5042002,
    chainName: "Arc Testnet",
    prices: { nano: "$0.000001", helloWorld: "$0.01" },
    endpoints: ["/nano", "/hello-world"],
    explorer: "https://testnet.arcscan.app",
    time: new Date().toISOString(),
  });
});

const gateway = createGatewayMiddleware({
  sellerAddress: SELLER,
  facilitatorUrl: "https://gateway-api-testnet.circle.com",
  networks: ["eip155:5042002"],
});

app.get("/hello-world", gateway.require("$0.01"), (req: PaidRequest, res) => {
  const { payer, amount, network, transaction } = req.payment!;
  const formatted = formatUnits(BigInt(amount), 6);
  console.log(`paid ${formatted} USDC by ${payer} on ${network} settlement=${transaction ?? "?"}`);

  res.json({
    message: "hello, world — you paid for this",
    paid_by: payer,
    amount_usdc: formatted,
    network,
    settlementId: transaction,
  });
});

// Nano endpoint: priced at the smallest possible USDC payment — $0.000001
// (1 atomic unit). This is the target the autonomous agent pays.
app.get("/nano", gateway.require("$0.000001"), (req: PaidRequest, res) => {
  const { payer, amount, network, transaction } = req.payment!;
  const formatted = formatUnits(BigInt(amount), 6);
  console.log(`nano paid ${formatted} USDC by ${payer} settlement=${transaction ?? "?"}`);
  res.json({
    message: "nano resource — paid with a $0.000001 USDC nanopayment",
    paid_by: payer,
    amount_usdc: formatted,
    network,
    settlementId: transaction,
  });
});

const GATEWAY_API = "https://gateway-api-testnet.circle.com";
const ARC_EXPLORER = "https://testnet.arcscan.app";
const GATEWAY_WALLET = "0x0077777d7EBA4688BDeF3E311b846F25870A19B9";

// Settlements older than ~the indexer's recent-tx window can't be resolved
// via the live arcscan lookup, so we hardcode known demo settlements.
const PINNED_BATCH_TX: Record<string, `0x${string}`> = {
  "c9933054-6b34-44bb-8c04-e7e9e1b8352c":
    "0xfbad1baae7fd9b88f4e1b034a4236da02012870acbd6ae83b583e85528be396e",
};

// Recent settlements paid TO this seller — powers the dashboard live feed.
app.get("/api/transfers", async (req, res) => {
  const limit = Math.min(Number(req.query.limit ?? 10) || 10, 50);
  try {
    const r = await fetch(
      `${GATEWAY_API}/v1/x402/transfers?to=${SELLER}&pageSize=${limit}`,
    );
    if (!r.ok) {
      res.status(r.status).type("application/json").send(await r.text());
      return;
    }
    const data = (await r.json()) as { transfers?: unknown[] };
    res.json({ transfers: (data.transfers ?? []).slice(0, limit) });
  } catch (e) {
    res.status(502).json({ error: String((e as Error).message ?? e) });
  }
});

app.get("/api/settlement/:id", async (req, res) => {
  const r = await fetch(`${GATEWAY_API}/v1/x402/transfers/${req.params.id}`);
  res.status(r.status).type("application/json").send(await r.text());
});

app.get("/api/decode-batch/:hash", async (req, res) => {
  try {
    const decoded = await decodeBatch(req.params.hash as `0x${string}`);
    res.json({
      ...decoded,
      blockNumber: decoded.blockNumber.toString(),
      entries: decoded.entries.map((e) => ({
        address: e.address,
        deltaRaw: e.delta.toString(),
        usdc: e.usdc,
      })),
    });
  } catch (e) {
    res.status(400).json({ error: String((e as Error).message ?? e) });
  }
});

app.get("/api/batch-tx/:id", async (req, res) => {
  const sr = await fetch(`${GATEWAY_API}/v1/x402/transfers/${req.params.id}`);
  if (!sr.ok) {
    res.status(sr.status).send(await sr.text());
    return;
  }
  const settlement = (await sr.json()) as { status: string; updatedAt: string };
  if (settlement.status !== "completed" && settlement.status !== "confirmed") {
    res.json({ batchTx: null, status: settlement.status });
    return;
  }
  const pinned = PINNED_BATCH_TX[req.params.id];
  if (pinned) {
    res.json({
      batchTx: pinned,
      status: settlement.status,
      explorerUrl: `${ARC_EXPLORER}/tx/${pinned}`,
    });
    return;
  }
  const tr = await fetch(
    `${ARC_EXPLORER}/api/v2/addresses/${GATEWAY_WALLET}/transactions?filter=to`,
  );
  const { items } = (await tr.json()) as {
    items: { hash: string; timestamp: string; method: string | null }[];
  };
  const updatedAt = new Date(settlement.updatedAt).getTime();
  const candidate = items.find(
    (t) =>
      t.method === "submitBatch" &&
      new Date(t.timestamp).getTime() <= updatedAt + 5_000,
  );
  res.json({
    batchTx: candidate?.hash ?? null,
    status: settlement.status,
    explorerUrl: candidate ? `${ARC_EXPLORER}/tx/${candidate.hash}` : null,
  });
});

// Budget bot API — powers the Bento Grid dashboard
app.get("/api/budget", (_req, res) => {
  const cfg = buildConfigFromEnv();
  const daily = Number(process.env.AGENT_MAX_PER_DAY ?? cfg.guardrails.maxPerDay);
  const entries = new Ledger(cfg.ledgerPath).all();
  const state = computeBudgetState(daily, entries, SERVICE_CATALOG, Date.now());
  res.json(state);
});

app.get("/api/budget/optimize", (_req, res) => {
  const cfg = buildConfigFromEnv();
  const daily = Number(process.env.AGENT_MAX_PER_DAY ?? cfg.guardrails.maxPerDay);
  const entries = new Ledger(cfg.ledgerPath).all();
  const state = computeBudgetState(daily, entries, SERVICE_CATALOG, Date.now());
  const plan = optimizeAllocation(state.remaining, SERVICE_CATALOG);
  res.json({ state, plan });
});

app.get("/api/budget/catalog", (_req, res) => {
  res.json(SERVICE_CATALOG);
});

const PORT = Number(process.env.PORT ?? 3000);
app.listen(PORT, () => {
  console.log(`listening on http://localhost:${PORT}`);
  console.log(`seller: ${SELLER}`);
});
