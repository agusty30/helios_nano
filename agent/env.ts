/**
 * Build an AgentConfig from environment variables + persisted/passed key.
 *
 * Shared by every entrypoint (cli, smoke, worker) so wallet resolution and
 * guardrail overrides behave identically everywhere.
 *
 * Wallet: uses PRIVATE_KEY if set, otherwise loads/creates the key file at
 * AGENT_KEY_PATH. Guardrails fall back to DEFAULT_GUARDRAILS when the matching
 * AGENT_* var is unset.
 */
import { resolve } from "node:path";
import { loadOrCreateWallet } from "./wallet.ts";
import {
  DEFAULT_CHAIN,
  DEFAULT_GUARDRAILS,
  ARC_TESTNET_RPC,
  type AgentConfig,
} from "./config.ts";

export function buildConfigFromEnv(): AgentConfig {
  const keyPath = process.env.AGENT_KEY_PATH ?? resolve("agent/.agent-key");
  const ledgerPath =
    process.env.AGENT_LEDGER_PATH ?? resolve("agent/ledger.jsonl");
  const wallet = process.env.PRIVATE_KEY
    ? { privateKey: process.env.PRIVATE_KEY as `0x${string}` }
    : loadOrCreateWallet(keyPath);

  const num = (v: string | undefined, d: number) =>
    v !== undefined ? Number(v) : d;

  return {
    privateKey: wallet.privateKey,
    chain: DEFAULT_CHAIN,
    rpcUrl: process.env.ARC_TESTNET_RPC ?? ARC_TESTNET_RPC,
    ledgerPath,
    guardrails: {
      ...DEFAULT_GUARDRAILS,
      maxPerPayment: num(process.env.AGENT_MAX_PER_PAYMENT, DEFAULT_GUARDRAILS.maxPerPayment),
      maxPerHour: num(process.env.AGENT_MAX_PER_HOUR, DEFAULT_GUARDRAILS.maxPerHour),
      maxPerDay: num(process.env.AGENT_MAX_PER_DAY, DEFAULT_GUARDRAILS.maxPerDay),
      allowedHosts:
        process.env.AGENT_ALLOWED_HOSTS?.split(",").filter(Boolean) ??
        DEFAULT_GUARDRAILS.allowedHosts,
      blockedHosts:
        process.env.AGENT_BLOCKED_HOSTS?.split(",").filter(Boolean) ??
        DEFAULT_GUARDRAILS.blockedHosts,
    },
  };
}
