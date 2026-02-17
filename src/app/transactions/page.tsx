"use client";

import { useEffect, useState, useCallback } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { FilterBar } from "@/components/ui/FilterBar";
import { PeriodPicker } from "@/components/ui/PeriodPicker";
import { HashtagText } from "@/components/ui/HashtagText";
import { TagTransactions } from "@/components/ui/TagTransactions";
import { useCurrency } from "@/components/providers/CurrencyProvider";
import { formatCurrency } from "@/lib/currency";
import { Expense, FilterParams } from "@/types";
import { format } from "date-fns";

const PAGE_SIZE = 50;

interface ExpensesData {
  expenses: Expense[];
  total: number;
  categories: string[];
  wallets: string[];
}

export default function TransactionsPage() {
  const [filters, setFilters] = useState<FilterParams>({});
  const [categories, setCategories] = useState<string[]>([]);
  const [wallets, setWallets] = useState<string[]>([]);
  const [data, setData] = useState<ExpensesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const { wallet: globalWallet } = useCurrency();

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
    params.set("limit", String(PAGE_SIZE));
    params.set("offset", String(page * PAGE_SIZE));
    if (filters.startDate) params.set("startDate", filters.startDate);
    if (filters.endDate) params.set("endDate", filters.endDate);
    if (filters.category) params.set("category", filters.category);
    if (globalWallet) params.set("wallet", globalWallet);

    try {
      const res = await fetch(`/api/expenses?${params}`);
      const d = await res.json();
      setData(d);
    } catch (e) {
      console.error("Failed to fetch transactions:", e);
    } finally {
      setLoading(false);
    }
  }, [filters, page, globalWallet]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [filters, globalWallet]);

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;

  return (
    <PageShell title="Transactions">
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
        ) : !data || data.total === 0 ? (
          <div className="py-12 text-center text-muted">
            <p className="text-lg">No transactions found</p>
            <p className="mt-2 text-sm">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="relative">
            {loading && (
              <div className="absolute inset-0 z-10 flex items-start justify-center pt-24 bg-background/60">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
              </div>
            )}
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-muted">
                  {data.total} transaction{data.total !== 1 ? "s" : ""}
                  {totalPages > 1 && (
                    <> &middot; page {page + 1} of {totalPages}</>
                  )}
                </p>
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
                    {data.expenses.map((e) => (
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-center gap-3">
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="rounded border border-border px-3 py-1.5 text-sm text-muted hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-muted">
                    {page + 1} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="rounded border border-border px-3 py-1.5 text-sm text-muted hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <TagTransactions tag={selectedTag} onClose={() => setSelectedTag(null)} />
    </PageShell>
  );
}
