# circle-agent (autonomous payment agent)

An autonomous AI agent that **discovers and pays for x402 services on its own**,
using its own wallet, Circle Gateway nanopayments, and built-in compliance
guardrails. It lives alongside the explainer demo in this repo (`server.ts`,
`buyer.ts`, `decode-batch.ts`) and reuses the same `@circle-fin/x402-batching`
Gateway client the demo buyer uses.

What it does:

- **Own wallet** — generates and persists its own secp256k1 key on first run
  (`agent/.agent-key`, chmod 600). Address is derived via `viem`.
- **Discovers x402 services** — probes any URL for a `402 Payment Required`
  challenge and decodes the price/seller/network, or searches the Circle
  services marketplace via the `circle` CLI.
- **Nanopayments down to $0.000001** — the smallest USDC unit (1 atomic unit).
  The repo's `server.ts` exposes a `/nano` endpoint priced at exactly that.
- **Gas-free, batched** — every payment settles through Circle Gateway: the
  agent signs an EIP-712 authorization off-chain, the facilitator settles in
  <500ms, and Circle's relayer batches the on-chain `submitBatch` later. The
  agent never pays gas per call.
- **Cross-chain** — one `GatewayClient` per funded chain, unified Gateway
  balance, instant cross-chain rebalancing (`rebalance()`).
- **Compliance guardrails** — per-payment / hourly / daily spend caps, host
  allow/block lists, and category screening. Every decision (allowed, denied,
  settled, failed) is written to an append-only audit ledger.
- **Skills** — a small pluggable registry of capabilities the agent can invoke
  (`fetch-paid-resource`, `acquire-capability`), mirroring Circle's own skills.

USDC is the native gas token on **Arc Testnet**, the default chain.

## Layout

```
agent/
  config.ts      constants, guardrail + agent config types, $0.000001 floor
  wallet.ts      generate / load the agent's own key (self-custody via viem)
  ledger.ts      append-only JSONL audit log + rolling-window spend math
  guardrails.ts  policy gate: amount caps, allow/block lists, categories
  discovery.ts   probe(url) for 402 challenges + Circle marketplace search
  skills.ts      pluggable skill registry + two built-in skills
  agent.ts       CircleAgent: ties wallet + guardrails + Gateway + skills
  cli.ts         command-line entry point (npm run agent -- <cmd>)
  index.ts       library barrel for `import { CircleAgent }`
```

## Usage

```bash
npm install

# 0. Readiness check — is the agent ready to go live? (all ✓ + "READY")
npm run agent -- doctor

# 1. Create / show the agent's wallet (persists agent/.agent-key on first run)
npm run agent -- wallet

# 2. Fund that address with testnet USDC: https://faucet.circle.com/
#    then deposit into Gateway (one-time) for nanopayments:
#    circle gateway deposit --amount 0.5 --address <agent-addr> --chain ARC-TESTNET

# 3. Check balances (wallet + Gateway)
npm run agent -- balances

# 4. Discover a paywall without paying
npm run agent -- discover http://localhost:3000/nano

# 5. Pay for a resource — discovery → guardrail check → Gateway settlement
npm run agent -- pay http://localhost:3000/nano

# 6. Search the Circle services marketplace
npm run agent -- search crypto

# 7. List and run skills
npm run agent -- skills
npm run agent -- skill fetch-paid-resource '{"url":"http://localhost:3000/nano"}'

# 8. Inspect the audit ledger
npm run agent -- audit
```

Run the bundled paywall server in another terminal as a local target:

```bash
npm start    # serves /hello-world ($0.01) and /nano ($0.000001)
```

## Readiness & testing (is it ready to deploy?)

Two commands answer "is the agent live-ready?" — one interactive, one for CI.

### `doctor` — dependency check

```bash
npm run agent -- doctor
```

Reports PASS / WARN / FAIL for each dependency and prints `READY` or
`NOT READY` (exit 1 on any hard FAIL). Hard requirements: wallet key, Arc
Testnet RPC, and **Circle Gateway API reachability** (payments can't settle
without it). Soft warnings: zero on-chain or Gateway balance.

```
  ✓ wallet key             address 0x7ba0…Ff57
  ✓ RPC (Arc Testnet)      chainId 5042002, block #48363625
  ✓ on-chain USDC          38.996856 USDC
  ✓ Circle Gateway API     https://gateway-api-testnet.circle.com → HTTP 200
  ✓ Gateway balance        1 USDC available
  ✓ guardrails             per-pay ≤ $1, hour ≤ $5, day ≤ $20, floor $0.000001
  ✓ x402 network           eip155:5042002

READY — all hard dependencies green. Safe to run live.
```

### `agent:smoke` — end-to-end pass/fail

```bash
npm run agent:smoke
```

Boots the paywall server on `SMOKE_PORT` (default 3100), then runs the full
live path: **doctor → discover (expect 402) → pay (expect settlement) → audit
(expect the ledger entry)**. Exits `0` only if a real $0.000001 nanopayment
settled, `1` otherwise — drop it straight into CI or a pre-deploy gate.

Env knobs: `SMOKE_PORT`, `SMOKE_MAX_LATENCY` (ms, default 500; over-budget is a
warning, not a failure), plus all `AGENT_*` / `PRIVATE_KEY` / `ARC_TESTNET_RPC`
vars the CLI honours.

> Both commands need outbound access to `gateway-api-testnet.circle.com` and a
> funded Gateway balance. In a network-restricted sandbox the Gateway API check
> fails fast (by design) and smoke never starts the server — run them on a host
> with internet access.

## Troubleshooting: "Circle Gateway API unreachable (fetch failed)"

If `doctor` shows `✗ Circle Gateway API ... fetch failed` even though you have
internet, your network is likely **hijacking DNS for `*.circle.com`**. Some
ISP-level content filters (e.g. Indonesia's "Internet Sehat") resolve
`gateway-api-testnet.circle.com` to a filter box that serves a bogus TLS cert
and 302-redirects to a block page; Node's `fetch` then fails closed.

Diagnose:

```bash
# Hijacked: resolves to a non-Cloudflare IP and -k shows a 302 to a block page
curl -sk -D - -o /dev/null https://gateway-api-testnet.circle.com/v1/x402/supported | grep -i location
# Real IP via encrypted DNS (should be Cloudflare 104.18.x.x):
curl -s -H 'accept: application/dns-json' \
  'https://cloudflare-dns.com/dns-query?name=gateway-api-testnet.circle.com&type=A'
```

**The agent fixes this automatically.** `agent/net.ts` installs a global
DNS-over-HTTPS resolver for `*.circle.com`: it resolves those hosts via
`cloudflare-dns.com` / `dns.google` (which the hijack can't tamper with) and
connects to the real IP with the correct TLS SNI. It's wired into `cli.ts`,
`smoke.ts`, `server.ts`, `buyer.ts`, and `decode-batch.ts`, so the whole
payment path is covered with no extra steps. Controls:

| Env var | Effect |
|---|---|
| `AGENT_DOH=0` | disable the DoH resolver (use system DNS) |
| `AGENT_DOH_URL=<url>` | use a custom DoH endpoint instead of Cloudflare |

The block here is **DNS-only** (SNI/IP aren't filtered), so DoH fully resolves
it — no VPN required. Note the standalone **`circle` CLI** is a separate binary
this fix can't patch; if you use it on a hijacking network, add an
`/etc/hosts` entry (`104.18.26.249 gateway-api-testnet.circle.com`) or a VPN.



### As a library

```ts
import { CircleAgent } from "./agent/index.ts";
import { loadOrCreateWallet } from "./agent/wallet.ts";
import { DEFAULT_GUARDRAILS, DEFAULT_CHAIN } from "./agent/config.ts";

const { privateKey } = loadOrCreateWallet("agent/.agent-key");
const agent = new CircleAgent({
  privateKey,
  chain: DEFAULT_CHAIN,
  ledgerPath: "agent/ledger.jsonl",
  guardrails: { ...DEFAULT_GUARDRAILS, maxPerPayment: 0.05 },
});

const out = await agent.pay("http://localhost:3000/nano");
if (out.ok) console.log(`paid $${out.amountUsdc} in ${out.latencyMs}ms — ${out.settlementId}`);
else console.log(`refused: ${out.reason}`);
```

## Guardrail configuration

Caps and lists default from `DEFAULT_GUARDRAILS` in `agent/config.ts` and can be
overridden per-run via environment variables read by `cli.ts`:

| Env var | Meaning | Default |
|---|---|---|
| `AGENT_MAX_PER_PAYMENT` | reject any single payment above this (USDC) | `1.0` |
| `AGENT_MAX_PER_HOUR` | rolling 1-hour spend ceiling | `5.0` |
| `AGENT_MAX_PER_DAY` | rolling 24-hour spend ceiling | `20.0` |
| `AGENT_ALLOWED_HOSTS` | comma-separated allowlist (empty = any) | _(empty)_ |
| `AGENT_BLOCKED_HOSTS` | comma-separated blocklist | _(empty)_ |
| `AGENT_KEY_PATH` | where the agent's key is stored | `agent/.agent-key` |
| `AGENT_LEDGER_PATH` | audit ledger path | `agent/ledger.jsonl` |
| `PRIVATE_KEY` | use this key instead of the persisted file | _(unset)_ |

The minimum per-payment floor is the smallest USDC unit, `$0.000001`, and is not
overridable — it defends against fee-dust griefing while still permitting true
nanopayments.

## How a payment flows

1. `agent.pay(url)` calls `probe(url)` — a plain `GET` that reads the
   `402 Payment Required` challenge and decodes the `accepts[]` (price, seller,
   network) without spending anything.
2. The exact price + host + category go through `Guardrails.check()`, which
   consults the ledger for rolling hourly/daily spend. A denial is logged and
   returned as `{ ok: false, reason }` — the agent never signs.
3. If allowed, the `GatewayClient` for the chosen chain signs the EIP-712
   authorization and submits it to Circle's facilitator. Settlement returns a
   UUID in <500ms; the result is logged as `settled` with that id.
4. `decode-batch.ts` (already in this repo) can later unpack the on-chain
   `submitBatch` tx that batches this settlement with others.

## Notes on the Circle CLI

`discovery.searchMarketplace()` shells out to the `circle` CLI
(`circle services search … --chain ARC-TESTNET --output json`) with
`CIRCLE_ACCEPT_TERMS=1`. If the CLI isn't installed or the discovery API is
unreachable, it returns `[]` and the agent falls back to direct `probe()` of
known URLs. Circle's own skills (`circle skill list`) — `pay-via-agent-wallet`,
`fund-agent-wallet`, `agent-wallet-policy` — document the managed agent-wallet
path that complements this self-custody agent.
