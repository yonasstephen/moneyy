"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { PageShell } from "@/components/layout/PageShell";
import { SyncButton } from "@/components/ui/SyncButton";
import { PeriodPicker } from "@/components/ui/PeriodPicker";
import { SpendingOverTime } from "@/components/charts/SpendingOverTime";
import { useCurrency } from "@/components/providers/CurrencyProvider";
import { HashtagText } from "@/components/ui/HashtagText";
import { TagTransactions } from "@/components/ui/TagTransactions";
import { formatCurrency } from "@/lib/currency";
import { Expense, TimeSeriesPoint, GroupBy, MonthlySummary } from "@/types";
import { format } from "date-fns";

const LOADING_MESSAGES = [
  "Crunching your numbers...",
  "Teaching your dollars to do backflips...",
  "Combobulating magic for your finances...",
  "Counting every last penny...",
  "Summoning the spreadsheet spirits...",
  "Herding your transactions...",
  "Balancing the cosmic ledger...",
  "Wrangling receipts from the void...",
];

interface DashboardData {
  expenses: Expense[];
  total: number;
  categories: string[];
  wallets: string[];
  currencies: string[];
}

interface SummaryData {
  timeSeries: TimeSeriesPoint[];
  categoryBreakdown: { category: string; amount: number }[];
  incomeCategoryBreakdown?: { category: string; amount: number }[];
  incomeExpenseTimeSeries?: TimeSeriesPoint[];
  monthlySummaries?: MonthlySummary[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [groupBy, setGroupBy] = useState<GroupBy>("month");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [period, setPeriod] = useState<{ startDate?: string; endDate?: string }>({});
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  const { currency: globalCurrency, mode: currencyMode, wallet: globalWallet } = useCurrency();

  // Cycle loading messages during initial load
  useEffect(() => {
    if (!loading || data) return;
    const interval = setInterval(() => {
      setLoadingMsgIndex((i) => (i + 1) % LOADING_MESSAGES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [loading, data]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const isConverting = currencyMode === "convert" && globalCurrency;

      const sumParams = new URLSearchParams();
      sumParams.set("type", "all");
      sumParams.set("groupBy", groupBy);
      if (isConverting) {
        sumParams.set("convertTo", globalCurrency);
      }
      if (globalWallet) sumParams.set("wallet", globalWallet);
      if (period.startDate) sumParams.set("startDate", period.startDate);
      if (period.endDate) sumParams.set("endDate", period.endDate);

      const expParams = new URLSearchParams();
      expParams.set("limit", "20");
      if (globalWallet) expParams.set("wallet", globalWallet);
      if (period.startDate) expParams.set("startDate", period.startDate);
      if (period.endDate) expParams.set("endDate", period.endDate);

      const [expRes, sumRes] = await Promise.all([
        fetch(`/api/expenses?${expParams}`),
        fetch(`/api/summary?${sumParams}`),
      ]);
      const expData = await expRes.json();
      const sumData = await sumRes.json();
      setData(expData);
      setSummary(sumData);
    } catch (e) {
      console.error("Failed to fetch dashboard data:", e);
    } finally {
      setLoading(false);
    }
  }, [groupBy, globalCurrency, currencyMode, globalWallet, period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const isConverting = currencyMode === "convert" && !!globalCurrency;

  // Compute per-currency totals from monthlySummaries
  const totalByCurrency: Record<string, number> = {};
  const totalIncomeByCurrency: Record<string, number> = {};
  if (summary?.monthlySummaries) {
    for (const ms of summary.monthlySummaries) {
      for (const [curr, amt] of Object.entries(ms.totalByCurrency)) {
        totalByCurrency[curr] = (totalByCurrency[curr] ?? 0) + amt;
      }
      for (const [curr, amt] of Object.entries(ms.incomeByCurrency)) {
        totalIncomeByCurrency[curr] = (totalIncomeByCurrency[curr] ?? 0) + amt;
      }
    }
    for (const k of Object.keys(totalByCurrency)) {
      totalByCurrency[k] = Math.round(totalByCurrency[k] * 100) / 100;
    }
    for (const k of Object.keys(totalIncomeByCurrency)) {
      totalIncomeByCurrency[k] = Math.round(totalIncomeByCurrency[k] * 100) / 100;
    }
  }

  // All currencies that appear in either spend or income
  const allCurrencies = [...new Set([...Object.keys(totalByCurrency), ...Object.keys(totalIncomeByCurrency)])];
  const isMultiCurrency = allCurrencies.length > 1;

  const hasIncomeExpenseSeries = (summary?.incomeExpenseTimeSeries?.length ?? 0) > 0;
  const chartData = hasIncomeExpenseSeries ? summary!.incomeExpenseTimeSeries! : (summary?.timeSeries ?? []);
  const timeSeriesKeys = hasIncomeExpenseSeries
    ? ["expenses", "income"]
    : summary?.timeSeries?.length
      ? [...new Set(summary.timeSeries.flatMap((p) => Object.keys(p).filter((k) => k !== "period")))]
      : [];

  return (
    <PageShell
      title="Dashboard"
      actions={
        <>
          <PeriodPicker value={period} onChange={setPeriod} />
          <SyncButton onSynced={fetchData} />
        </>
      }
    >
      {loading && !data ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
          <p className="text-sm text-muted animate-pulse">
            {LOADING_MESSAGES[loadingMsgIndex]}
          </p>
        </div>
      ) : !data || data.total === 0 ? (
        <div className="py-12 text-center text-muted">
          <p className="text-lg">No expenses loaded</p>
          <p className="mt-2 text-sm">
            Click Sync to load data from Google Sheets
          </p>
        </div>
      ) : (
        <div className="relative space-y-6">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-start justify-center pt-24 bg-background/60">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
            </div>
          )}
          {/* Summary Cards — grouped by currency */}
          <div className="space-y-4">
            {allCurrencies.map((curr) => {
              const spend = totalByCurrency[curr] ?? 0;
              const income = totalIncomeByCurrency[curr] ?? 0;
              const hasIncome = income > 0;
              const net = income - spend;
              const label = isMultiCurrency ? "" : ` (${curr})`;
              return (
                <div key={curr}>
                  {isMultiCurrency && (
                    <div className="mb-2 flex items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted">{curr}</span>
                      <div className="h-px flex-1 bg-border" />
                    </div>
                  )}
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="rounded-lg border border-border bg-card p-4">
                      <div className="text-sm text-muted">Total Spend{label}</div>
                      <div className="mt-1 text-2xl font-bold tabular-nums">
                        {formatCurrency(spend, curr)}
                      </div>
                    </div>
                    {hasIncome && (
                      <div className="rounded-lg border border-border bg-card p-4">
                        <div className="text-sm text-muted">Total Income{label}</div>
                        <div className="mt-1 text-2xl font-bold tabular-nums text-success">
                          {formatCurrency(income, curr)}
                        </div>
                      </div>
                    )}
                    {hasIncome && (
                      <div className="rounded-lg border border-border bg-card p-4">
                        <div className="text-sm text-muted">Net{label}</div>
                        <div className={`mt-1 text-2xl font-bold tabular-nums ${net >= 0 ? "text-success" : "text-danger"}`}>
                          {net < 0 ? "-" : ""}{formatCurrency(Math.abs(net), curr)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-lg border border-border bg-card p-4">
                <div className="text-sm text-muted">Transactions</div>
                <div className="mt-1 text-2xl font-bold">{data.total}</div>
              </div>
            </div>
          </div>

          {/* Mini Spending Trend */}
          {chartData.length > 0 && (
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">
                  {hasIncomeExpenseSeries ? "Income & Spending" : "Spending Trend"}
                  {isConverting && (
                    <span className="ml-2 text-sm font-normal text-muted">
                      (converted to {globalCurrency})
                    </span>
                  )}
                </h2>
                <div className="flex items-center gap-3">
                  <div className="flex rounded-md border border-border text-[13px]">
                    {(["day", "month", "year"] as const).map((g) => (
                      <button
                        key={g}
                        onClick={() => setGroupBy(g)}
                        className={`px-2.5 py-1 capitalize transition-colors ${
                          groupBy === g
                            ? "bg-foreground text-background"
                            : "text-muted hover:text-foreground"
                        } ${g === "day" ? "rounded-l-md" : g === "year" ? "rounded-r-md" : ""}`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <SpendingOverTime
                data={chartData}
                keys={timeSeriesKeys}
                height={250}
                variant="bar"
              />
            </div>
          )}

          {/* Recent Transactions */}
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                Recent Transactions
              </h2>
              <Link
                href="/transactions"
                className="text-sm text-muted hover:text-foreground transition-colors"
              >
                View all &rarr;
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted">
                    <th className="px-3 py-2 text-left">Date</th>
                    <th className="px-3 py-2 text-left">Category</th>
                    <th className="px-3 py-2 text-left">Note</th>
                    <th className="px-3 py-2 text-left">Wallet</th>
                    <th className="px-3 py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {data.expenses.slice(0, 20).map((e) => (
                    <tr
                      key={`${e.id}-${e.sourceFile}`}
                      className="border-b border-border/50"
                    >
                      <td className="px-3 py-2">
                        {format(new Date(e.date), "dd MMM yyyy")}
                      </td>
                      <td className="px-3 py-2">{e.category}</td>
                      <td className="px-3 py-2 text-muted">
                        <HashtagText note={e.note} onTagClick={setSelectedTag} />
                      </td>
                      <td className="px-3 py-2">{e.wallet}</td>
                      <td
                        className={`px-3 py-2 text-right font-mono ${
                          e.amount < 0 ? "text-danger" : "text-success"
                        }`}
                      >
                        {e.amount < 0 ? "-" : ""}{formatCurrency(Math.abs(e.amount), e.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      <TagTransactions tag={selectedTag} onClose={() => setSelectedTag(null)} />
    </PageShell>
  );
}
