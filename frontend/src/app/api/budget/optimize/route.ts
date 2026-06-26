import { NextResponse } from "next/server";
import { SERVICE_CATALOG, computeBudgetState, optimizeAllocation } from "@/lib/budget-engine";

export async function GET() {
  const daily = parseFloat(process.env.AGENT_MAX_PER_DAY || "10");
  const state = computeBudgetState(daily, SERVICE_CATALOG);
  const plan = optimizeAllocation(state.remaining, SERVICE_CATALOG);
  return NextResponse.json({ state, plan });
}
