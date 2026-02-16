import { NextRequest, NextResponse } from "next/server";
import { getExpenses, getCategories, getWallets, getCurrencies, getTags, ensureSynced } from "@/lib/data/store";
import { buildConversionContext } from "@/lib/exchangeRates";
import { convertAmount } from "@/lib/exchangeRates";

export async function GET(request: NextRequest) {
  await ensureSynced();
  const params = request.nextUrl.searchParams;

  const convertTo = params.get("convertTo") ?? undefined;

  const expenses = getExpenses({
    startDate: params.get("startDate") ?? undefined,
    endDate: params.get("endDate") ?? undefined,
    category: params.get("category") ?? undefined,
    wallet: params.get("wallet") ?? undefined,
    currency: convertTo ? undefined : (params.get("currency") ?? undefined),
    tag: params.get("tag") ?? undefined,
  });

  const limit = parseInt(params.get("limit") ?? "0", 10);
  const offset = parseInt(params.get("offset") ?? "0", 10);

  const sliced = limit > 0 ? expenses.slice(offset, offset + limit) : expenses;

  let responseExpenses = sliced;

  if (convertTo) {
    const conversion = await buildConversionContext(convertTo);
    responseExpenses = sliced.map((e) => ({
      ...e,
      convertedAmount: Math.round(convertAmount(e.amount, e.currency, conversion) * 100) / 100,
      convertedCurrency: convertTo,
    }));
  }

  return NextResponse.json({
    expenses: responseExpenses,
    total: expenses.length,
    categories: getCategories(),
    wallets: getWallets(),
    currencies: getCurrencies(),
    tags: getTags(),
    ...(convertTo ? { convertedTo: convertTo } : {}),
  });
}
