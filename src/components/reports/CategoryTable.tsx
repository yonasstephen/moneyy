"use client";

import { useState } from "react";
import { Expense } from "@/types";
import { formatCurrency } from "@/lib/currency";
import { format } from "date-fns";

interface CategoryGroup {
  category: string;
  total: number;
  currency: string;
  expenses: Expense[];
}

interface ConvertedExpense extends Expense {
  convertedAmount?: number;
  convertedCurrency?: string;
}

export function CategoryTable({
  expenses,
  currency,
  convertedCurrency,
}: {
  expenses: Expense[];
  currency?: string;
  convertedCurrency?: string;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const isConverted = !!convertedCurrency;

  // Group expenses by category, filtered by currency (only in filter mode)
  const filtered = currency
    ? (expenses as ConvertedExpense[]).filter((e) => e.currency === currency && e.amount < 0)
    : (expenses as ConvertedExpense[]).filter((e) => e.amount < 0);

  const incomeFiltered = currency
    ? (expenses as ConvertedExpense[]).filter((e) => e.currency === currency && e.amount > 0)
    : (expenses as ConvertedExpense[]).filter((e) => e.amount > 0);

  function buildGroups(items: ConvertedExpense[]): CategoryGroup[] {
    const map = new Map<string, ConvertedExpense[]>();
    for (const e of items) {
      const arr = map.get(e.category) ?? [];
      arr.push(e);
      map.set(e.category, arr);
    }

    const groups: CategoryGroup[] = [];
    for (const [category, catItems] of map) {
      const total = catItems.reduce((s, e) => {
        if (isConverted && e.convertedAmount !== undefined) {
          return s + Math.abs(e.convertedAmount);
        }
        return s + Math.abs(e.amount);
      }, 0);
      groups.push({
        category,
        total: Math.round(total * 100) / 100,
        currency: convertedCurrency ?? currency ?? catItems[0].currency,
        expenses: catItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      });
    }
    return groups.sort((a, b) => b.total - a.total);
  }

  const groups = buildGroups(filtered);
  const incomeGroups = buildGroups(incomeFiltered);

  function renderGroup(group: CategoryGroup, keyPrefix = "") {
    const expandKey = `${keyPrefix}${group.category}`;
    return (
      <div key={expandKey} className="rounded-lg border border-border">
        <button
          onClick={() =>
            setExpanded(expanded === expandKey ? null : expandKey)
          }
          className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-accent-light/50"
        >
          <span className="font-medium">{group.category}</span>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted">
              {group.expenses.length} txns
            </span>
            <span className="font-mono font-medium">
              {formatCurrency(group.total, group.currency)}
            </span>
            <span className="text-muted">
              {expanded === expandKey ? "\u25B2" : "\u25BC"}
            </span>
          </div>
        </button>
        {expanded === expandKey && (
          <div className="border-t border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted">
                  <th className="px-4 py-2 text-left">Date</th>
                  <th className="px-4 py-2 text-left">Note</th>
                  <th className="px-4 py-2 text-left">Wallet</th>
                  <th className="px-4 py-2 text-right">Amount</th>
                  {isConverted && (
                    <th className="px-4 py-2 text-right">Converted</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {(group.expenses as ConvertedExpense[]).map((e) => (
                  <tr key={e.id} className="border-t border-border/50">
                    <td className="px-4 py-2">
                      {format(new Date(e.date), "dd MMM yyyy")}
                    </td>
                    <td className="px-4 py-2 text-muted">{e.note}</td>
                    <td className="px-4 py-2">{e.wallet}</td>
                    <td className="px-4 py-2 text-right font-mono">
                      {formatCurrency(Math.abs(e.amount), e.currency)}
                    </td>
                    {isConverted && e.convertedAmount !== undefined && (
                      <td className="px-4 py-2 text-right font-mono">
                        {formatCurrency(Math.abs(e.convertedAmount), convertedCurrency!)}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {groups.map((group) => renderGroup(group))}
      {incomeGroups.length > 0 && (
        <>
          <div className="mt-4 mb-2 text-sm font-semibold text-success uppercase tracking-wide">
            Income
          </div>
          {incomeGroups.map((group) => renderGroup(group, "income-"))}
        </>
      )}
    </div>
  );
}
