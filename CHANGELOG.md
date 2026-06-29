# Changelog

All notable changes to HeliOS — AI Financial Operating System.

---

## [5.0.0] — 2026-06-29 — Production Acceptance Testing

### Added
- `POST /api/pat/run` — Automated Production Acceptance Testing route (ADMIN-only)
- 15-step PAT that resets and populates 400+ records across all tables
- Structured JSON report with pass/fail status and production readiness score
- Security validation (encrypted keys, no plaintext leaks)
- PAT tested and verified for multiple user accounts/organizations

---

## [4.3.0] — 2026-06-29 — Wallet UX & On-chain Transfers

### Added
- Real on-chain USDC transfers via ethers v6 (sign + broadcast on Arc Testnet)
- Transaction confirmation with `tx.wait(1)` and real tx hashes
- Explorer link (`testnet.arcscan.app/tx/{hash}`) returned on transfer success
- FAILED transaction records created on RPC errors with error details

### Changed
- Wallet create/import modal backgrounds from white to grey/blue for dark theme visibility
- Import modal type selector from native `<select>` to custom styled button cards
- Form inputs across all wallet modals: `bg-white/[0.06]` + `border-white/10` + focus states

### Removed
- Fake `crypto.randomBytes(32)` tx hash generation
- Native `<select>` element in import modal (replaced with styled buttons)

---

## [4.2.0] — 2026-06-29 — UI Polish & Settings Cleanup

### Changed
- Wallet delete restricted to ADMIN-only (reverted FINANCE access)
- Delete icon moved to card top-right corner
- Wallet rename Pencil icon visible on hover via group class
- "All Systems Operational" badge moved to Settings page header
- Mission Control status indicators fixed

### Removed
- Nano Price and Hello World Price from settings (unused)

---

## [4.1.0] — 2026-06-29 — Wallet Fixes

### Fixed
- USDC balance display — Arc Testnet uses 18 decimals (wei), not 6
- Email verification fallback for existing unverified users
- Wallet balance RPC query error handling
- API budget changed from monthly to daily ($10 USDC/day)

### Removed
- Seller address from settings (not used in current architecture)

---

## [4.0.0] — 2026-06-29 — Phase 4: Executive KPI Dashboard + Multi-Agent Architecture

### Added
- Executive KPI Dashboard with real-time metrics computed from live DB
- 14-day trend charts via KpiSnapshot records + Recharts
- Agent performance leaderboard ranked by 7-day success rate
- `GET /api/kpi` — Live KPIs + historical snapshots
- `POST /api/kpi/snapshot` — Compute and store daily KPI snapshot
- `GET /api/kpi/agents` — Agent leaderboard
- Agent Manager (`agent-manager.ts`) — task routing, health computation, metrics tracking
- 8-agent architecture: Budget, Payment, Treasury, Procurement, API Cost, Reporting, Optimization, Notification
- AgentMetric model for daily execution metrics per agent
- KpiSnapshot model for historical trend data
- ExecutionLog model with correlationId for structured logging
- Budget optimization engine (`budget-engine.ts`) with SERVICE_CATALOG
- Wallet generate/import with AES-256-GCM encrypted private key storage
- Wallet rename (FINANCE+) and delete (ADMIN-only) operations
- On-chain USDC balance queries via `eth_getBalance` RPC calls

---

## [3.0.0] — 2026-06-28 — Phase 3: Security, API Costs, Testing

### Added
- **D1+D2**: RBAC enforcement (ADMIN > FINANCE > VIEWER) on all API routes
- **D1+D2**: Security headers (X-Frame-Options, X-Content-Type-Options, X-XSS-Protection, Referrer-Policy)
- **D1+D2**: Database schema expansion to 27 models
- **D3**: API Cost Management — vendors, services, usage tracking page
- **D3**: `GET/POST /api/vendors`, `GET/POST /api/api-services`, `GET/POST /api/api-costs`
- **D4**: Agent system upgrade + Mission Control with execution timeline
- **D5+D6**: Wallet balance queries, notification bell, settings auto-save
- **D7**: `/api/ready` readiness probe, `/api/metrics` system metrics, ErrorBoundary component
- **D8**: Vitest test suite (61 tests) — command-parser, validation schemas, rate-limiter
- **D8**: GitHub Actions CI pipeline (lint, type-check, test, build)

---

## [2.0.0] — 2026-06-28 — Phase 2: Dashboard Data + Settings

### Added
- Real data integration across all dashboard pages
- Logout functionality
- Settings page saves to database via API
- Loading states and skeleton screens

### Fixed
- Settlement protocol label
- Backend deployment configuration

### Changed
- Mobile responsive layout improvements

---

## [1.0.0] — 2026-06-27 — Phase 1: Auth + Database

### Added
- NextAuth.js v5 authentication (Credentials provider, JWT sessions, PrismaAdapter)
- Email verification flow
- User registration with bcrypt password hashing (12 rounds)
- Rate limiting (3/min register, 5/min login, auto-lockout after 5 failures)
- PostgreSQL + Prisma ORM database integration
- `POST /api/health` for database migration execution
- `PATCH /api/health` for email verify, password reset, account unlock
- Zod input validation schemas (13 schemas)
- Public landing page with auth routing
- Middleware JWT verification with secure cookie support

### Fixed
- NextAuth v5 secret configuration for Railway deployment
- Secure cookie prefix matching for HTTPS proxy environments
- Login/register redirect using window.location instead of router.push
- Middleware getToken secret passing for JWT decoding

---

## [0.5.0] — 2026-06-26 — Platform Rebuild

### Changed
- Renamed from BudgetBot to HeliOS
- Rebuilt frontend as SaaS platform with 9 dashboard pages
- Consolidated to 2 services: Next.js frontend + FastAPI backend
- Added multi-provider LLM routing (OpenAI, Anthropic, OpenRouter)
- Integrated frontend with backend APIs (live data with mock fallback)

---

## [0.2.0] — 2026-06-25 — Budget Engine + Dashboard

### Added
- Budget bot engine with optimization logic
- Bento Grid dashboard layout
- BudgetBot full-stack: FastAPI backend + React Flow canvas frontend
- Scheduled buyer worker for automated payments
- Public dashboard with status/feed APIs

---

## [0.1.0] — 2026-06-24 — Initial Deployment

### Added
- Autonomous x402 nanopayment agent
- Docker containerization
- GitHub Actions CI (typecheck, docker build, smoke test)
- Railway deploy configuration with `/health` liveness probe
- Circle Gateway integration for $0.000001 nanopayments

---

## [0.0.1] — 2026-05-22 — Genesis

### Added
- Initial project scaffolding
- Arc Testnet faucet integration
- Basic project structure
