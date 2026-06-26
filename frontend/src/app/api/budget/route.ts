import { NextResponse } from "next/server";
import { SERVICE_CATALOG, computeBudgetState } from "@/lib/budget-engine";

export async function GET() {
  const daily = parseFloat(process.env.AGENT_MAX_PER_DAY || "10");
  const state = computeBudgetState(daily, SERVICE_CATALOG);
  return NextResponse.json(state);
}
