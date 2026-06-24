/**
 * Skills — pluggable capabilities the agent can invoke.
 *
 * A Skill is a named unit of work that may consult discovery and spend money
 * through the agent's guarded payment loop. Skills never touch the wallet or
 * guardrails directly; they receive a `SkillContext` that exposes only the
 * safe, audited operations (discover, pay-if-allowed, balances).
 *
 * This mirrors Circle's own "skills" concept (`circle skill list`) but as an
 * in-process registry the autonomous loop can call.
 */
import type { DiscoveredService, MarketplaceService } from "./discovery.ts";
import type { PayOutcome } from "./agent.ts";

export interface SkillContext {
  /** Probe a URL for an x402 paywall (no payment). */
  discover(url: string): Promise<DiscoveredService>;
  /** Search the Circle marketplace by keyword. */
  search(keyword: string): MarketplaceService[];
  /**
   * Pay for and fetch a resource, subject to guardrails. Resolves with the
   * outcome (settled or denied) — never throws on a guardrail denial.
   */
  pay<T = unknown>(
    url: string,
    opts?: { method?: "GET" | "POST"; body?: unknown; category?: string },
  ): Promise<PayOutcome<T>>;
  /** Current unified Gateway + wallet balances, formatted. */
  balances(): Promise<{ wallet: string; gatewayAvailable: string }>;
  log(msg: string): void;
}

export interface Skill<Input = unknown, Output = unknown> {
  name: string;
  description: string;
  run(ctx: SkillContext, input: Input): Promise<Output>;
}

export class SkillRegistry {
  private skills = new Map<string, Skill<any, any>>();

  register(skill: Skill<any, any>): this {
    this.skills.set(skill.name, skill);
    return this;
  }

  get(name: string): Skill | undefined {
    return this.skills.get(name);
  }

  list(): { name: string; description: string }[] {
    return [...this.skills.values()].map((s) => ({
      name: s.name,
      description: s.description,
    }));
  }

  async run<I, O>(ctx: SkillContext, name: string, input: I): Promise<O> {
    const skill = this.skills.get(name);
    if (!skill) throw new Error(`unknown skill: ${name}`);
    ctx.log(`▶ running skill "${name}"`);
    return (await skill.run(ctx, input)) as O;
  }
}

/**
 * Built-in skill: discover a paywalled endpoint then pay for it in one step.
 * Demonstrates the discover → guardrail → pay flow end-to-end.
 */
export const fetchPaidResourceSkill: Skill<
  { url: string; category?: string },
  PayOutcome
> = {
  name: "fetch-paid-resource",
  description:
    "Probe a URL for an x402 paywall and, if priced within guardrails, pay and return the content.",
  async run(ctx, { url, category }) {
    const svc = await ctx.discover(url);
    if (!svc.paid) {
      ctx.log(`${url} is not paywalled (status ${svc.status}); fetching free.`);
    } else {
      const opt = svc.accepts[0];
      ctx.log(
        `paywall: $${opt?.amountUsdc ?? "?"} on ${opt?.network} → ${opt?.payTo}`,
      );
    }
    return ctx.pay(url, { category });
  },
};

/**
 * Built-in skill: search the marketplace for a capability, then pay the first
 * affordable result. The agent's "search before declining" move.
 */
export const acquireCapabilitySkill: Skill<
  { keyword: string; category?: string },
  PayOutcome | { found: false }
> = {
  name: "acquire-capability",
  description:
    "Search the Circle x402 marketplace for a keyword and pay the first service that fits guardrails.",
  async run(ctx, { keyword, category }) {
    const hits = ctx.search(keyword);
    ctx.log(`marketplace returned ${hits.length} result(s) for "${keyword}"`);
    for (const hit of hits) {
      if (!hit.url) continue;
      const outcome = await ctx.pay(hit.url, { category });
      if (outcome.ok) return outcome;
      ctx.log(`skipped ${hit.url}: ${outcome.reason}`);
    }
    return { found: false };
  },
};
