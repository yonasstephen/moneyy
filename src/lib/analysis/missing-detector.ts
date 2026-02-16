import { format } from "date-fns";
import { Expense, MissingExpenseAlert, MonthKey } from "@/types";

interface TagGroup {
  tag: string;
  category: string;
  wallet: string;
  currency: string;
  months: Set<MonthKey>;
  amounts: number[];
  firstMonth: MonthKey;
  lastMonth: MonthKey;
}

export function detectMissingExpenses(
  expenses: Expense[]
): MissingExpenseAlert[] {
  // Only consider expenses (negative amounts)
  const expenseOnly = expenses.filter((e) => e.amount < 0 && e.tags.length > 0);

  // Group by (tag, category, wallet, currency)
  const groups = new Map<string, TagGroup>();

  for (const e of expenseOnly) {
    const month = format(e.date, "yyyy-MM");

    for (const tag of e.tags) {
      const key = `${tag}|${e.category}|${e.wallet}|${e.currency}`;
      let group = groups.get(key);

      if (!group) {
        group = {
          tag,
          category: e.category,
          wallet: e.wallet,
          currency: e.currency,
          months: new Set(),
          amounts: [],
          firstMonth: month,
          lastMonth: month,
        };
        groups.set(key, group);
      }

      group.months.add(month);
      group.amounts.push(Math.abs(e.amount));
      if (month < group.firstMonth) group.firstMonth = month;
      if (month > group.lastMonth) group.lastMonth = month;
    }
  }

  const alerts: MissingExpenseAlert[] = [];

  for (const group of groups.values()) {
    // Require 3+ months of history
    if (group.months.size < 3) continue;

    // Calculate expected months (all months in the span)
    const expectedMonths = getMonthRange(group.firstMonth, group.lastMonth);

    // Frequency: how many of the expected months have the tag
    const frequency = group.months.size / expectedMonths.length;

    // Must appear in 70%+ of months
    if (frequency < 0.7) continue;

    const missingMonths = expectedMonths.filter((m) => !group.months.has(m));
    if (missingMonths.length === 0) continue;

    // Recency: how recent is the last occurrence (0-1, 1 = very recent)
    const now = format(new Date(), "yyyy-MM");
    const monthsSinceLast = monthDiff(group.lastMonth, now);
    const recency = Math.max(0, 1 - monthsSinceLast / 12);

    // Amount consistency: inverse of coefficient of variation
    const avgAmount =
      group.amounts.reduce((s, a) => s + a, 0) / group.amounts.length;
    const variance =
      group.amounts.reduce((s, a) => s + (a - avgAmount) ** 2, 0) /
      group.amounts.length;
    const stdDev = Math.sqrt(variance);
    const amountConsistency =
      avgAmount > 0 ? Math.max(0, 1 - stdDev / avgAmount) : 0;

    const confidence =
      frequency * 0.6 + recency * 0.2 + amountConsistency * 0.2;

    if (confidence < 0.5) continue;

    alerts.push({
      tag: group.tag,
      category: group.category,
      wallet: group.wallet,
      currency: group.currency,
      expectedMonths,
      missingMonths,
      averageAmount: Math.round(avgAmount * 100) / 100,
      confidence: Math.round(confidence * 100) / 100,
    });
  }

  return alerts.sort((a, b) => b.confidence - a.confidence);
}

function getMonthRange(start: MonthKey, end: MonthKey): MonthKey[] {
  const months: MonthKey[] = [];
  const [sy, sm] = start.split("-").map(Number);
  const [ey, em] = end.split("-").map(Number);

  let y = sy;
  let m = sm;

  while (y < ey || (y === ey && m <= em)) {
    months.push(`${y}-${String(m).padStart(2, "0")}`);
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
  }

  return months;
}

function monthDiff(a: MonthKey, b: MonthKey): number {
  const [ay, am] = a.split("-").map(Number);
  const [by, bm] = b.split("-").map(Number);
  return (by - ay) * 12 + (bm - am);
}
