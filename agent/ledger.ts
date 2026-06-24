/**
 * Append-only audit ledger.
 *
 * Every payment attempt — allowed or denied — is written as one JSON line so
 * the agent's spend is fully auditable and the guardrails can compute rolling
 * windows by replaying recent entries. This is the compliance system of record.
 */
import { appendFileSync, existsSync, readFileSync } from "node:fs";

export type LedgerOutcome = "allowed" | "denied" | "settled" | "failed";

export interface LedgerEntry {
  /** ISO-8601 timestamp. */
  ts: string;
  outcome: LedgerOutcome;
  /** Resource URL that was (or would be) paid. */
  url: string;
  host: string;
  /** Amount in whole USDC. */
  amountUsdc: number;
  chain: string;
  /** Settlement UUID / tx hash from Gateway, present once settled. */
  settlementId?: string;
  /** Reason string when denied or failed. */
  reason?: string;
}

export class Ledger {
  constructor(private readonly path: string) {}

  append(entry: LedgerEntry): void {
    appendFileSync(this.path, JSON.stringify(entry) + "\n");
  }

  /** Read all entries (used by guardrails for rolling-window math and audits). */
  all(): LedgerEntry[] {
    if (!existsSync(this.path)) return [];
    return readFileSync(this.path, "utf8")
      .split("\n")
      .filter((l) => l.trim().length > 0)
      .map((l) => JSON.parse(l) as LedgerEntry);
  }

  /** Sum of settled+allowed spend within the last `windowMs` milliseconds. */
  spentSince(nowMs: number, windowMs: number): number {
    const cutoff = nowMs - windowMs;
    return this.all()
      .filter((e) => e.outcome === "settled" || e.outcome === "allowed")
      .filter((e) => new Date(e.ts).getTime() >= cutoff)
      .reduce((sum, e) => sum + e.amountUsdc, 0);
  }
}
