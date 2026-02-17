"use client";

import { useEffect, useState, useCallback } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { FilterBar } from "@/components/ui/FilterBar";
import { PeriodPicker } from "@/components/ui/PeriodPicker";
import { SpendingOverTime } from "@/components/charts/SpendingOverTime";
import {
  CategoryBreakdownBar,
  CategoryBreakdownPie,
} from "@/components/charts/CategoryBreakdown";
import { WalletComparison } from "@/components/charts/WalletComparison";
import { CurrencySplit } from "@/components/charts/CurrencySplit";
import { FilterParams, TimeSeriesPoint } from "@/types";
import { useCurrency } from "@/components/providers/CurrencyProvider";

interface TrendsData {
  timeSeries: TimeSeriesPoint[];
  categoryBreakdown: { category: string; amount: number }[];
  tagBreakdown: { tag: string; amount: number; count: number }[];
  walletBreakdown: TimeSeriesPoint[];
  incomeExpenseTimeSeries?: TimeSeriesPoint[];
  incomeCategoryBreakdown?: { category: string; amount: number }[];
}

export default function TrendsPage() {
  const [filters, setFilters] = useState<FilterParams>({});
  const [categories, setCategories] = useState<string[]>([]);
  const [wallets, setWallets] = useState<string[]>([]);
  const [data, setData] = useState<TrendsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tagSort, setTagSort] = useState<"amount" | "frequency">("amount");
  const { currency: globalCurrency, mode: currencyMode, wallet: globalWallet } = useCurrency();

  // Fetch filter options on mount
  useEffect(() => {
    fetch("/api/expenses?limit=0")
      .then((r) => r.json())
      .then((d) => {
        setCategories(d.categories ?? []);
        setWallets(d.wallets ?? []);
      });
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.startDate) params.set("startDate", filters.startDate);
    if (filters.endDate) params.set("endDate", filters.endDate);
    if (filters.category) params.set("category", filters.category);
    if (globalWallet) params.set("wallet", globalWallet);

    if (globalCurrency) {
      if (currencyMode === "convert") {
        params.set("convertTo", globalCurrency);
      } else {
        params.set("currency", globalCurrency);
      }
    }

    try {
      const res = await fetch(`/api/summary?${params}`);
      const d = await res.json();
      setData(d);
    } catch (e) {
      console.error("Failed to fetch trends:", e);
    } finally {
      setLoading(false);
    }
  }, [filters, globalCurrency, currencyMode, globalWallet]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const hasIncomeExpenseSeries = (data?.incomeExpenseTimeSeries?.length ?? 0) > 0;
  const chartData = hasIncomeExpenseSeries ? data!.incomeExpenseTimeSeries! : (data?.timeSeries ?? []);
  const timeSeriesKeys = hasIncomeExpenseSeries
    ? ["expenses", "income"]
    : data?.timeSeries?.length
      ? [...new Set(data.timeSeries.flatMap((p) => Object.keys(p).filter((k) => k !== "period")))]
      : [];

  const walletNames =
    data?.walletBreakdown?.length
      ? [
          ...new Set(
            data.walletBreakdown.flatMap((p) =>
              Object.keys(p).filter((k) => k !== "period")
            )
          ),
        ]
      : [];

  // Currency split from time series (only in filter mode)
  const currencySplitData: { currency: string; amount: number }[] = [];
  if (data?.timeSeries && !globalCurrency && currencyMode === "filter") {
    const totals: Record<string, number> = {};
    for (const point of data.timeSeries) {
      for (const [k, v] of Object.entries(point)) {
        if (k !== "period" && typeof v === "number") {
          totals[k] = (totals[k] ?? 0) + v;
        }
      }
    }
    for (const [currency, amount] of Object.entries(totals)) {
      currencySplitData.push({
        currency,
        amount: Math.round(amount * 100) / 100,
      });
    }
  }

  // Currency indicator helper
  const currencyIndicator = globalCurrency
    ? currencyMode === "convert"
      ? ` (converted to ${globalCurrency})`
      : ` (${globalCurrency})`
    : "";

  return (
    <PageShell title="Trends">
      <div className="space-y-6">
        <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted">Period</label>
            <PeriodPicker
            value={{ startDate: filters.startDate, endDate: filters.endDate }}
            onChange={(range) =>
              setFilters((prev) => ({
                ...prev,
                startDate: range.startDate,
                endDate: range.endDate,
              }))
            }
          />
          </div>
          <FilterBar
            filters={filters}
            onChange={setFilters}
            categories={categories}
            wallets={wallets}
            hideDates
            hideWallet
          />
        </div>

        {loading && !data ? (
          <div className="py-12 text-center text-muted">Loading...</div>
        ) : (
          <div className="relative grid gap-6 lg:grid-cols-2">
            {loading && (
              <div className="absolute inset-0 z-10 flex items-start justify-center pt-24 bg-background/60 lg:col-span-2">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
              </div>
            )}
            {/* Spending Over Time */}
            <div className="rounded-lg border border-border bg-card p-4 lg:col-span-2">
              <h2 className="mb-4 text-lg font-semibold">
                {hasIncomeExpenseSeries ? "Income & Spending Over Time" : "Spending Over Time"}
                {currencyIndicator && (
                  <span className="ml-2 text-sm font-normal text-muted">
                    {currencyIndicator}
                  </span>
                )}
              </h2>
              <SpendingOverTime
                data={chartData}
                keys={timeSeriesKeys}
                height={300}
              />
            </div>

            {/* Category Breakdown Bar */}
            <div className="rounded-lg border border-border bg-card p-4">
              <h2 className="mb-4 text-lg font-semibold">
                Top Categories
                {currencyIndicator && (
                  <span className="ml-2 text-sm font-normal text-muted">
                    {currencyIndicator}
                  </span>
                )}
              </h2>
              <CategoryBreakdownBar
                data={data?.categoryBreakdown ?? []}
                height={350}
              />
            </div>

            {/* Category Breakdown Pie */}
            <div className="rounded-lg border border-border bg-card p-4">
              <h2 className="mb-4 text-lg font-semibold">
                Category Distribution
                {currencyIndicator && (
                  <span className="ml-2 text-sm font-normal text-muted">
                    {currencyIndicator}
                  </span>
                )}
              </h2>
              <CategoryBreakdownPie
                data={data?.categoryBreakdown ?? []}
                height={350}
              />
            </div>

            {/* Tag Breakdown */}
            {(data?.tagBreakdown?.length ?? 0) > 0 && (
              <div className="rounded-lg border border-border bg-card p-4">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">
                    Tag Breakdown
                    {currencyIndicator && (
                      <span className="ml-2 text-sm font-normal text-muted">
                        {currencyIndicator}
                      </span>
                    )}
                  </h2>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setTagSort("amount")}
                      className={`rounded px-2 py-1 text-xs ${
                        tagSort === "amount"
                          ? "bg-foreground text-background"
                          : "border border-border text-muted hover:text-foreground"
                      }`}
                    >
                      By Amount
                    </button>
                    <button
                      onClick={() => setTagSort("frequency")}
                      className={`rounded px-2 py-1 text-xs ${
                        tagSort === "frequency"
                          ? "bg-foreground text-background"
                          : "border border-border text-muted hover:text-foreground"
                      }`}
                    >
                      By Frequency
                    </button>
                  </div>
                </div>
                <CategoryBreakdownBar
                  data={(data?.tagBreakdown ?? [])
                    .slice()
                    .sort((a, b) =>
                      tagSort === "amount"
                        ? b.amount - a.amount
                        : b.count - a.count
                    )
                    .slice(0, 10)
                    .map((t) => ({
                      category: t.tag,
                      amount: tagSort === "amount" ? t.amount : t.count,
                    }))}
                  height={350}
                />
              </div>
            )}

            {/* Income Categories */}
            {(data?.incomeCategoryBreakdown?.length ?? 0) > 0 && (
              <div className="rounded-lg border border-border bg-card p-4">
                <h2 className="mb-4 text-lg font-semibold">
                  Income Categories
                  {currencyIndicator && (
                    <span className="ml-2 text-sm font-normal text-muted">
                      {currencyIndicator}
                    </span>
                  )}
                </h2>
                <CategoryBreakdownBar
                  data={data?.incomeCategoryBreakdown ?? []}
                  height={350}
                />
              </div>
            )}

            {/* Wallet Comparison */}
            <div className="rounded-lg border border-border bg-card p-4 lg:col-span-2">
              <h2 className="mb-4 text-lg font-semibold">
                Wallet Comparison
                {currencyIndicator && (
                  <span className="ml-2 text-sm font-normal text-muted">
                    {currencyIndicator}
                  </span>
                )}
              </h2>
              <WalletComparison
                data={data?.walletBreakdown ?? []}
                wallets={walletNames}
                height={300}
              />
            </div>

            {/* Currency Split - only in filter mode */}
            {currencySplitData.length > 1 && (
              <div className="rounded-lg border border-border bg-card p-4">
                <h2 className="mb-4 text-lg font-semibold">
                  Currency Split
                </h2>
                <CurrencySplit data={currencySplitData} />
              </div>
            )}
          </div>
        )}
      </div>
    </PageShell>
  );
}
