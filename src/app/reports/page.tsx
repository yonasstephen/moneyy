"use client";

import { useEffect, useState, useCallback } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { MonthlySummaryTable } from "@/components/reports/MonthlySummaryTable";
import { CategoryTable } from "@/components/reports/CategoryTable";
import { SubscriptionList } from "@/components/reports/SubscriptionList";
import { Select } from "@/components/ui/Select";
import { useCurrency } from "@/components/providers/CurrencyProvider";
import { Expense, MonthlySummary, MonthlySubscription } from "@/types";

export default function ReportsPage() {
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [month, setMonth] = useState("");
  const { currency: globalCurrency, mode: currencyMode, wallet: globalWallet } = useCurrency();
  const [summaries, setSummaries] = useState<MonthlySummary[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [subscriptions, setSubscriptions] = useState<MonthlySubscription[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("startDate", `${year}-01-01`);
    params.set("endDate", `${year}-12-31`);

    const expParams = new URLSearchParams(params);
    const sumParams = new URLSearchParams(params);
    sumParams.set("type", "monthly");
    if (globalWallet) {
      expParams.set("wallet", globalWallet);
      sumParams.set("wallet", globalWallet);
    }

    if (globalCurrency) {
      if (currencyMode === "convert") {
        expParams.set("convertTo", globalCurrency);
        sumParams.set("convertTo", globalCurrency);
      } else if (currencyMode === "filter") {
        expParams.set("currency", globalCurrency);
        sumParams.set("currency", globalCurrency);
      }
    }

    // Subscription params: all-time data filtered only by wallet/currency
    const subParams = new URLSearchParams();
    if (globalWallet) subParams.set("wallet", globalWallet);
    if (globalCurrency && currencyMode === "filter") {
      subParams.set("currency", globalCurrency);
    }

    try {
      const [sumRes, expRes, subRes] = await Promise.all([
        fetch(`/api/summary?${sumParams}`),
        fetch(`/api/expenses?${expParams}`),
        fetch(`/api/subscriptions?${subParams}`),
      ]);
      const sumData = await sumRes.json();
      const expData = await expRes.json();
      const subData = await subRes.json();
      setSummaries(sumData.monthlySummaries ?? []);
      setExpenses(expData.expenses ?? []);
      setSubscriptions(subData.subscriptions ?? []);
    } catch (e) {
      console.error("Failed to fetch reports:", e);
    } finally {
      setLoading(false);
    }
  }, [year, globalCurrency, currencyMode, globalWallet]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter expenses by selected month
  const filteredExpenses = month
    ? expenses.filter((e) => {
        const d = new Date(e.date);
        const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        return m === month;
      })
    : expenses;

  // Filter summaries by month if selected
  const filteredSummaries = month
    ? summaries.filter((s) => s.month === month)
    : summaries;

  // CSV export
  function exportCSV() {
    const isConverted = currencyMode === "convert" && !!globalCurrency;
    const headers = ["Date", "Category", "Amount", "Currency", "Type", "Wallet", "Note"];
    if (isConverted) headers.push("Converted Amount", "Converted Currency");
    const rows = [headers.join(",")];

    for (const e of filteredExpenses) {
      if (e.amount === 0) continue;
      const type = e.amount < 0 ? "Expense" : "Income";
      const row = [
        new Date(e.date).toISOString().split("T")[0],
        `"${e.category}"`,
        Math.abs(e.amount).toFixed(2),
        e.currency,
        type,
        `"${e.wallet}"`,
        `"${e.note.replace(/"/g, '""')}"`,
      ];
      if (isConverted) {
        const exp = e as unknown as { convertedAmount?: number; convertedCurrency?: string };
        row.push(exp.convertedAmount ? Math.abs(exp.convertedAmount).toFixed(2) : "");
        row.push(exp.convertedCurrency ?? "");
      }
      rows.push(row.join(","));
    }
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions-${year}${month ? `-${month}` : ""}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const years = Array.from({ length: 5 }, (_, i) =>
    (new Date().getFullYear() - i).toString()
  );

  const monthLabels = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const yearOptions = years.map((y) => ({ value: y, label: y }));
  const monthOptions = [
    { value: "", label: "All months" },
    ...monthLabels.map((label, i) => ({
      value: `${year}-${String(i + 1).padStart(2, "0")}`,
      label,
    })),
  ];

  return (
    <PageShell
      title="Reports"
      actions={
        <button
          onClick={exportCSV}
          className="rounded-md border border-border px-4 py-2 text-sm hover:bg-accent-light"
        >
          Export CSV
        </button>
      }
    >
      <div className="space-y-6">
        {/* Year/Month selector */}
        <div className="flex gap-3">
          <Select
            value={year}
            onChange={setYear}
            options={yearOptions}
            className="w-28"
          />
          <Select
            value={month}
            onChange={setMonth}
            options={monthOptions}
            placeholder="All months"
            className="w-40"
          />
        </div>

        {loading && !expenses.length ? (
          <div className="py-12 text-center text-muted">Loading...</div>
        ) : (
          <div className="relative">
            {loading && (
              <div className="absolute inset-0 z-10 flex items-start justify-center pt-24 bg-background/60">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
              </div>
            )}
            {/* Monthly Pivot Table */}
            <div className="rounded-lg border border-border bg-card p-4">
              <h2 className="mb-4 text-lg font-semibold">
                Monthly Summary
              </h2>
              <MonthlySummaryTable
                summaries={filteredSummaries}
                currency={globalCurrency || undefined}
              />
            </div>

            {/* Category Detail */}
            <div className="mt-6 rounded-lg border border-border bg-card p-4">
              <h2 className="mb-4 text-lg font-semibold">
                Category Breakdown
                {currencyMode === "convert" && globalCurrency && (
                  <span className="ml-2 text-sm font-normal text-muted">
                    (converted to {globalCurrency})
                  </span>
                )}
              </h2>
              <CategoryTable
                expenses={filteredExpenses}
                currency={currencyMode === "filter" ? globalCurrency : undefined}
                convertedCurrency={currencyMode === "convert" ? globalCurrency : undefined}
              />
            </div>

            {/* Monthly Subscriptions */}
            <div className="mt-6 rounded-lg border border-border bg-card p-4">
              <div className="mb-4 flex items-baseline gap-2">
                <h2 className="text-lg font-semibold">Monthly Subscriptions</h2>
                {subscriptions.length > 0 && (
                  <span className="text-sm text-muted">
                    {subscriptions.length} recurring payment{subscriptions.length !== 1 ? "s" : ""} detected
                  </span>
                )}
              </div>
              <p className="mb-4 text-sm text-muted">
                Payments with the exact same amount appearing in multiple months across all time.
              </p>
              <SubscriptionList subscriptions={subscriptions} />
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
