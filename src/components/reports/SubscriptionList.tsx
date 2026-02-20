"use client";

import { MonthlySubscription } from "@/types";
import { formatCurrency } from "@/lib/currency";

export function SubscriptionList({
  subscriptions,
}: {
  subscriptions: MonthlySubscription[];
}) {
  if (subscriptions.length === 0) {
    return (
      <div className="py-8 text-center text-muted">
        No recurring payments detected
      </div>
    );
  }

  // Group by currency to compute per-currency totals
  const totalByCurrency: Record<string, number> = {};
  for (const sub of subscriptions) {
    totalByCurrency[sub.currency] =
      (totalByCurrency[sub.currency] ?? 0) + sub.amount;
  }
  const currencies = Object.keys(totalByCurrency).sort();

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="px-3 py-2 text-left font-medium text-muted">
              Name
            </th>
            <th className="px-3 py-2 text-left font-medium text-muted">
              Category
            </th>
            <th className="px-3 py-2 text-left font-medium text-muted">
              Wallet
            </th>
            <th className="px-3 py-2 text-right font-medium text-muted">
              Monthly Cost
            </th>
            <th className="px-3 py-2 text-right font-medium text-muted">
              Months Paid
            </th>
            <th className="px-3 py-2 text-right font-medium text-muted">
              Last Payment
            </th>
          </tr>
        </thead>
        <tbody>
          {subscriptions.map((sub, idx) => (
            <tr
              key={`${sub.name}-${sub.currency}-${idx}`}
              className="border-b border-border/50 hover:bg-accent-light/30"
            >
              <td className="px-3 py-2 font-medium">{sub.name}</td>
              <td className="px-3 py-2 text-muted">{sub.category}</td>
              <td className="px-3 py-2 text-muted">{sub.wallet}</td>
              <td className="px-3 py-2 text-right font-mono tabular-nums">
                {formatCurrency(sub.amount, sub.currency)}
              </td>
              <td className="px-3 py-2 text-right tabular-nums text-muted">
                {sub.monthsPaid}
              </td>
              <td className="px-3 py-2 text-right tabular-nums text-muted">
                {sub.lastPaidMonth}
              </td>
            </tr>
          ))}
          <tr className="border-t-2 border-border font-bold">
            <td className="px-3 py-2" colSpan={3}>
              Monthly Total
            </td>
            <td className="px-3 py-2 text-right font-mono tabular-nums" colSpan={3}>
              <div className="flex flex-col items-end gap-0.5">
                {currencies.map((curr) => (
                  <span key={curr}>
                    {formatCurrency(
                      Math.round(totalByCurrency[curr] * 100) / 100,
                      curr
                    )}
                  </span>
                ))}
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
