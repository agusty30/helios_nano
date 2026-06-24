/**
 * Public surface of the autonomous Circle x402 agent.
 *
 *   import { CircleAgent } from "./agent/index.ts";
 *   const agent = new CircleAgent({ ... });
 *   const out = await agent.pay("https://api.example.com/data");
 */
export { CircleAgent } from "./agent.ts";
export type { PayOutcome } from "./agent.ts";
export { loadOrCreateWallet, generateWallet, addressFor } from "./wallet.ts";
export type { AgentWallet } from "./wallet.ts";
export { Guardrails } from "./guardrails.ts";
export type { PaymentIntent, GuardrailDecision } from "./guardrails.ts";
export { Ledger } from "./ledger.ts";
export type { LedgerEntry, LedgerOutcome } from "./ledger.ts";
export { probe, discover, searchMarketplace } from "./discovery.ts";
export type {
  DiscoveredService,
  PaymentOption,
  MarketplaceService,
} from "./discovery.ts";
export {
  SkillRegistry,
  fetchPaidResourceSkill,
  acquireCapabilitySkill,
} from "./skills.ts";
export type { Skill, SkillContext } from "./skills.ts";
export * from "./config.ts";
