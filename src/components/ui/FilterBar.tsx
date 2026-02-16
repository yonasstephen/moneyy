"use client";

import { FilterParams } from "@/types";
import { Select } from "./Select";

interface FilterBarProps {
  filters: FilterParams;
  onChange: (filters: FilterParams) => void;
  categories: string[];
  wallets: string[];
  hideDates?: boolean;
  hideWallet?: boolean;
}

export function FilterBar({
  filters,
  onChange,
  categories,
  wallets,
  hideDates,
  hideWallet,
}: FilterBarProps) {
  function update(key: keyof FilterParams, value: string) {
    onChange({ ...filters, [key]: value || undefined });
  }

  const categoryOptions = [
    { value: "", label: "All" },
    ...categories.map((c) => ({ value: c, label: c })),
  ];

  const walletOptions = [
    { value: "", label: "All" },
    ...wallets.map((w) => ({ value: w, label: w })),
  ];

  return (
    <>
      {!hideDates && (
        <>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted">From</label>
            <input
              type="date"
              value={filters.startDate ?? ""}
              onChange={(e) => update("startDate", e.target.value)}
              className="rounded border border-border bg-card px-3 py-1.5 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted">To</label>
            <input
              type="date"
              value={filters.endDate ?? ""}
              onChange={(e) => update("endDate", e.target.value)}
              className="rounded border border-border bg-card px-3 py-1.5 text-sm"
            />
          </div>
        </>
      )}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted">Category</label>
        <Select
          value={filters.category ?? ""}
          onChange={(v) => update("category", v)}
          options={categoryOptions}
          placeholder="All"
          className="min-w-[8rem]"
        />
      </div>
      {!hideWallet && (
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted">Wallet</label>
          <Select
            value={filters.wallet ?? ""}
            onChange={(v) => update("wallet", v)}
            options={walletOptions}
            placeholder="All"
            className="min-w-[8rem]"
          />
        </div>
      )}
      <div className="flex items-end">
        <button
          onClick={() => onChange({})}
          className="rounded border border-border px-3 py-1.5 text-sm text-muted hover:text-foreground"
        >
          Clear
        </button>
      </div>
    </>
  );
}
