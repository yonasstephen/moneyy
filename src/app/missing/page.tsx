"use client";

import { useEffect, useState } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { MissingExpenseCard } from "@/components/missing/MissingExpenseCard";
import { MissingExpenseAlert } from "@/types";

export default function MissingPage() {
  const [alerts, setAlerts] = useState<MissingExpenseAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/missing")
      .then((r) => r.json())
      .then((d) => setAlerts(d.alerts ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <PageShell title="Missing Expenses">
      {loading ? (
        <div className="py-12 text-center text-muted">Analyzing...</div>
      ) : alerts.length === 0 ? (
        <div className="py-12 text-center text-muted">
          <p className="text-lg">No missing expenses detected</p>
          <p className="mt-2 text-sm">
            All recurring expenses appear to be present. Make sure data is synced
            and expenses use #hashtags for recurring items.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted">
            Found {alerts.length} potentially missing recurring expense
            {alerts.length !== 1 ? "s" : ""}. These are expenses tagged with
            #hashtags that appear regularly but are missing from certain months.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {alerts.map((alert) => (
              <MissingExpenseCard
                key={`${alert.tag}-${alert.category}-${alert.wallet}`}
                alert={alert}
              />
            ))}
          </div>
        </div>
      )}
    </PageShell>
  );
}
