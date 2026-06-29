# HeliOS — AI Financial Operating System

**Autonomous AI-powered financial platform for managing wallets, multi-agent operations, API cost optimization, and on-chain USDC settlements** — built on Next.js 15, PostgreSQL, and Arc Testnet.

**Live:** https://helios-pay.up.railway.app
**Backend:** https://back-helios-pay.up.railway.app

---

## Overview

HeliOS is a production-grade financial operating system where 8 AI agents autonomously manage payments, track API spending across 16+ providers, enforce budget policies, and optimize costs — all with human-in-the-loop approvals, encrypted wallet management, and full audit trails.

### Key Features

| Feature | Description |
|---|---|
| **8-Agent Architecture** | Budget, Payment, Treasury, Procurement, API Cost, Reporting, Optimization, and Notification agents — each with health monitoring, execution metrics, and task queues |
| **Mission Control** | Natural language command interface with 15+ command types, real execution timeline, structured logs, correlation IDs, and agent routing |
| **Wallet System** | Generate or import wallets via encrypted private keys (AES-256-GCM), on-chain USDC balance queries, real on-chain transfers between wallets |
| **API Cost Management** | Track 16+ vendors/providers, 100+ usage records, daily budget enforcement ($10 USDC), budget alerts, cost optimization recommendations |
| **Executive KPI Dashboard** | Real-time KPIs computed from live DB data, 14-day trend charts via KPI snapshots, agent leaderboard ranked by success rate |
| **RBAC** | Role-based access (ADMIN > FINANCE > VIEWER) enforced on every API route |
| **On-chain Settlements** | Native USDC transfers on Arc Testnet (chainId 5042002) with real tx hashes verifiable on arcscan |
| **x402 Nanopayments** | Circle Gateway settlement down to $0.000001 via FastAPI backend |
| **Production Acceptance Testing** | Automated PAT route that resets test data and populates 400+ realistic records across all tables |

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 15 (App Router), React 19, TypeScript 5 |
| **Styling** | Tailwind CSS, Framer Motion, Lucide React icons |
| **Database** | PostgreSQL + Prisma ORM (27 models) |
| **Auth** | NextAuth.js v5 (beta.31), PrismaAdapter, Credentials provider, JWT sessions |
| **Encryption** | AES-256-GCM for private keys via Node.js `crypto` module |
| **Backend** | FastAPI (Python) with LLM routing (OpenAI / Anthropic / OpenRouter) |
| **Blockchain** | Arc Testnet (chainId 5042002), ethers v6, native USDC (18-decimal wei) |
| **Charts** | Recharts for spending trends and cost analytics |
| **Validation** | Zod v4 (13 schemas) |
| **Testing** | Vitest v4.1.9 (61 tests) |
| **CI/CD** | GitHub Actions (lint, type-check, test, build) |
| **Hosting** | Railway (auto-deploy on push to main) |

---

## Architecture

```
frontend/                             Next.js 15 App Router
  src/
    app/
      (dashboard)/
        dashboard/page.tsx            Executive KPI dashboard + trend charts
        mission-control/page.tsx      NL command interface + execution timeline
        wallets/page.tsx              Wallet management (generate/import/transfer/delete)
        agents/page.tsx               8-agent fleet — health, metrics, task queues
        transactions/page.tsx         Transaction history with tx hashes
        api-costs/page.tsx            Provider cost tracking + daily analytics
        budgets/page.tsx              Budget rules + utilization monitoring
        approvals/page.tsx            Approval queue with AI recommendations
        analytics/page.tsx            Traction metrics + performance analytics
        reports/page.tsx              Generated financial reports
        settings/page.tsx             Org settings, policies, team, system status
      api/
        auth/                         NextAuth.js + register/verify/reset
        agents/                       Agent CRUD + metrics
        wallets/                      Wallet CRUD + balance + transfer
        tasks/                        Command execution (15+ handlers)
        kpi/                          Live KPIs + snapshots + agent leaderboard
        api-costs/                    Aggregated cost analytics
        vendors/                      Vendor management
        api-services/                 API service configs
        reports/                      Report generation
        notifications/                Bell notifications
        logs/                         Structured execution logs
        budget/                       Budget engine + optimization
        pat/run/                      Production Acceptance Testing
        health/                       Liveness + DB migration runner
        ready/                        Readiness probe
        metrics/                      System metrics
    lib/
      session.ts                      RBAC helpers (requireAuth, requireRole)
      command-parser.ts               15+ NL command patterns
      agent-manager.ts                Task routing + agent metrics + health
      budget-engine.ts                Budget state + optimization engine
      crypto.ts                       AES-256-GCM encrypt/decrypt for private keys
      validation.ts                   13 Zod input schemas
      rate-limit.ts                   In-memory rate limiter
      utils.ts                        formatUsdc, cn, helpers
      types.ts                        TypeScript interfaces (35+ types)
    components/
      layout/Sidebar.tsx              Navigation sidebar
      dashboard/                      KPI cards, spending chart, cost breakdown
      ui/                             NotificationBell, ErrorBoundary, Skeleton

backend/                              FastAPI Python service
  main.py                             x402 payment endpoints, LLM routing
  task_runner.py                      Agent task execution
```

### Database Schema (27 models)

| Category | Models |
|---|---|
| **Auth** | User, Organization, Account, Session, VerificationToken, EmailVerification, PasswordResetToken, LoginAttempt |
| **Financial** | Wallet, Transaction, Approval, Report, PaymentPolicy |
| **Agents** | Agent, AgentMetric, Task, ExecutionLog |
| **API Costs** | Vendor, Subscription, ApiService, ApiUsage, BudgetRule |
| **System** | AuditLog, Notification, Setting, ApiKeyRecord, KpiSnapshot |

---

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database
- npm

### Local Development

```bash
cd frontend
npm install
npx prisma generate

# Set environment variables
cp .env.example .env.local
# Required: DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL

npm run dev
```

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Yes | JWT signing secret (also used for wallet key encryption) |
| `NEXTAUTH_URL` | Yes | App URL (e.g. `http://localhost:3000`) |
| `ENCRYPTION_KEY` | No | Custom AES-256 key for wallet encryption (falls back to NEXTAUTH_SECRET) |
| `NEXT_PUBLIC_BACKEND_URL` | No | FastAPI backend URL |
| `RESEND_API_KEY` | No | Email notifications via Resend |
| `AGENT_MAX_PER_DAY` | No | Daily budget in USDC (default: 10) |

---

## API Endpoints

### Public (no auth)

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health` | Liveness check + environment diagnostics |
| `POST` | `/api/health` | Run database migrations |
| `PATCH` | `/api/health` | Verify email / reset password / unlock account |
| `GET` | `/api/ready` | Database connectivity check |
| `GET` | `/api/metrics` | System metrics (entity counts, uptime, memory) |
| `GET` | `/api/status` | Network configuration (Arc Testnet RPC, chainId) |
| `*` | `/api/auth/*` | NextAuth.js authentication endpoints |

### Protected (requires auth)

| Method | Path | Role | Description |
|---|---|---|---|
| `GET/POST` | `/api/agents` | Any/Admin | Agent fleet management |
| `GET/PATCH` | `/api/agents/[id]` | Admin | Agent status, config updates |
| `GET` | `/api/agents/[id]/metrics` | Any | Agent performance metrics |
| `GET/POST` | `/api/wallets` | Any | Wallet CRUD (generate/import) |
| `PATCH/DELETE` | `/api/wallets/[id]` | Finance+/Admin | Rename/delete wallets |
| `GET` | `/api/wallets/[id]/balance` | Any | On-chain USDC balance via RPC |
| `POST` | `/api/wallets/[id]/transfer` | Finance+ | Real on-chain USDC transfer |
| `GET` | `/api/wallets/[id]/transactions` | Any | Wallet transaction history |
| `GET/POST` | `/api/tasks` | Any | Execute Mission Control commands |
| `GET/PATCH` | `/api/tasks/[id]` | Any | Task details + cancel |
| `GET` | `/api/tasks/[id]/logs` | Any | Structured execution logs |
| `GET` | `/api/kpi` | Any | Live KPIs + historical snapshots |
| `POST` | `/api/kpi/snapshot` | Any | Compute and store daily KPI snapshot |
| `GET` | `/api/kpi/agents` | Any | Agent performance leaderboard |
| `GET/POST` | `/api/vendors` | Any/Finance+ | Vendor management |
| `GET/POST` | `/api/api-services` | Any/Finance+ | API service configs |
| `GET/POST` | `/api/api-costs` | Any/Finance+ | Cost analytics + usage recording |
| `GET/POST` | `/api/notifications` | Any | Notifications + mark-read |
| `GET/PUT` | `/api/approvals/[id]` | Finance+ | Approval actions |
| `GET/POST` | `/api/reports` | Any | Report generation |
| `GET` | `/api/logs` | Any | Org-wide execution log search |
| `GET` | `/api/budget` | Any | Budget state from optimization engine |
| `GET` | `/api/budget/optimize` | Any | Budget optimization plan |
| `POST` | `/api/pat/run` | Admin | Production Acceptance Testing |

---

## Mission Control Commands

The command parser recognizes 15+ natural language patterns:

```
run tests                          Execute system test suite
check status                       System health overview
allocate budget $10                Set daily budget allocation
optimize costs                     Analyze spending for savings
record OpenAI api cost $1.50       Log API usage cost
create vendor Anthropic            Add a new vendor
create service GPT-4 on OpenAI     Register API service
show api costs last 30 days        View cost analytics
list agents                        Show agent fleet status
list vendors                       Show all vendors
list services                      Show API services
list wallets                       Show wallet balances
generate report                    Compile financial report
generate report api-costs          Generate API cost report
generate report optimization       Generate optimization report
```

Each command is routed to the appropriate agent, generates execution logs with correlation IDs, and updates agent metrics.

---

## Wallet System

### Security

- Private keys are encrypted using **AES-256-GCM** before storage
- Encryption key derived from `ENCRYPTION_KEY` or `NEXTAUTH_SECRET` via SHA-256
- Encrypted format: `iv:authTag:ciphertext` (base64)
- Private keys are **never** returned in API responses
- Wallets without private keys cannot initiate transfers

### Operations

| Operation | Description |
|---|---|
| **Generate** | Create new wallet keypair via ethers, encrypt and store private key |
| **Import** | Import existing wallet via private key, derive address, encrypt key |
| **Transfer** | Sign and broadcast real USDC transaction on Arc Testnet via RPC |
| **Balance** | Query on-chain balance via `eth_getBalance` (USDC is native, 18 decimals) |
| **Rename** | Update wallet label (FINANCE+ role) |
| **Delete** | Soft delete with `deletedAt` timestamp (ADMIN only) |

### Arc Testnet Configuration

- Chain ID: `5042002`
- RPC: `https://rpc.testnet.arc-node.thecanteenapp.com/v1/...`
- Explorer: `https://testnet.arcscan.app`
- USDC: Native gas token (18 decimals, query with `eth_getBalance`)

---

## Multi-Agent System

| Agent | Type | Responsibility |
|---|---|---|
| **Budget Agent** | budget | Tracks spending, enforces budgets, routes to optimal tiers |
| **Payment Agent** | payment | Handles x402 nanopayments and USDC transfers |
| **Treasury Agent** | treasury | Monitors wallet balances, manages reserves |
| **Procurement Agent** | procurement | Manages vendor payments, contract negotiations |
| **API Cost Agent** | api_cost | Monitors API usage costs, alerts on budget overruns |
| **Reporting Agent** | reporting | Generates financial reports and compliance docs |
| **Optimization Agent** | optimization | Analyzes spending patterns, recommends cost reductions |
| **Notification Agent** | notification | Sends alerts for budget thresholds and system events |

Each agent has:
- Health score (computed from 7-day success rate)
- Daily execution metrics (success/failure counts, duration, task count)
- Task queue with correlation-tracked execution
- Structured execution logs

---

## Testing

```bash
cd frontend

# Run all 61 tests
npm test

# Watch mode
npm run test:watch

# Type check
npx tsc --noEmit
```

| Test Suite | Tests | Coverage |
|---|---|---|
| `command-parser.test.ts` | 26 | All 15+ command patterns |
| `validation.test.ts` | 31 | All 13 Zod schemas |
| `rate-limit.test.ts` | 4 | Rate limiter behavior |

---

## Production Acceptance Testing (PAT)

Run the automated PAT to populate the database with realistic operational data:

```bash
# Login and get session cookie
curl -c cookies.txt <csrf + login flow>

# Execute PAT (ADMIN only)
curl -X POST https://helios-pay.up.railway.app/api/pat/run -b cookies.txt
```

The PAT route:
1. Resets all test data (preserves users, wallets, settings)
2. Updates organization to "Helios Technologies Ltd."
3. Creates 16 vendors + API services (OpenAI, Anthropic, AWS, etc.)
4. Configures $10 USDC daily budget with alert rules
5. Initializes 8 agents with 7-day metric history
6. Generates 100+ API usage records across providers
7. Creates 50 approval records across 5 departments
8. Creates 16 subscriptions (monthly/annual/usage-based)
9. Creates 30 payment transactions (COMPLETED/PENDING/FAILED)
10. Creates 15 Mission Control tasks with execution logs
11. Generates 3 reports (Budget, API Cost, Optimization)
12. Creates 14 daily KPI snapshots for trend charts
13. Creates 10 notifications (budget alerts, payment confirmations)
14. Logs 19 audit entries
15. Validates security (encrypted keys, no plaintext leaks)

Returns a structured JSON report with pass/fail status and production readiness score.

---

## Deployment

### Railway

The frontend auto-deploys from GitHub on push to `main`:

```bash
# Manual deploy via Railway CLI
~/.railway/bin/railway up --service frontend_helios -d

# Run database migrations
curl -X POST https://helios-pay.up.railway.app/api/health

# Deploy backend
~/.railway/bin/railway up --service backend-helios -d
```

**Production URLs:**
- Frontend: https://helios-pay.up.railway.app
- Backend: https://back-helios-pay.up.railway.app

### Health Checks

```bash
# Frontend readiness
curl https://helios-pay.up.railway.app/api/ready
# → {"ready":true}

# Database migrations
curl -X POST https://helios-pay.up.railway.app/api/health
# → {"done":true,"results":[...]}

# System metrics
curl https://helios-pay.up.railway.app/api/metrics
```

---

## Security

- **RBAC**: ADMIN > FINANCE > VIEWER hierarchy enforced on all API routes
- **Wallet Encryption**: AES-256-GCM for private keys, never stored in plaintext
- **Auth**: bcrypt password hashing (12 rounds), JWT sessions, email verification
- **Rate Limiting**: 3/min register, 5/min login attempts, auto-lockout after 5 failures
- **Input Validation**: Zod schemas on all POST/PUT request bodies
- **Security Headers**: X-Frame-Options DENY, X-Content-Type-Options nosniff, X-XSS-Protection, Referrer-Policy strict-origin-when-cross-origin
- **Audit Trail**: All CRUD operations logged with before/after state
- **Session Security**: HttpOnly, Secure, SameSite=Lax cookies

---

## License

ISC
