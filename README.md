# HeliOS

**AI-powered autonomous payment platform for managing wallets, agents, API costs, and financial operations** — built on Next.js 15, PostgreSQL, and on-chain USDC settlement via Circle Gateway on Arc Testnet.

**Live:** https://helios-pay.up.railway.app

---

## What it does

HeliOS is a financial operating system where AI agents autonomously manage payments, track API spending, and enforce budget policies — all with human-in-the-loop approvals and full audit trails.

| Capability | Details |
|---|---|
| **Multi-agent system** | 4 agent types (Budget, Payment, Treasury, Operations) with task queues and wallet assignments |
| **Mission Control** | Natural language command interface — 17 command types parsed and executed against live data |
| **API Cost Management** | Track vendors, services, and usage across providers with daily/monthly analytics and budget alerts |
| **On-chain wallets** | USDC balance queries via RPC, treasury and agent wallet management |
| **RBAC** | Role-based access (Admin / Finance / Viewer) enforced on every API route |
| **Notifications** | Real-time bell notifications with unread counts, mark-read, 30s auto-refresh |
| **x402 Nanopayments** | Circle Gateway settlement down to $0.000001, gas-free batched on-chain via FastAPI backend |
| **61 unit tests** | Vitest test suite covering command parsing, input validation, and rate limiting |

---

## Tech stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS |
| **Database** | PostgreSQL + Prisma ORM (24 models) |
| **Auth** | NextAuth.js v5 (beta.31) with PrismaAdapter, JWT sessions, bcrypt |
| **Backend** | FastAPI (Python) with LLM routing (OpenAI / Anthropic / OpenRouter) |
| **Payments** | Circle Gateway x402 protocol on Arc Testnet (chainId 5042002) |
| **Charts** | Recharts for cost analytics visualizations |
| **Validation** | Zod v4 (11 schemas) |
| **Testing** | Vitest v4.1.9 |
| **CI/CD** | GitHub Actions (lint, type-check, test, build) |
| **Hosting** | Railway (frontend auto-deploy on push, backend manual deploy) |

---

## Architecture

```
frontend/                          Next.js 15 App Router
  src/
    app/
      (dashboard)/
        page.tsx                   Dashboard — KPIs, recent activity, charts
        agents/page.tsx            Agent fleet — status, tasks, wallets
        mission-control/page.tsx   NL command interface with task execution
        wallets/page.tsx           Wallet management with on-chain balances
        transactions/page.tsx      Transaction history with approvals
        api-costs/page.tsx         Vendor/service cost tracking + analytics
        settings/page.tsx          Org settings, policies, team (auto-save)
        team/page.tsx              Team member management with RBAC
        reports/page.tsx           Financial reports
        approvals/page.tsx         Approval queue
      api/
        auth/[...nextauth]/        NextAuth.js endpoints
        auth/register/             Registration with rate limiting
        agents/                    Agent CRUD (ADMIN only)
        wallets/                   Wallet CRUD + balance queries
        wallets/[id]/balance/      On-chain USDC balance via RPC
        transactions/              Transaction management
        tasks/                     Task execution (17 command handlers)
        vendors/                   Vendor management (FINANCE+)
        api-services/              API service configs (FINANCE+)
        api-costs/                 Aggregated cost analytics
        notifications/             Notification CRUD + mark-read
        health/                    Liveness + DB migration runner
        ready/                     DB connectivity check
        metrics/                   System metrics (entity counts, uptime, memory)
    lib/
      session.ts                   RBAC helpers (requireAuth, requireRole)
      command-parser.ts            17 NL command patterns
      validation.ts                11 Zod input schemas
      rate-limit.ts                In-memory rate limiter
      api.ts                       API client methods
      types.ts                     TypeScript interfaces
    components/
      layout/Sidebar.tsx           Navigation with role-aware items
      ui/NotificationBell.tsx      Real-time notification dropdown
      ui/ErrorBoundary.tsx         Error boundary with recovery

backend/                           FastAPI Python service
  main.py                          x402 payment endpoints, LLM routing
  task_runner.py                   Agent task execution
```

### Database schema (24 models)

Core: `User`, `Organization`, `Account`, `Session`, `VerificationToken`
Financial: `Wallet`, `Transaction`, `Approval`, `Report`
Agents: `Agent`, `Task`, `AuditLog`
API Cost Management: `Vendor`, `Subscription`, `ApiService`, `ApiUsage`, `BudgetRule`
System: `Notification`, `TeamMember`, `SpendingPolicy`, `OrganizationSettings`

---

## Getting started

### Prerequisites

- Node.js 20+
- PostgreSQL database
- npm

### Local development

```bash
cd frontend
npm install
npx prisma generate

# Set environment variables
cp .env.example .env.local
# Required: DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL

npm run dev
```

### Environment variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Yes | JWT signing secret |
| `NEXTAUTH_URL` | Yes | App URL (e.g. `http://localhost:3000`) |
| `NEXT_PUBLIC_BACKEND_URL` | No | FastAPI backend URL |
| `RESEND_API_KEY` | No | Email notifications via Resend |

---

## API endpoints

### Public (no auth)

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health` | Liveness check + migration status |
| `GET` | `/api/ready` | Database connectivity check |
| `GET` | `/api/metrics` | System metrics (entity counts, uptime, memory) |
| `*` | `/api/auth/*` | NextAuth.js authentication |

### Protected (requires auth)

| Method | Path | Role | Description |
|---|---|---|---|
| `GET/POST` | `/api/agents` | Admin | Agent fleet management |
| `GET/POST` | `/api/wallets` | Any | Wallet CRUD |
| `GET` | `/api/wallets/[id]/balance` | Any | On-chain USDC balance query |
| `GET/POST` | `/api/transactions` | Any | Transaction history |
| `GET/POST` | `/api/tasks` | Any | Execute commands (17 types) |
| `GET/POST` | `/api/vendors` | Finance+ | Vendor management |
| `GET/POST` | `/api/api-services` | Finance+ | API service configs |
| `GET/POST` | `/api/api-costs` | Any | Cost analytics + usage recording |
| `GET/POST` | `/api/notifications` | Any | Notifications + mark-read |
| `GET/PUT` | `/api/approvals/[id]` | Finance+ | Approval actions |
| `GET/POST` | `/api/reports` | Any | Report generation |

---

## Mission Control commands

The command parser recognizes 17 natural language patterns:

```
run tests                          Execute test suite
check status                       System health overview
allocate budget $50                Set budget allocation
optimize costs                     Analyze spending for savings
record OpenAI api cost $1.50       Log API usage cost
create vendor Anthropic            Add a new vendor
create service GPT-4 on OpenAI     Register API service
show api costs last 30 days        View cost analytics
list agents                        Show agent fleet
list vendors                       Show all vendors
list services                      Show API services
list wallets                       Show wallet balances
generate report                    Compile financial report
```

---

## Testing

```bash
cd frontend

# Run all 61 tests
npm test

# Watch mode
npm run test:watch

# Type check
npm run lint
```

Test coverage:
- `command-parser.test.ts` — 26 tests for all 17 command patterns
- `validation.test.ts` — 31 tests for all 11 Zod schemas
- `rate-limit.test.ts` — 4 tests for rate limiter behavior

---

## CI/CD

GitHub Actions runs on every push to `main` and on pull requests:

1. Install dependencies
2. Generate Prisma client
3. Type check (`tsc --noEmit`)
4. Run tests (`vitest`)
5. Build (`next build`)

See `.github/workflows/ci.yml`.

---

## Deployment

### Railway

The frontend auto-deploys from GitHub on push to `main`. The backend deploys manually:

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and deploy backend
railway login
~/.railway/bin/railway up ./backend --path-as-root --service backend-helios --detach -y
```

**Production URLs:**
- Frontend: https://helios-pay.up.railway.app
- Backend: https://back-helios-pay.up.railway.app

### Health checks

```bash
# Frontend readiness
curl https://helios-pay.up.railway.app/api/ready
# → {"ready":true}

# Backend health
curl https://back-helios-pay.up.railway.app/health
# → {"status":"healthy",...}

# System metrics
curl https://helios-pay.up.railway.app/api/metrics
# → {"counts":{"users":2,"organizations":2,...},"uptime":...}
```

---

## Security

- RBAC enforced on all API routes (Admin / Finance / Viewer hierarchy)
- Rate limiting on auth endpoints (3/min register, 5/min login)
- Input validation via Zod on all POST/PUT bodies
- Security headers: X-Frame-Options, X-Content-Type-Options, Referrer-Policy
- Passwords hashed with bcrypt (10 rounds)
- JWT session strategy with secure token handling
- API middleware blocks unauthenticated requests (except public endpoints)

---

## License

ISC
