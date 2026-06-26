import { NextRequest, NextResponse } from "next/server";

const GATEWAY_API = "https://gateway-api-testnet.circle.com";
const SELLER = "0x933a2405f84c224be1ef373ba16e992e1f459682";

export async function GET(request: NextRequest) {
  const limit = Math.min(
    Number(request.nextUrl.searchParams.get("limit") ?? 10) || 10,
    50
  );

  try {
    const r = await fetch(
      `${GATEWAY_API}/v1/x402/transfers?to=${SELLER}&pageSize=${limit}`,
      { cache: "no-store" }
    );
    if (!r.ok) {
      return NextResponse.json({ transfers: [] }, { status: r.status });
    }
    const data = (await r.json()) as { transfers?: unknown[] };
    return NextResponse.json({ transfers: (data.transfers ?? []).slice(0, limit) });
  } catch (e) {
    return NextResponse.json({ transfers: [] }, { status: 502 });
  }
}
