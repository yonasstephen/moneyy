"use client";

import { useEffect, useState } from "react";
import { Modal } from "./Modal";
import { formatCurrency } from "@/lib/currency";
import { Expense } from "@/types";
import { format } from "date-fns";

interface TagTransactionsProps {
  tag: string | null;
  onClose: () => void;
}

export function TagTransactions({ tag, onClose }: TagTransactionsProps) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!tag) return;
    setLoading(true);
    fetch(`/api/expenses?tag=${encodeURIComponent(tag)}`)
      .then((r) => r.json())
      .then((d) => setExpenses(d.expenses ?? []))
      .catch(() => setExpenses([]))
      .finally(() => setLoading(false));
  }, [tag]);

  return (
    <Modal open={!!tag} onClose={onClose} title={`Transactions: ${tag}`}>
      {loading ? (
        <div className="py-8 text-center text-muted">Loading...</div>
      ) : expenses.length === 0 ? (
        <div className="py-8 text-center text-muted">No transactions found</div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-muted">
              <th className="px-3 py-2 text-left">Date</th>
              <th className="px-3 py-2 text-left">Category</th>
              <th className="px-3 py-2 text-left">Note</th>
              <th className="px-3 py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((e) => (
              <tr
                key={`${e.id}-${e.sourceFile}`}
                className="border-b border-border/50"
              >
                <td className="px-3 py-2">
                  {format(new Date(e.date), "dd MMM yyyy")}
                </td>
                <td className="px-3 py-2">{e.category}</td>
                <td className="px-3 py-2 text-muted">{e.note}</td>
                <td className="px-3 py-2 text-right font-mono">
                  {e.amount < 0 ? "-" : ""}{formatCurrency(Math.abs(e.amount), e.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Modal>
  );
}
