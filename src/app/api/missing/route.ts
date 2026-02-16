import { NextResponse } from "next/server";
import { getExpenses, ensureSynced } from "@/lib/data/store";
import { detectMissingExpenses } from "@/lib/analysis/missing-detector";

export async function GET() {
  await ensureSynced();
  const expenses = getExpenses();
  const alerts = detectMissingExpenses(expenses);
  return NextResponse.json({ alerts });
}
