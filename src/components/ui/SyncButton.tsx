"use client";

import { useState } from "react";
import { SyncResult } from "@/types";

export function SyncButton({ onSynced }: { onSynced?: () => void }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSync() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/sync", { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Sync failed");
      }
      const data: SyncResult = await res.json();
      setResult(data);
      onSynced?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sync failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleSync}
        disabled={loading}
        className="rounded-md bg-foreground px-4 py-2 text-[13px] font-medium text-background transition-colors hover:opacity-80 disabled:opacity-50"
      >
        {loading ? "Syncing..." : "Sync"}
      </button>
      {result && (
        <span className="text-sm text-muted">
          {result.filesScanned} files, {result.totalExpenses} expenses
        </span>
      )}
      {error && <span className="text-sm text-danger">{error}</span>}
    </div>
  );
}
