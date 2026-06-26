import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  const checks: Record<string, string> = {};

  checks.database_url = process.env.DATABASE_URL ? "set" : "missing";
  checks.jwt_secret = process.env.JWT_SECRET ? "set" : "missing";

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = "connected";
  } catch (error: unknown) {
    checks.database = `error: ${error instanceof Error ? error.message : String(error)}`;
  }

  try {
    const userCount = await prisma.user.count();
    checks.tables = `ok (${userCount} users)`;

    if (userCount > 0) {
      const user = await prisma.user.findFirst({ select: { email: true, passwordHash: true } });
      checks.first_user_email = user?.email ?? "none";
      checks.password_hash_format = user?.passwordHash
        ? `${user.passwordHash.substring(0, 7)}... (len=${user.passwordHash.length})`
        : "empty";
    }
  } catch (error: unknown) {
    checks.tables = `error: ${error instanceof Error ? error.message : String(error)}`;
  }

  try {
    const testHash = await bcrypt.hash("test123", 12);
    const testVerify = await bcrypt.compare("test123", testHash);
    checks.bcrypt = testVerify ? "working" : "hash/compare mismatch";
  } catch (error: unknown) {
    checks.bcrypt = `error: ${error instanceof Error ? error.message : String(error)}`;
  }

  const healthy = checks.database === "connected" && checks.tables.startsWith("ok");

  return NextResponse.json({ healthy, checks }, { status: healthy ? 200 : 503 });
}

const SCHEMA_SQL = `
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'FINANCE', 'VIEWER');
CREATE TYPE "WalletType" AS ENUM ('TREASURY', 'AGENT');
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED');

CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "industry" TEXT NOT NULL DEFAULT '',
    "timezone" TEXT NOT NULL DEFAULT 'America/Los_Angeles (UTC-8)',
    "currency" TEXT NOT NULL DEFAULT 'USDC',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'VIEWER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Wallet" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "type" "WalletType" NOT NULL,
    "chain" TEXT NOT NULL DEFAULT 'Arc Testnet',
    "network" TEXT NOT NULL DEFAULT 'eip155:5042002',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Agent" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "walletId" TEXT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "config" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Agent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ApiKeyRecord" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ApiKeyRecord_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PaymentPolicy" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "autoApproveThreshold" DOUBLE PRECISION NOT NULL DEFAULT 500,
    "dailyLimit" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "agentLimit" DOUBLE PRECISION NOT NULL DEFAULT 1000,
    "require2fa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PaymentPolicy_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Setting" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Setting_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "before" JSONB,
    "after" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "agentId" TEXT,
    "agentName" TEXT NOT NULL DEFAULT 'HeliOS',
    "command" TEXT NOT NULL,
    "commandType" TEXT NOT NULL DEFAULT 'general',
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
    "steps" JSONB NOT NULL DEFAULT '[]',
    "result" JSONB,
    "logs" JSONB NOT NULL DEFAULT '[]',
    "cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "executionTimeMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "walletId" TEXT,
    "type" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USDC',
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "reference" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "PaymentPolicy_orgId_key" ON "PaymentPolicy"("orgId");
CREATE UNIQUE INDEX "Setting_orgId_key_key" ON "Setting"("orgId", "key");
CREATE INDEX "User_orgId_idx" ON "User"("orgId");
CREATE INDEX "Wallet_orgId_idx" ON "Wallet"("orgId");
CREATE INDEX "Agent_orgId_idx" ON "Agent"("orgId");
CREATE INDEX "ApiKeyRecord_orgId_idx" ON "ApiKeyRecord"("orgId");
CREATE INDEX "Setting_orgId_idx" ON "Setting"("orgId");
CREATE INDEX "AuditLog_orgId_createdAt_idx" ON "AuditLog"("orgId", "createdAt");
CREATE INDEX "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");
CREATE INDEX "Task_orgId_createdAt_idx" ON "Task"("orgId", "createdAt");
CREATE INDEX "Task_status_idx" ON "Task"("status");
CREATE INDEX "Transaction_orgId_createdAt_idx" ON "Transaction"("orgId", "createdAt");
CREATE INDEX "Transaction_walletId_idx" ON "Transaction"("walletId");

ALTER TABLE "User" ADD CONSTRAINT "User_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE;
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE;
ALTER TABLE "Agent" ADD CONSTRAINT "Agent_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE;
ALTER TABLE "Agent" ADD CONSTRAINT "Agent_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE SET NULL;
ALTER TABLE "ApiKeyRecord" ADD CONSTRAINT "ApiKeyRecord_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE;
ALTER TABLE "PaymentPolicy" ADD CONSTRAINT "PaymentPolicy_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE;
ALTER TABLE "Setting" ADD CONSTRAINT "Setting_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL;
ALTER TABLE "Task" ADD CONSTRAINT "Task_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE SET NULL;
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE;
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE SET NULL;
`;

export async function POST() {
  const results: string[] = [];
  const statements = SCHEMA_SQL.split(";").map(s => s.trim()).filter(s => s.length > 0);

  for (const stmt of statements) {
    try {
      await prisma.$executeRawUnsafe(stmt);
      results.push(`OK: ${stmt.slice(0, 60)}...`);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes("already exists")) {
        results.push(`SKIP: ${stmt.slice(0, 60)}... (already exists)`);
      } else {
        results.push(`FAIL: ${stmt.slice(0, 60)}... → ${msg}`);
      }
    }
  }

  return NextResponse.json({ done: true, results });
}
