# helios_nano

**An autonomous AI agent that discovers and pays for x402 services on its own** —
with its own wallet, Circle Gateway nanopayments down to **$0.000001**, gas-free
batched settlement in **<500ms**, cross-chain USDC, and built-in compliance
guardrails. Targets **Arc Testnet**, where USDC is the native gas token.

It ships as one repo with three parts:

1. **The agent** (`agent/`) — the headline. Generates its own wallet, probes
   URLs / the Circle marketplace for x402 paywalls, vets every payment against
   spend caps + allow/block lists, settles via Circle Gateway, and writes an
   append-only audit ledger. Has a `doctor` readiness check and a one-command
   end-to-end smoke test.
2. **A paywall server** (`server.ts`) — a tiny x402 seller exposing
   `/hello-world` ($0.01) and `/nano` ($0.000001) so the agent has a real,
   traceable target.
3. **A payment-trace explainer** (`decode-batch.ts`, `public/buyer.html`) —
   unpacks the on-chain Gateway `submitBatch` tx and renders the full settlement
   lifecycle step by step.

---

## Why it matters

x402 + stablecoin micropayments let an agent pay per API call in USDC with **no
API keys, no signup, no prefunded billing**. helios_nano turns that into an
autonomous loop: *search for a capability → check the price → pay if it's within
policy → use the result*, all without a human in the loop and all auditable
after the fact.

| Capability | How |
|---|---|
| **Own wallet** | secp256k1 key generated + persisted on first run (`viem`) |
| **Service discovery** | `probe(url)` decodes 402 challenges; `circle services search` for the marketplace |
| **Nanopayments** | down to `$0.000001` (1 USDC atomic unit) |
| **Gas-free + batched** | Circle Gateway: sign EIP-712 off-chain → facilitator settles → relayer batches the on-chain tx |
| **<500ms settlement** | Gateway returns a settlement UUID near-instantly; on-chain batch follows |
| **Cross-chain** | one `GatewayClient` per funded chain, unified balance, instant rebalancing |
| **Compliance guardrails** | per-payment / hourly / daily caps, host allow/block lists, category screening |
| **Auditability** | every decision (allowed/denied/settled/failed) appended to a JSONL ledger |

---

## Quick start (local, no Docker)

```bash
npm install

# 1. Readiness check — expect all ✓ and "READY"
npm run agent -- doctor

# 2. Create / show the agent's wallet (persists agent/.agent-key on first run)
npm run agent -- wallet
#    Fund it with testnet USDC: https://faucet.circle.com/
#    then deposit into Gateway for nanopayments (see "Funding" below).

# 3. Full end-to-end smoke test (boots the server, pays /nano, checks the ledger)
npm run agent:smoke           # → "SMOKE: PASS", exit 0 when live-ready

# 4. Or drive it by hand: run the server in one terminal…
npm start                     # serves /hello-world and /nano on :3000
#    …and in another:
npm run agent -- discover http://localhost:3000/nano
npm run agent -- pay http://localhost:3000/nano
npm run agent -- audit
```

**Prerequisites:** Node 20+ (22 LTS recommended). An Arc Testnet wallet funded
with testnet USDC.

---

## Quick start (Docker)

The image runs the paywall server by default and the agent CLI on demand.

```bash
cp .env.example .env          # optional: set PRIVATE_KEY, guardrails, etc.

# Paywall server live on http://localhost:3000
docker compose up --build server

# Agent commands (separate terminal) — note the service hostname `server`:
docker compose run --rm agent doctor
docker compose run --rm agent pay http://server:3000/nano
docker compose run --rm agent audit

# Full smoke test inside the container:
docker compose run --rm --entrypoint npm agent run agent:smoke
```

The agent's wallet key and audit ledger persist in the `agent-data` Docker
volume (`/data/.agent-key`, `/data/ledger.jsonl`) — kept out of the image and
out of git. For hosting, set `PRIVATE_KEY` in the environment instead and the
agent uses that key directly.

### Deploy as a hosted service

The same image runs anywhere that takes a container (Fly.io, Render, Railway,
ECS, a VM). It listens on `$PORT` (default 3000). Provide `PRIVATE_KEY` as a
secret and, if your host can't reach `gateway-api-testnet.circle.com` via normal
DNS, leave `AGENT_DOH=1` (the default) — see **Troubleshooting** below.

---

## Architecture

```
agent/
  config.ts      constants, guardrail + agent config, the $0.000001 floor
  wallet.ts      generate / load the agent's own key (self-custody via viem)
  net.ts         DNS-over-HTTPS resolver (bypasses ISP hijacking of *.circle.com)
  ledger.ts      append-only JSONL audit log + rolling-window spend math
  guardrails.ts  policy gate: amount caps, allow/block lists, categories
  discovery.ts   probe(url) for 402 challenges + Circle marketplace search
  skills.ts      pluggable skill registry + two built-in skills
  agent.ts       CircleAgent: wallet + guardrails + Gateway pay + cross-chain
  doctor.ts      readiness check (wallet, RPC, Gateway API, balances)
  smoke.ts       end-to-end CI gate: doctor → discover → pay → audit
  cli.ts         command-line entry point
  index.ts       library barrel for `import { CircleAgent }`

server.ts          x402 paywall server (/hello-world $0.01, /nano $0.000001)
buyer.ts           minimal CLI buyer (pay from a raw private key)
decode-batch.ts    decode an on-chain Gateway submitBatch tx
public/buyer.html  browser buyer + step-by-step payment trace UI
```

### How a payment flows

1. `agent.pay(url)` probes the URL, reads the `402` challenge, and decodes the
   exact price/seller/network — no money moves yet.
2. The price + host + category go through `Guardrails.check()`, which consults
   the ledger for rolling hourly/daily spend. A denial is logged and returned
   as `{ ok: false, reason }`; the agent never signs.
3. If allowed, the chain's `GatewayClient` signs the EIP-712 authorization and
   submits it to Circle's facilitator. A settlement UUID returns in <500ms and
   is logged as `settled`.
4. Circle's relayer later batches that settlement into one on-chain
   `submitBatch` tx — which `decode-batch.ts` and `public/buyer.html` can unpack.

---

## Funding the agent

```bash
# 1. Fund the agent's address with testnet USDC
npm run agent -- wallet                 # prints the address
#    → https://faucet.circle.com/

# 2. Deposit into Circle Gateway for nanopayments (one-time, on-chain)
#    Either via the Circle CLI…
CIRCLE_ACCEPT_TERMS=1 circle gateway deposit \
  --amount 1 --address <agent-address> --chain ARC-TESTNET --method direct
#    …or the agent already holds the key, so a GatewayClient deposit works too.

# 3. Confirm
npm run agent -- balances
```

---

## Guardrail configuration

Defaults live in `DEFAULT_GUARDRAILS` (`agent/config.ts`) and can be overridden
per-run via environment variables:

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
| `AGENT_DOH` | DNS-over-HTTPS bypass on/off | `1` |

The `$0.000001` per-payment floor is fixed (not overridable) — it permits true
nanopayments while blocking fee-dust griefing.

---

## Readiness & testing

- **`npm run agent -- doctor`** — PASS/WARN/FAIL per dependency (wallet, RPC,
  Gateway API, balances, guardrails) and a `READY` / `NOT READY` verdict
  (exit 1 on any hard FAIL).
- **`npm run agent:smoke`** — boots the server and runs the full live path
  (doctor → discover → pay → audit). Exits `0` only if a real `$0.000001`
  nanopayment settled. Drop it into CI as a pre-deploy gate.
- **`npm run agent:typecheck`** — strict TypeScript check across the agent and
  the root entrypoints.

---

## Troubleshooting: "Circle Gateway API unreachable (fetch failed)"

If `doctor` shows `✗ Circle Gateway API … fetch failed` despite working
internet, your network is probably **hijacking DNS for `*.circle.com`** (some
ISP content filters resolve `gateway-api-testnet.circle.com` to a filter box
with a bogus TLS cert). helios_nano fixes this automatically: `agent/net.ts`
resolves `*.circle.com` over **DNS-over-HTTPS** (Cloudflare / Google) and
connects to the real IP with the correct TLS SNI. It's wired into every
entrypoint, so no action is needed; toggle with `AGENT_DOH=0/1`.

The standalone `circle` CLI is a separate binary this fix can't patch — on a
hijacking network add `104.18.26.249 gateway-api-testnet.circle.com` to
`/etc/hosts`, or use a VPN.

See **`agent/README.md`** for the deep-dive on the agent internals, skills, and
the payment lifecycle walkthrough.

---

## Security notes

- The agent key is **self-custody and testnet-only**. It's gitignored
  (`agent/.agent-key`) and never baked into the Docker image. Use a throwaway
  key; never point `PRIVATE_KEY` at a mainnet wallet.
- The audit ledger (`agent/ledger.jsonl`) is gitignored too.
- Guardrails are enforced before signing, but they are a policy layer, not a
  custody boundary — keep balances small on testnet.

## License

ISC.
