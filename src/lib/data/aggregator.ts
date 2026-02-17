import { format } from "date-fns";
import { Expense, MonthlySummary, TimeSeriesPoint, MonthKey, GroupBy, ConversionContext } from "@/types";
import { convertAmount } from "@/lib/exchangeRates";

export type AmountMode = "expense" | "income" | "all";

function shouldInclude(amount: number, mode: AmountMode): boolean {
  if (mode === "expense") return amount < 0;
  if (mode === "income") return amount > 0;
  return amount !== 0;
}

function formatPeriod(date: Date, groupBy: GroupBy): string {
  switch (groupBy) {
    case "day":
      return format(date, "yyyy-MM-dd");
    case "year":
      return format(date, "yyyy");
    default:
      return format(date, "yyyy-MM");
  }
}

function groupByPeriod(
  expenses: Expense[],
  groupBy: GroupBy
): Map<string, Expense[]> {
  const map = new Map<string, Expense[]>();
  for (const e of expenses) {
    const key = formatPeriod(e.date, groupBy);
    const arr = map.get(key) ?? [];
    arr.push(e);
    map.set(key, arr);
  }
  return map;
}

export function groupByMonth(expenses: Expense[]): Map<MonthKey, Expense[]> {
  const map = new Map<MonthKey, Expense[]>();
  for (const e of expenses) {
    const key = format(e.date, "yyyy-MM");
    const arr = map.get(key) ?? [];
    arr.push(e);
    map.set(key, arr);
  }
  return map;
}

export function getMonthlySummaries(expenses: Expense[], conversion?: ConversionContext): MonthlySummary[] {
  const grouped = groupByMonth(expenses);
  const summaries: MonthlySummary[] = [];

  for (const [month, items] of grouped) {
    const totalByCurrency: Record<string, number> = {};
    const incomeByCurrency: Record<string, number> = {};
    const byCategory: Record<string, Record<string, number>> = {};

    for (const e of items) {
      const currKey = conversion ? conversion.targetCurrency : e.currency;
      const absAmount = conversion
        ? Math.abs(convertAmount(e.amount, e.currency, conversion))
        : Math.abs(e.amount);

      if (e.amount < 0) {
        // Expense
        totalByCurrency[currKey] =
          (totalByCurrency[currKey] ?? 0) + absAmount;

        if (!byCategory[e.category]) byCategory[e.category] = {};
        byCategory[e.category][currKey] =
          (byCategory[e.category][currKey] ?? 0) + absAmount;
      } else if (e.amount > 0) {
        // Income
        incomeByCurrency[currKey] =
          (incomeByCurrency[currKey] ?? 0) + absAmount;
      }
    }

    // Round values
    for (const k of Object.keys(totalByCurrency)) {
      totalByCurrency[k] = Math.round(totalByCurrency[k] * 100) / 100;
    }
    for (const k of Object.keys(incomeByCurrency)) {
      incomeByCurrency[k] = Math.round(incomeByCurrency[k] * 100) / 100;
    }
    for (const cat of Object.keys(byCategory)) {
      for (const k of Object.keys(byCategory[cat])) {
        byCategory[cat][k] = Math.round(byCategory[cat][k] * 100) / 100;
      }
    }

    summaries.push({
      month,
      totalByCurrency,
      incomeByCurrency,
      byCategory,
      transactionCount: items.filter((e) => shouldInclude(e.amount, "expense")).length,
    });
  }

  return summaries.sort((a, b) => b.month.localeCompare(a.month));
}

export function getSpendingTimeSeries(
  expenses: Expense[],
  currency?: string,
  groupBy: GroupBy = "month",
  conversion?: ConversionContext,
  mode: AmountMode = "expense"
): TimeSeriesPoint[] {
  const grouped = groupByPeriod(expenses, groupBy);
  const points: TimeSeriesPoint[] = [];

  const sortedKeys = [...grouped.keys()].sort();

  for (const month of sortedKeys) {
    const items = grouped.get(month)!;
    const point: TimeSeriesPoint = { period: month };

    for (const e of items) {
      if (!shouldInclude(e.amount, mode)) continue;
      if (!conversion && currency && e.currency !== currency) continue;
      const amt = conversion
        ? Math.abs(convertAmount(e.amount, e.currency, conversion))
        : Math.abs(e.amount);
      const key = conversion || currency ? "total" : e.currency;
      point[key] = ((point[key] as number) ?? 0) + amt;
    }

    // Round values
    for (const k of Object.keys(point)) {
      if (k !== "period" && typeof point[k] === "number") {
        point[k] = Math.round((point[k] as number) * 100) / 100;
      }
    }

    points.push(point);
  }

  return points;
}

export function getCategoryBreakdown(
  expenses: Expense[],
  currency?: string,
  conversion?: ConversionContext,
  mode: AmountMode = "expense"
): { category: string; amount: number }[] {
  const map: Record<string, number> = {};

  for (const e of expenses) {
    if (!shouldInclude(e.amount, mode)) continue;
    if (!conversion && currency && e.currency !== currency) continue;
    const amt = conversion
      ? Math.abs(convertAmount(e.amount, e.currency, conversion))
      : Math.abs(e.amount);
    map[e.category] = (map[e.category] ?? 0) + amt;
  }

  return Object.entries(map)
    .map(([category, amount]) => ({
      category,
      amount: Math.round(amount * 100) / 100,
    }))
    .sort((a, b) => b.amount - a.amount);
}

export function getTagBreakdown(
  expenses: Expense[],
  currency?: string,
  conversion?: ConversionContext,
  mode: AmountMode = "expense"
): { tag: string; amount: number; count: number }[] {
  const amountMap: Record<string, number> = {};
  const countMap: Record<string, number> = {};

  for (const e of expenses) {
    if (!shouldInclude(e.amount, mode)) continue;
    if (!conversion && currency && e.currency !== currency) continue;
    const amt = conversion
      ? Math.abs(convertAmount(e.amount, e.currency, conversion))
      : Math.abs(e.amount);
    for (const tag of e.tags) {
      amountMap[tag] = (amountMap[tag] ?? 0) + amt;
      countMap[tag] = (countMap[tag] ?? 0) + 1;
    }
  }

  return Object.entries(amountMap)
    .map(([tag, amount]) => ({
      tag,
      amount: Math.round(amount * 100) / 100,
      count: countMap[tag],
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 100);
}

export function getWalletBreakdown(
  expenses: Expense[],
  currency?: string,
  conversion?: ConversionContext,
  mode: AmountMode = "expense"
): TimeSeriesPoint[] {
  const grouped = groupByMonth(expenses);
  const sortedKeys = [...grouped.keys()].sort();
  const points: TimeSeriesPoint[] = [];

  for (const month of sortedKeys) {
    const items = grouped.get(month)!;
    const point: TimeSeriesPoint = { period: month };

    for (const e of items) {
      if (!shouldInclude(e.amount, mode)) continue;
      if (!conversion && currency && e.currency !== currency) continue;
      const amt = conversion
        ? Math.abs(convertAmount(e.amount, e.currency, conversion))
        : Math.abs(e.amount);
      point[e.wallet] = ((point[e.wallet] as number) ?? 0) + amt;
    }

    for (const k of Object.keys(point)) {
      if (k !== "period" && typeof point[k] === "number") {
        point[k] = Math.round((point[k] as number) * 100) / 100;
      }
    }

    points.push(point);
  }

  return points;
}

export function getIncomeExpenseTimeSeries(
  expenses: Expense[],
  currency?: string,
  groupBy: GroupBy = "month",
  conversion?: ConversionContext
): TimeSeriesPoint[] {
  // When there's no currency filter and no conversion, data has multiple
  // currency keys (e.g. "USD", "IDR"). Summing those raw numbers is
  // meaningless, so return an empty array — the dashboard will fall back
  // to the per-currency spending trend instead.
  if (!currency && !conversion) return [];

  const expenseSeries = getSpendingTimeSeries(expenses, currency, groupBy, conversion, "expense");
  const incomeSeries = getSpendingTimeSeries(expenses, currency, groupBy, conversion, "income");

  const incomeMap = new Map<string, number>();
  for (const p of incomeSeries) {
    const val = (p.total as number) ?? 0;
    if (val > 0) incomeMap.set(p.period, val);
  }

  return expenseSeries.map((p) => ({
    period: p.period,
    expenses: (p.total as number) ?? 0,
    income: incomeMap.get(p.period) ?? 0,
  }));
}
