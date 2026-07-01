import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { decryptPrivateKey } from "@/lib/crypto";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin role required" }, { status: 403 });
  }

  const { id } = await params;
  const provider = await prisma.aiProvider.findFirst({
    where: { id, orgId: user.orgId },
  });

  if (!provider) {
    return NextResponse.json({ error: "Provider not found" }, { status: 404 });
  }

  if (!provider.apiKeyEncrypted) {
    return NextResponse.json({ success: false, error: "No API key configured" }, { status: 400 });
  }

  const startTime = Date.now();

  try {
    const apiKey = decryptPrivateKey(provider.apiKeyEncrypted);
    const baseUrl = provider.baseUrl.replace(/\/+$/, "");

    const res = await fetch(`${baseUrl}/v1/models`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "x-api-key": apiKey,
      },
      signal: AbortSignal.timeout(10000),
    });

    const latencyMs = Date.now() - startTime;

    if (res.ok) {
      const data = await res.json();
      const models = Array.isArray(data?.data)
        ? data.data.slice(0, 10).map((m: { id?: string }) => m.id || "unknown")
        : [];

      return NextResponse.json({ success: true, latencyMs, models });
    }

    const errText = await res.text().catch(() => "");
    return NextResponse.json({
      success: false,
      latencyMs,
      error: `HTTP ${res.status}: ${errText.slice(0, 200)}`,
    });
  } catch (err) {
    const latencyMs = Date.now() - startTime;
    return NextResponse.json({
      success: false,
      latencyMs,
      error: err instanceof Error ? err.message : "Connection failed",
    });
  }
}
