"use client";

import { useEffect, useState, useCallback } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { SyncButton } from "@/components/ui/SyncButton";
import { SpendingOverTime } from "@/components/charts/SpendingOverTime";
import { useCurrency } from "@/components/providers/CurrencyProvider";
import { HashtagText } from "@/components/ui/HashtagText";
import { TagTransactions } from "@/components/ui/TagTransactions";
import { formatCurrency } from "@/lib/currency";
import { Expense, TimeSeriesPoint, GroupBy } from "@/types";
import { format } from "date-fns";

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
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [groupBy, setGroupBy] = useState<GroupBy>("month");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const { currency: globalCurrency, mode: currencyMode, wallet: globalWallet } = useCurrency();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const isConverting = currencyMode === "convert" && globalCurrency;

      const sumParams = new URLSearchParams();
      sumParams.set("type", "timeseries");
      sumParams.set("groupBy", groupBy);
      if (isConverting) {
        sumParams.set("convertTo", globalCurrency);
      }
      if (globalWallet) sumParams.set("wallet", globalWallet);

      // Fetch category breakdown for summary cards (covers ALL expenses)
      const catParams = new URLSearchParams();
      catParams.set("type", "categories");
      if (isConverting) {
        catParams.set("convertTo", globalCurrency);
      }
      if (globalWallet) catParams.set("wallet", globalWallet);

      const expParams = new URLSearchParams();
      expParams.set("limit", "20");
      if (globalWallet) expParams.set("wallet", globalWallet);

      const [expRes, sumRes, catRes] = await Promise.all([
        fetch(`/api/expenses?${expParams}`),
        fetch(`/api/summary?${sumParams}`),
        fetch(`/api/summary?${catParams}`),
      ]);
      const expData = await expRes.json();
      const sumData = await sumRes.json();
      const catData = await catRes.json();
      setData(expData);
      setSummary({ ...sumData, categoryBreakdown: catData.categoryBreakdown ?? [] });
    } catch (e) {
      console.error("Failed to fetch dashboard data:", e);
    } finally {
      setLoading(false);
    }
  }, [groupBy, globalCurrency, currencyMode, globalWallet]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const isConverting = currencyMode === "convert" && !!globalCurrency;

  // Compute total spend from category breakdown (covers ALL expenses, not just recent 20)
  const totalByCurrency: Record<string, number> = {};
  if (summary?.categoryBreakdown) {
    if (isConverting) {
      // In convert mode, all categories are already converted — sum into one bucket
      const total = summary.categoryBreakdown.reduce((s, c) => s + c.amount, 0);
      totalByCurrency[globalCurrency] = Math.round(total * 100) / 100;
    } else {
      // In filter mode, we don't have per-currency breakdown from categories API
      // Fall back to time series keys which are currency-keyed
      if (summary?.timeSeries) {
        for (const point of summary.timeSeries) {
          for (const [k, v] of Object.entries(point)) {
            if (k !== "period" && typeof v === "number") {
              totalByCurrency[k] = (totalByCurrency[k] ?? 0) + v;
            }
          }
        }
        for (const k of Object.keys(totalByCurrency)) {
          totalByCurrency[k] = Math.round(totalByCurrency[k] * 100) / 100;
        }
      }
    }
  }

  const topCategory = summary?.categoryBreakdown?.[0];

  const timeSeriesKeys = summary?.timeSeries?.length
    ? [...new Set(summary.timeSeries.flatMap((p) => Object.keys(p).filter((k) => k !== "period")))]
    : [];

  return (
    <PageShell title="Dashboard" actions={<SyncButton onSynced={fetchData} />}>
      {loading && !data ? (
        <div className="py-12 text-center text-muted">Loading...</div>
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
          {/* Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(totalByCurrency).map(([curr, total]) => (
              <div
                key={curr}
                className="rounded-lg border border-border bg-card p-4"
              >
                <div className="text-sm text-muted">Total Spend</div>
                <div className="mt-1 text-2xl font-bold tabular-nums">
                  {formatCurrency(total, curr)}
                </div>
              </div>
            ))}
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="text-sm text-muted">Transactions</div>
              <div className="mt-1 text-2xl font-bold">{data.total}</div>
            </div>
            {topCategory && (
              <div className="rounded-lg border border-border bg-card p-4">
                <div className="text-sm text-muted">Top Category</div>
                <div className="mt-1 text-2xl font-bold">
                  {topCategory.category}
                </div>
              </div>
            )}
          </div>

          {/* Mini Spending Trend */}
          {summary?.timeSeries && summary.timeSeries.length > 0 && (
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">
                  Spending Trend
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
                data={summary.timeSeries}
                keys={timeSeriesKeys}
                height={250}
                variant="bar"
              />
            </div>
          )}

          {/* Recent Transactions */}
          <div className="rounded-lg border border-border bg-card p-4">
            <h2 className="mb-4 text-lg font-semibold">
              Recent Transactions
            </h2>
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
