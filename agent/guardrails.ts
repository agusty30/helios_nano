/**
 * Compliance guardrails — the policy gate every payment passes through before
 * the agent signs anything.
 *
 * Checks, in order: amount floor/ceiling, host allow/block lists, category
 * screening, and rolling hourly/daily spend ceilings computed from the ledger.
 * A denial is itself recorded to the ledger by the caller for auditability.
 */
import type { GuardrailConfig } from "./config.ts";
import type { Ledger } from "./ledger.ts";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

export interface PaymentIntent {
  url: string;
  host: string;
  amountUsdc: number;
  /** Optional service category for screening (from discovery metadata). */
  category?: string;
}

export interface GuardrailDecision {
  allowed: boolean;
  reason?: string;
}

export class Guardrails {
  constructor(
    private readonly cfg: GuardrailConfig,
    private readonly ledger: Ledger,
  ) {}

  /** Evaluate a payment intent against all policies. */
  check(intent: PaymentIntent, nowMs: number): GuardrailDecision {
    const { amountUsdc, host, category } = intent;

    if (amountUsdc < this.cfg.minPerPayment) {
      return {
        allowed: false,
        reason: `amount $${amountUsdc} below floor $${this.cfg.minPerPayment}`,
      };
    }
    if (amountUsdc > this.cfg.maxPerPayment) {
      return {
        allowed: false,
        reason: `amount $${amountUsdc} exceeds per-payment cap $${this.cfg.maxPerPayment}`,
      };
    }

    if (this.cfg.blockedHosts.includes(host)) {
      return { allowed: false, reason: `host ${host} is blocked` };
    }
    if (
      this.cfg.allowedHosts.length > 0 &&
      !this.cfg.allowedHosts.includes(host)
    ) {
      return { allowed: false, reason: `host ${host} not in allowlist` };
    }

    if (category && this.cfg.blockedCategories.includes(category.toLowerCase())) {
      return { allowed: false, reason: `category "${category}" is blocked` };
    }

    const spentHour = this.ledger.spentSince(nowMs, HOUR_MS);
    if (spentHour + amountUsdc > this.cfg.maxPerHour) {
      return {
        allowed: false,
        reason: `hourly cap $${this.cfg.maxPerHour} would be exceeded ` +
          `(spent $${spentHour.toFixed(6)} + $${amountUsdc})`,
      };
    }

    const spentDay = this.ledger.spentSince(nowMs, DAY_MS);
    if (spentDay + amountUsdc > this.cfg.maxPerDay) {
      return {
        allowed: false,
        reason: `daily cap $${this.cfg.maxPerDay} would be exceeded ` +
          `(spent $${spentDay.toFixed(6)} + $${amountUsdc})`,
      };
    }

    return { allowed: true };
  }
}
