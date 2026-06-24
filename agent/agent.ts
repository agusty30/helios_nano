/**
 * CircleAgent — an autonomous agent that discovers and pays for x402 services
 * using its own wallet, Circle Gateway nanopayments, and built-in compliance
 * guardrails.
 *
 * Money path: the agent holds one GatewayClient per chain it is funded on.
 * Gateway gives a unified USDC balance across chains and settles each payment
 * off-chain in <500ms (the relayer batches the on-chain `submitBatch` later,
 * so the agent never pays gas per call). On Arc Testnet, USDC is the native gas
 * token, so even the batched settlement is USDC-denominated.
 *
 * Control path: every `pay()` runs the URL + price + category through the
 * guardrails before signing, and writes the decision (allowed/denied/settled/
 * failed) to the append-only ledger.
 */
import { GatewayClient } from "@circle-fin/x402-batching/client";
import type {
  SupportedChainName,
  PayResult,
  Balances,
} from "@circle-fin/x402-batching/client";
import type { AgentConfig } from "./config.ts";
import { Ledger } from "./ledger.ts";
import { Guardrails } from "./guardrails.ts";
import { probe, searchMarketplace } from "./discovery.ts";
import type { DiscoveredService, MarketplaceService } from "./discovery.ts";
import {
  SkillRegistry,
  fetchPaidResourceSkill,
  acquireCapabilitySkill,
} from "./skills.ts";
import type { SkillContext } from "./skills.ts";

export type PayOutcome<T = unknown> =
  | {
      ok: true;
      data: T;
      amountUsdc: number;
      settlementId: string;
      chain: string;
      latencyMs: number;
    }
  | { ok: false; reason: string };

export class CircleAgent {
  readonly address: `0x${string}`;
  private readonly ledger: Ledger;
  private readonly guardrails: Guardrails;
  private readonly skills = new SkillRegistry();
  /** One GatewayClient per chain, created lazily as the agent transacts. */
  private readonly clients = new Map<SupportedChainName, GatewayClient>();

  constructor(private readonly cfg: AgentConfig) {
    this.ledger = new Ledger(cfg.ledgerPath);
    this.guardrails = new Guardrails(cfg.guardrails, this.ledger);
    const primary = this.clientFor(cfg.chain);
    this.address = primary.address as `0x${string}`;

    this.skills
      .register(fetchPaidResourceSkill)
      .register(acquireCapabilitySkill);
  }

  /** Get (or lazily create) the GatewayClient for a chain. */
  private clientFor(chain: SupportedChainName): GatewayClient {
    let client = this.clients.get(chain);
    if (!client) {
      client = new GatewayClient({
        chain,
        privateKey: this.cfg.privateKey,
        rpcUrl: chain === this.cfg.chain ? this.cfg.rpcUrl : undefined,
      });
      this.clients.set(chain, client);
    }
    return client;
  }

  /** Probe a URL for an x402 paywall without paying. */
  async discover(url: string): Promise<DiscoveredService> {
    return probe(url);
  }

  /** Search the Circle marketplace by keyword (CLI-backed). */
  search(keyword: string): MarketplaceService[] {
    return searchMarketplace(keyword, "ARC-TESTNET");
  }

  /** Unified balances on the agent's default chain. */
  async getBalances(chain = this.cfg.chain): Promise<Balances> {
    return this.clientFor(chain).getBalances();
  }

  /**
   * Discover the price of a resource, vet it against guardrails, and — if
   * allowed — pay via Gateway and return the content. Records every step in
   * the ledger. Never throws on a guardrail denial; returns `{ ok: false }`.
   *
   * @param chain  Which funded chain to settle from (cross-chain capable).
   */
  async pay<T = unknown>(
    url: string,
    opts: {
      method?: "GET" | "POST" | "PUT" | "DELETE";
      body?: unknown;
      category?: string;
      chain?: SupportedChainName;
    } = {},
  ): Promise<PayOutcome<T>> {
    const host = new URL(url).host;
    const chain = opts.chain ?? this.cfg.chain;

    // 1. Discover the price up front so guardrails can vet the exact amount.
    const svc = await probe(url);
    if (!svc.paid || svc.accepts.length === 0) {
      // Not paywalled — fetch free, no money moves, no guardrail needed.
      const res = await fetch(url, { method: opts.method ?? "GET" });
      // Read the body once, then try to parse as JSON (can't call both
      // res.json() and res.text() — the second throws "Body already read").
      const text = await res.text();
      let data: T;
      try {
        data = JSON.parse(text) as T;
      } catch {
        data = text as T;
      }
      return {
        ok: true,
        data,
        amountUsdc: 0,
        settlementId: "",
        chain,
        latencyMs: 0,
      };
    }

    // Pick the accept matching our chain's network if present, else the first.
    const opt = svc.accepts[0];
    const amountUsdc = opt.amountUsdc;

    // 2. Guardrail gate.
    const now = Date.now();
    const decision = this.guardrails.check(
      { url, host, amountUsdc, category: opts.category },
      now,
    );
    if (!decision.allowed) {
      this.ledger.append({
        ts: new Date(now).toISOString(),
        outcome: "denied",
        url,
        host,
        amountUsdc,
        chain,
        reason: decision.reason,
      });
      return { ok: false, reason: decision.reason ?? "denied by guardrails" };
    }

    // 3. Pay via Gateway (off-chain settlement, <500ms, gasless).
    const started = Date.now();
    try {
      const result: PayResult<T> = await this.clientFor(chain).pay<T>(url, {
        method: (opts.method as "GET" | "POST") ?? "GET",
        body: opts.body,
      });
      const latencyMs = Date.now() - started;
      this.ledger.append({
        ts: new Date().toISOString(),
        outcome: "settled",
        url,
        host,
        amountUsdc: Number(result.amount) / 1_000_000,
        chain,
        settlementId: result.transaction,
      });
      return {
        ok: true,
        data: result.data,
        amountUsdc: Number(result.amount) / 1_000_000,
        settlementId: result.transaction,
        chain,
        latencyMs,
      };
    } catch (e) {
      const reason = (e as Error).message ?? String(e);
      this.ledger.append({
        ts: new Date().toISOString(),
        outcome: "failed",
        url,
        host,
        amountUsdc,
        chain,
        reason,
      });
      return { ok: false, reason };
    }
  }

  /**
   * Move USDC across chains via Gateway (instant cross-chain settlement).
   * Used to rebalance the agent's funds toward whichever chain a seller wants.
   */
  async rebalance(
    amountUsdc: string,
    toChain: SupportedChainName,
    fromChain = this.cfg.chain,
  ) {
    return this.clientFor(fromChain).withdraw(amountUsdc, { chain: toChain });
  }

  // ---- Skills -------------------------------------------------------------

  listSkills() {
    return this.skills.list();
  }

  /** Build the restricted context handed to skills. */
  private skillContext(): SkillContext {
    return {
      discover: (url) => this.discover(url),
      search: (keyword) => this.search(keyword),
      pay: (url, o) =>
        this.pay(url, { method: o?.method, body: o?.body, category: o?.category }),
      balances: async () => {
        const b = await this.getBalances();
        return {
          wallet: b.wallet.formatted,
          gatewayAvailable: b.gateway.formattedAvailable,
        };
      },
      log: (msg) => console.log(`  [skill] ${msg}`),
    };
  }

  runSkill<I, O>(name: string, input: I): Promise<O> {
    return this.skills.run<I, O>(this.skillContext(), name, input);
  }

  /** Full audit trail. */
  auditLog() {
    return this.ledger.all();
  }
}
