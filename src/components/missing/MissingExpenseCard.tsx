import { MissingExpenseAlert } from "@/types";
import { formatCurrency } from "@/lib/currency";

export function MissingExpenseCard({ alert }: { alert: MissingExpenseAlert }) {
  const confidenceColor =
    alert.confidence >= 0.8
      ? "text-danger"
      : alert.confidence >= 0.6
        ? "text-warning"
        : "text-muted";

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-2 flex items-start justify-between">
        <div>
          <span className="text-lg font-bold">{alert.tag}</span>
          <div className="mt-1 flex gap-2 text-xs text-muted">
            <span>{alert.category}</span>
            <span>|</span>
            <span>{alert.wallet}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono text-lg font-bold">
            {formatCurrency(alert.averageAmount, alert.currency)}
          </div>
          <div className="text-xs text-muted">avg/month</div>
        </div>
      </div>

      <div className="mt-3">
        <div className="mb-1 text-xs font-medium text-muted">
          Missing months:
        </div>
        <div className="flex flex-wrap gap-1">
          {alert.missingMonths.map((m) => (
            <span
              key={m}
              className="rounded bg-danger/10 px-2 py-0.5 text-xs font-medium text-danger"
            >
              {m}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="text-xs text-muted">
          Present in {alert.expectedMonths.length - alert.missingMonths.length}/
          {alert.expectedMonths.length} months
        </div>
        <div className={`text-sm font-medium ${confidenceColor}`}>
          {Math.round(alert.confidence * 100)}% confidence
        </div>
      </div>
    </div>
  );
}
