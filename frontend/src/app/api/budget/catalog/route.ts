import { NextResponse } from "next/server";
import { SERVICE_CATALOG } from "@/lib/budget-engine";

export async function GET() {
  return NextResponse.json(SERVICE_CATALOG);
}
