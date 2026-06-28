import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search");
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
  const offset = parseInt(searchParams.get("offset") || "0");

  const where: Record<string, unknown> = { orgId: user.orgId };
  if (status && status !== "all") where.status = status;
  if (search) {
    where.OR = [
      { vendor: { contains: search, mode: "insensitive" } },
      { reason: { contains: search, mode: "insensitive" } },
      { department: { contains: search, mode: "insensitive" } },
    ];
  }

  const [approvals, total] = await Promise.all([
    prisma.approval.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.approval.count({ where }),
  ]);

  return NextResponse.json({ approvals, total });
}

export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { amount, vendor, reason, department } = body;

  if (!amount || !vendor || !reason) {
    return NextResponse.json({ error: "Amount, vendor, and reason are required" }, { status: 400 });
  }

  const policy = await prisma.paymentPolicy.findUnique({
    where: { orgId: user.orgId },
  });

  let aiRecommendation = "review";
  let confidence = 0.5;
  if (policy) {
    if (amount <= policy.autoApproveThreshold) {
      aiRecommendation = "approve";
      confidence = 0.92;
    } else if (amount > policy.agentLimit) {
      aiRecommendation = "reject";
      confidence = 0.88;
    } else {
      aiRecommendation = "review";
      confidence = 0.65;
    }
  }

  const approval = await prisma.approval.create({
    data: {
      orgId: user.orgId,
      requesterId: user.id,
      amount,
      vendor,
      reason,
      department: department || "General",
      aiRecommendation,
      confidence,
    },
  });

  return NextResponse.json({ approval }, { status: 201 });
}
