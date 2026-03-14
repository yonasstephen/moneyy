import { format } from "date-fns";
import { Expense, MonthKey, MonthlySubscription } from "@/types";

interface SubscriptionGroup {
  category: string;
  amount: number;
  currency: string;
  walletCounts: Map<string, number>;
  noteCounts: Map<string, number>;
  months: Set<MonthKey>;
  firstMonth: MonthKey;
  lastMonth: MonthKey;
}

/**
 * Detects monthly subscriptions and regular bills by finding expenses
 * with the exact same amount occurring in multiple distinct months.
 *
 * Groups by (amount, currency, category) and requires:
 * - At least 2 distinct months of occurrence
 * - Frequency of ≥50% across the observed date span
 */
export function detectSubscriptions(expenses: Expense[]): MonthlySubscription[] {
  const expenseOnly = expenses.filter((e) => e.amount < 0);

  const groups = new Map<string, SubscriptionGroup>();

  for (const e of expenseOnly) {
    const amount = Math.abs(e.amount);
    const key = `${amount}|${e.currency}|${e.category}`;

    let group = groups.get(key);
    if (!group) {
      const month = format(e.date, "yyyy-MM");
      group = {
        category: e.category,
        amount,
        currency: e.currency,
        walletCounts: new Map(),
        noteCounts: new Map(),
        months: new Set(),
        firstMonth: month,
        lastMonth: month,
      };
      groups.set(key, group);
    }

    const month = format(e.date, "yyyy-MM");
    group.months.add(month);
    if (month < group.firstMonth) group.firstMonth = month;
    if (month > group.lastMonth) group.lastMonth = month;

    group.walletCounts.set(e.wallet, (group.walletCounts.get(e.wallet) ?? 0) + 1);
    if (e.note) {
      group.noteCounts.set(e.note, (group.noteCounts.get(e.note) ?? 0) + 1);
    }
  }

  const subscriptions: MonthlySubscription[] = [];

  for (const group of groups.values()) {
    const monthsList = [...group.months].sort();

    // Require at least 2 distinct months
    if (monthsList.length < 2) continue;

    // Calculate frequency across the span
    const expectedMonths = getMonthRange(group.firstMonth, group.lastMonth);
    const frequency = monthsList.length / expectedMonths.length;

    // Must appear in at least 50% of months in span
    if (frequency < 0.5) continue;

    // Most common wallet
    const topWallet =
      [...group.walletCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";

    // Best display name: most common note, fallback to category
    const topNote =
      [...group.noteCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";

    subscriptions.push({
      name: topNote || group.category,
      category: group.category,
      amount: group.amount,
      currency: group.currency,
      wallet: topWallet,
      monthsPaid: monthsList.length,
      lastPaidMonth: monthsList[monthsList.length - 1],
      monthlyOccurrences: monthsList,
    });
  }

  // Sort by monthly cost descending
  return subscriptions.sort((a, b) => b.amount - a.amount);
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
