import { NextRequest, NextResponse } from "next/server";
import { getExpenses, ensureSynced } from "@/lib/data/store";
import {
  getMonthlySummaries,
  getSpendingTimeSeries,
  getCategoryBreakdown,
  getTagBreakdown,
  getWalletBreakdown,
  getIncomeExpenseTimeSeries,
} from "@/lib/data/aggregator";
import { buildConversionContext } from "@/lib/exchangeRates";
import type { GroupBy, ConversionContext } from "@/types";

export async function GET(request: NextRequest) {
  await ensureSynced();
  const params = request.nextUrl.searchParams;

  const convertTo = params.get("convertTo") ?? undefined;

  // When convertTo is set, don't filter by currency — we convert all currencies
  const expenses = getExpenses({
    startDate: params.get("startDate") ?? undefined,
    endDate: params.get("endDate") ?? undefined,
    category: params.get("category") ?? undefined,
    wallet: params.get("wallet") ?? undefined,
    currency: convertTo ? undefined : (params.get("currency") ?? undefined),
  });

  const currency = convertTo ? undefined : (params.get("currency") ?? undefined);
  const type = params.get("type") ?? "all";
  const groupBy = (params.get("groupBy") as GroupBy) ?? "month";

  let conversion: ConversionContext | undefined;
  if (convertTo) {
    conversion = await buildConversionContext(convertTo);
  }

  const response: Record<string, unknown> = {};

  if (type === "all" || type === "monthly") {
    response.monthlySummaries = getMonthlySummaries(expenses, conversion);
  }
  if (type === "all" || type === "timeseries") {
    response.timeSeries = getSpendingTimeSeries(expenses, currency, groupBy, conversion);
    response.incomeExpenseTimeSeries = getIncomeExpenseTimeSeries(expenses, currency, groupBy, conversion);
  }
  if (type === "all" || type === "categories") {
    response.categoryBreakdown = getCategoryBreakdown(expenses, currency, conversion);
    response.incomeCategoryBreakdown = getCategoryBreakdown(expenses, currency, conversion, "income");
  }
  if (type === "all" || type === "tags") {
    response.tagBreakdown = getTagBreakdown(expenses, currency, conversion);
  }
  if (type === "all" || type === "wallets") {
    response.walletBreakdown = getWalletBreakdown(expenses, currency, conversion);
  }

  if (convertTo) {
    response.convertedTo = convertTo;
  }

  return NextResponse.json(response);
}
