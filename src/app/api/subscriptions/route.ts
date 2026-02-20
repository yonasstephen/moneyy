import { NextRequest, NextResponse } from "next/server";
import { getExpenses, ensureSynced } from "@/lib/data/store";
import { detectSubscriptions } from "@/lib/analysis/subscription-detector";

export async function GET(request: NextRequest) {
  await ensureSynced();

  const params = request.nextUrl.searchParams;
  const wallet = params.get("wallet") ?? undefined;
  const currency = params.get("currency") ?? undefined;

  // Fetch all-time expenses (no date filter) to detect subscriptions
  // across the full history. Optionally filter by wallet or currency.
  const expenses = getExpenses({ wallet, currency });

  const subscriptions = detectSubscriptions(expenses);

  return NextResponse.json({ subscriptions });
}
