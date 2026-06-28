import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

const SELLER = "0x933a2405f84c224be1ef373ba16e992e1f459682";

const DEFAULT_AGENTS = [
  { name: "Payment Agent", type: "payment", description: "Handles x402 nanopayments and USDC transfers on Arc Testnet", config: { icon: "CreditCard", description: "Handles x402 nanopayments and USDC transfers on Arc Testnet" } },
  { name: "Procurement Agent", type: "procurement", description: "Manages vendor payments, contract negotiations, and SaaS subscriptions", config: { icon: "ShoppingCart", description: "Manages vendor payments, contract negotiations, and SaaS subscriptions" } },
  { name: "Treasury Agent", type: "treasury", description: "Monitors wallet balances, manages reserves, and optimizes yield", config: { icon: "Landmark", description: "Monitors wallet balances, manages reserves, and optimizes yield" } },
  { name: "Budget Agent", type: "budget", description: "Tracks spending, enforces budgets, and routes requests to optimal tiers", config: { icon: "Wallet", description: "Tracks spending, enforces budgets, and routes requests to optimal tiers" } },
  { name: "API Cost Agent", type: "api_cost", description: "Monitors API usage costs, tracks per-service spending, and alerts on budget overruns", config: { icon: "Globe", description: "Monitors API usage costs, tracks per-service spending, and alerts on budget overruns" } },
  { name: "Reporting Agent", type: "reporting", description: "Generates financial reports, spending summaries, and compliance documentation", config: { icon: "FileText", description: "Generates financial reports, spending summaries, and compliance documentation" } },
  { name: "Optimization Agent", type: "optimization", description: "Analyzes spending patterns and recommends cost reduction strategies", config: { icon: "Sparkles", description: "Analyzes spending patterns and recommends cost reduction strategies" } },
  { name: "Notification Agent", type: "notification", description: "Sends alerts for budget thresholds, payment failures, and system events", config: { icon: "Bell", description: "Sends alerts for budget thresholds, payment failures, and system events" } },
];

const SAMPLE_APPROVALS = [
  { amount: 12450, vendor: "AWS", reason: "Monthly cloud infrastructure renewal", department: "Engineering", aiRecommendation: "review", confidence: 0.72 },
  { amount: 1200, vendor: "Figma", reason: "Annual design tool subscription", department: "Design", aiRecommendation: "approve", confidence: 0.94 },
  { amount: 8920, vendor: "Google Cloud", reason: "Data pipeline compute costs", department: "Data", aiRecommendation: "review", confidence: 0.65 },
];

const SAMPLE_TRANSACTIONS = [
  { type: "payment", amount: 0.000001, status: "COMPLETED" as const, reference: "x402:nano", metadata: { vendor: "x402 Nano", department: "API" } },
  { type: "payment", amount: 0.01, status: "COMPLETED" as const, reference: "x402:hello-world", metadata: { vendor: "x402 Hello World", department: "API" } },
  { type: "payment", amount: 12450, status: "COMPLETED" as const, reference: "vendor:aws", metadata: { vendor: "AWS", department: "Engineering" } },
  { type: "payment", amount: 1200, status: "COMPLETED" as const, reference: "vendor:figma", metadata: { vendor: "Figma", department: "Design" } },
  { type: "payment", amount: 3400, status: "COMPLETED" as const, reference: "vendor:datadog", metadata: { vendor: "Datadog", department: "DevOps" } },
  { type: "payment", amount: 8920, status: "PENDING" as const, reference: "vendor:gcp", metadata: { vendor: "Google Cloud", department: "Data" } },
  { type: "payment", amount: 960, status: "COMPLETED" as const, reference: "vendor:notion", metadata: { vendor: "Notion", department: "Product" } },
  { type: "payment", amount: 1890, status: "FAILED" as const, reference: "vendor:vercel", metadata: { vendor: "Vercel", department: "Engineering" } },
];

export async function POST() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const seeded: string[] = [];

  const agentCount = await prisma.agent.count({ where: { orgId: user.orgId } });
  if (agentCount === 0) {
    await prisma.agent.createMany({
      data: DEFAULT_AGENTS.map(a => ({ ...a, orgId: user.orgId })),
    });
    seeded.push(`${DEFAULT_AGENTS.length} agents`);
  }

  const walletCount = await prisma.wallet.count({ where: { orgId: user.orgId } });
  if (walletCount === 0) {
    await prisma.wallet.create({
      data: {
        orgId: user.orgId,
        label: "Treasury Wallet",
        address: SELLER,
        type: "TREASURY",
      },
    });
    seeded.push("1 treasury wallet");
  }

  const approvalCount = await prisma.approval.count({ where: { orgId: user.orgId } });
  if (approvalCount === 0) {
    await prisma.approval.createMany({
      data: SAMPLE_APPROVALS.map(a => ({ ...a, orgId: user.orgId, requesterId: user.id })),
    });
    seeded.push(`${SAMPLE_APPROVALS.length} approvals`);
  }

  const txCount = await prisma.transaction.count({ where: { orgId: user.orgId } });
  if (txCount === 0) {
    await prisma.transaction.createMany({
      data: SAMPLE_TRANSACTIONS.map(t => ({ ...t, orgId: user.orgId })),
    });
    seeded.push(`${SAMPLE_TRANSACTIONS.length} transactions`);
  }

  if (seeded.length === 0) {
    return NextResponse.json({ seeded: false, message: "Data already exists" });
  }

  return NextResponse.json({ seeded: true, created: seeded });
}
