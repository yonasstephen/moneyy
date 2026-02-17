"use client";

import { MonthlySummary } from "@/types";
import { formatCurrency } from "@/lib/currency";

export function MonthlySummaryTable({
  summaries,
  currency,
}: {
  summaries: MonthlySummary[];
  currency?: string;
}) {
  if (summaries.length === 0) {
    return <div className="text-muted py-8 text-center">No data available</div>;
  }

  // Collect all categories across all months
  const allCategories = new Set<string>();
  for (const s of summaries) {
    for (const cat of Object.keys(s.byCategory)) {
      allCategories.add(cat);
    }
  }
  const categories = [...allCategories].sort();

  // Collect all currencies across all months (expenses + income)
  const allCurrencies = new Set<string>();
  for (const s of summaries) {
    for (const curr of Object.keys(s.totalByCurrency)) {
      allCurrencies.add(curr);
    }
    if (s.incomeByCurrency) {
      for (const curr of Object.keys(s.incomeByCurrency)) {
        allCurrencies.add(curr);
      }
    }
  }
  const currencies = [...allCurrencies].sort();

  const hasIncome = summaries.some(
    (s) => s.incomeByCurrency && Object.values(s.incomeByCurrency).some((v) => v > 0)
  );

  // Single currency mode: either explicitly set or only one exists
  const singleCurrency = currency || (currencies.length === 1 ? currencies[0] : undefined);

  function catAmountByCurr(s: MonthlySummary, cat: string, curr: string): number {
    return s.byCategory[cat]?.[curr] ?? 0;
  }

  function totalByCurr(s: MonthlySummary, curr: string): number {
    return s.totalByCurrency[curr] ?? 0;
  }

  function incomeByCurr(s: MonthlySummary, curr: string): number {
    return s.incomeByCurrency?.[curr] ?? 0;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="px-3 py-2 text-left font-medium text-muted">
              Category
            </th>
            {summaries.map((s) => (
              <th
                key={s.month}
                className="px-3 py-2 text-right font-medium text-muted"
              >
                {s.month}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {singleCurrency ? (
            // Single currency — one row per category
            <>
              {categories.map((cat) => (
                <tr key={cat} className="border-b border-border/50">
                  <td className="px-3 py-2 font-medium">{cat}</td>
                  {summaries.map((s) => {
                    const amount = catAmountByCurr(s, cat, singleCurrency);
                    return (
                      <td key={s.month} className="px-3 py-2 text-right tabular-nums">
                        {amount > 0 ? formatCurrency(amount, singleCurrency) : "-"}
                      </td>
                    );
                  })}
                </tr>
              ))}
              <tr className="border-t-2 border-border font-bold">
                <td className="px-3 py-2">Total</td>
                {summaries.map((s) => (
                  <td key={s.month} className="px-3 py-2 text-right tabular-nums">
                    {formatCurrency(totalByCurr(s, singleCurrency), singleCurrency)}
                  </td>
                ))}
              </tr>
              {hasIncome && (
                <tr className="border-b border-border/50">
                  <td className="px-3 py-2 font-medium text-success">Income</td>
                  {summaries.map((s) => {
                    const income = incomeByCurr(s, singleCurrency);
                    return (
                      <td key={s.month} className="px-3 py-2 text-right tabular-nums text-success">
                        {income > 0 ? formatCurrency(income, singleCurrency) : "-"}
                      </td>
                    );
                  })}
                </tr>
              )}
              {hasIncome && (
                <tr className="font-bold">
                  <td className="px-3 py-2">Net</td>
                  {summaries.map((s) => {
                    const net = incomeByCurr(s, singleCurrency) - totalByCurr(s, singleCurrency);
                    return (
                      <td key={s.month} className={`px-3 py-2 text-right tabular-nums ${net >= 0 ? "text-success" : "text-danger"}`}>
                        {net < 0 ? "-" : ""}{formatCurrency(Math.abs(net), singleCurrency)}
                      </td>
                    );
                  })}
                </tr>
              )}
            </>
          ) : (
            // Multi-currency — each cell shows stacked amounts per currency
            <>
              {categories.map((cat) => (
                <tr key={cat} className="border-b border-border/50">
                  <td className="px-3 py-2 font-medium">{cat}</td>
                  {summaries.map((s) => (
                    <td key={s.month} className="px-3 py-2 text-right tabular-nums">
                      {currencies.map((curr) => {
                        const amount = catAmountByCurr(s, cat, curr);
                        if (amount <= 0) return null;
                        return (
                          <div key={curr}>
                            {formatCurrency(amount, curr)}
                          </div>
                        );
                      })}
                      {currencies.every((curr) => catAmountByCurr(s, cat, curr) <= 0) && "-"}
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="border-t-2 border-border font-bold">
                <td className="px-3 py-2">Total</td>
                {summaries.map((s) => (
                  <td key={s.month} className="px-3 py-2 text-right tabular-nums">
                    {currencies.map((curr) => {
                      const total = totalByCurr(s, curr);
                      if (total <= 0) return null;
                      return (
                        <div key={curr}>
                          {formatCurrency(total, curr)}
                        </div>
                      );
                    })}
                  </td>
                ))}
              </tr>
              {hasIncome && (
                <tr className="border-b border-border/50">
                  <td className="px-3 py-2 font-medium text-success">Income</td>
                  {summaries.map((s) => (
                    <td key={s.month} className="px-3 py-2 text-right tabular-nums text-success">
                      {currencies.map((curr) => {
                        const income = incomeByCurr(s, curr);
                        if (income <= 0) return null;
                        return (
                          <div key={curr}>
                            {formatCurrency(income, curr)}
                          </div>
                        );
                      })}
                      {currencies.every((curr) => incomeByCurr(s, curr) <= 0) && "-"}
                    </td>
                  ))}
                </tr>
              )}
              {hasIncome && (
                <tr className="font-bold">
                  <td className="px-3 py-2">Net</td>
                  {summaries.map((s) => (
                    <td key={s.month} className="px-3 py-2 text-right tabular-nums">
                      {currencies.map((curr) => {
                        const net = incomeByCurr(s, curr) - totalByCurr(s, curr);
                        if (net === 0 && incomeByCurr(s, curr) === 0 && totalByCurr(s, curr) === 0) return null;
                        return (
                          <div key={curr} className={net >= 0 ? "text-success" : "text-danger"}>
                            {net < 0 ? "-" : ""}{formatCurrency(Math.abs(net), curr)}
                          </div>
                        );
                      })}
                    </td>
                  ))}
                </tr>
              )}
            </>
          )}
        </tbody>
      </table>
    </div>
  );
}
