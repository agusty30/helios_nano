/**
 * The agent's own wallet.
 *
 * The agent holds its private key directly (via viem) so it can sign EIP-712
 * payment authorizations for Circle Gateway with zero round-trips. A fresh key
 * is generated and persisted to disk on first run; thereafter it is loaded.
 *
 * For a managed/custodial alternative, see `circle wallet create` (agent
 * wallets) — `cli.ts` wraps that surface. This file is the self-custody path
 * used by the autonomous payment loop.
 */
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync, chmodSync } from "node:fs";
import { privateKeyToAccount } from "viem/accounts";
import type { Address } from "viem";

export interface AgentWallet {
  privateKey: `0x${string}`;
  address: Address;
}

/** Generate a brand-new random wallet (32-byte secp256k1 key). */
export function generateWallet(): AgentWallet {
  const privateKey = `0x${randomBytes(32).toString("hex")}` as `0x${string}`;
  const account = privateKeyToAccount(privateKey);
  return { privateKey, address: account.address };
}

/** Derive the public address for an existing key without exposing the key. */
export function addressFor(privateKey: `0x${string}`): Address {
  return privateKeyToAccount(privateKey).address;
}

/**
 * Load the agent's wallet from `keyPath`, creating and persisting a new one if
 * the file is absent. The key file is chmod 600 so it isn't world-readable.
 */
export function loadOrCreateWallet(keyPath: string): AgentWallet {
  if (existsSync(keyPath)) {
    const privateKey = readFileSync(keyPath, "utf8").trim() as `0x${string}`;
    if (!/^0x[0-9a-fA-F]{64}$/.test(privateKey)) {
      throw new Error(`malformed private key in ${keyPath}`);
    }
    return { privateKey, address: addressFor(privateKey) };
  }
  const wallet = generateWallet();
  writeFileSync(keyPath, wallet.privateKey, { mode: 0o600 });
  chmodSync(keyPath, 0o600);
  return wallet;
}
