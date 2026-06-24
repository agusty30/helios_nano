/**
 * Central configuration for the autonomous Circle x402 agent.
 *
 * Defaults target Arc Testnet, where USDC is the native gas token and Circle
 * Gateway settles nanopayments off-chain in <500ms before batching them on-chain.
 */
import type { SupportedChainName } from "@circle-fin/x402-batching/client";

/** USDC has 6 decimals. 1 atomic unit = $0.000001 — the smallest nanopayment. */
export const USDC_DECIMALS = 6;
export const USDC_ATOMIC = 10 ** USDC_DECIMALS;

/** Smallest payment the agent will ever make: 1 atomic unit = $0.000001. */
export const MIN_PAYMENT_USDC = 1 / USDC_ATOMIC;

/** Gateway API per network (settlement + transfer lookups). */
export const GATEWAY_API_TESTNET = "https://gateway-api-testnet.circle.com";

/** Arc Testnet network id used in x402 `accepts[].network` (CAIP-2). */
export const ARC_TESTNET_NETWORK = "eip155:5042002";
export const ARC_TESTNET_RPC =
  "https://rpc.testnet.arc-node.thecanteenapp.com/v1/swrm_3aa8a9334770e6eddb5cc05f2e3dbfe555eca270d4eb78fbb4b6056a4a04e2b0";

/**
 * Chains the agent can transact on. The agent spins up one GatewayClient per
 * chain it is funded on; Gateway gives a unified USDC balance across all of
 * them with instant (<500ms) cross-chain settlement.
 */
export const DEFAULT_CHAIN: SupportedChainName = "arcTestnet";
export const CROSS_CHAIN_CANDIDATES: SupportedChainName[] = [
  "arcTestnet",
  "baseSepolia",
  "arbitrumSepolia",
  "avalancheFuji",
  "optimismSepolia",
  "polygonAmoy",
];

/**
 * Compliance guardrails. Every payment is checked against these before the
 * agent signs anything. Amounts are in whole USDC.
 */
export interface GuardrailConfig {
  /** Reject any single payment above this. */
  maxPerPayment: number;
  /** Rolling 1-hour spend ceiling across all payments. */
  maxPerHour: number;
  /** Rolling 24-hour spend ceiling across all payments. */
  maxPerDay: number;
  /** Reject payments below this (defends against fee-dust griefing). */
  minPerPayment: number;
  /**
   * If non-empty, only hostnames in this list may be paid. Empty = allow any
   * host that isn't explicitly blocked.
   */
  allowedHosts: string[];
  /** Hostnames that are always rejected, even if otherwise allowed. */
  blockedHosts: string[];
  /** Free-text categories the agent must refuse (sanctions-style screening). */
  blockedCategories: string[];
}

export const DEFAULT_GUARDRAILS: GuardrailConfig = {
  maxPerPayment: 1.0,
  maxPerHour: 5.0,
  maxPerDay: 20.0,
  minPerPayment: MIN_PAYMENT_USDC,
  allowedHosts: [],
  blockedHosts: [],
  blockedCategories: ["gambling", "weapons", "sanctioned"],
};

export interface AgentConfig {
  /** Private key for the agent's own wallet (0x-prefixed hex). */
  privateKey: `0x${string}`;
  /** Chain the agent transacts on by default. */
  chain: SupportedChainName;
  /** Optional RPC override (defaults to the chain's built-in RPC). */
  rpcUrl?: string;
  /** Compliance guardrails. */
  guardrails: GuardrailConfig;
  /** Path to the append-only audit ledger. */
  ledgerPath: string;
}
