"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  subDays,
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfYear,
  endOfYear,
  subYears,
  format,
} from "date-fns";

interface DateRange {
  startDate?: string;
  endDate?: string;
}

interface PeriodPickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

interface Preset {
  label: string;
  getRange: () => DateRange;
}

const presets: Preset[] = [
  {
    label: "Last 7 days",
    getRange: () => ({
      startDate: format(subDays(new Date(), 6), "yyyy-MM-dd"),
      endDate: format(new Date(), "yyyy-MM-dd"),
    }),
  },
  {
    label: "Last 30 days",
    getRange: () => ({
      startDate: format(subDays(new Date(), 29), "yyyy-MM-dd"),
      endDate: format(new Date(), "yyyy-MM-dd"),
    }),
  },
  {
    label: "This month",
    getRange: () => ({
      startDate: format(startOfMonth(new Date()), "yyyy-MM-dd"),
      endDate: format(endOfMonth(new Date()), "yyyy-MM-dd"),
    }),
  },
  {
    label: "Last 3 months",
    getRange: () => ({
      startDate: format(subMonths(new Date(), 3), "yyyy-MM-dd"),
      endDate: format(new Date(), "yyyy-MM-dd"),
    }),
  },
  {
    label: "This year",
    getRange: () => ({
      startDate: format(startOfYear(new Date()), "yyyy-MM-dd"),
      endDate: format(endOfYear(new Date()), "yyyy-MM-dd"),
    }),
  },
  {
    label: "Last year",
    getRange: () => {
      const lastYear = subYears(new Date(), 1);
      return {
        startDate: format(startOfYear(lastYear), "yyyy-MM-dd"),
        endDate: format(endOfYear(lastYear), "yyyy-MM-dd"),
      };
    },
  },
];

function getActiveLabel(value: DateRange): string {
  if (!value.startDate && !value.endDate) return "All time";
  for (const preset of presets) {
    const range = preset.getRange();
    if (range.startDate === value.startDate && range.endDate === value.endDate) {
      return preset.label;
    }
  }
  const parts: string[] = [];
  if (value.startDate) parts.push(value.startDate);
  if (value.endDate) parts.push(value.endDate);
  return parts.join(" - ");
}

export function PeriodPicker({ value, onChange }: PeriodPickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    function handleMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close();
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, close]);

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded border border-border bg-card px-3 py-1.5 text-sm"
      >
        <svg
          className="h-4 w-4 text-muted"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <span>{getActiveLabel(value)}</span>
        <svg
          className={`h-3.5 w-3.5 text-muted transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-72 rounded border border-border bg-card p-3 shadow-lg">
          <div className="mb-3 grid grid-cols-2 gap-1.5">
            {presets.map((preset) => {
              const range = preset.getRange();
              const isActive =
                range.startDate === value.startDate && range.endDate === value.endDate;
              return (
                <button
                  key={preset.label}
                  onClick={() => {
                    onChange(range);
                    close();
                  }}
                  className={`rounded px-2.5 py-1.5 text-left text-sm transition-colors ${
                    isActive
                      ? "bg-foreground text-background"
                      : "text-muted hover:bg-accent-light hover:text-foreground"
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          <div className="border-t border-border pt-3">
            <div className="mb-2 text-xs text-muted">Custom range</div>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={value.startDate ?? ""}
                onChange={(e) =>
                  onChange({ ...value, startDate: e.target.value || undefined })
                }
                className="w-full rounded border border-border bg-card px-2 py-1 text-sm"
              />
              <span className="text-muted">-</span>
              <input
                type="date"
                value={value.endDate ?? ""}
                onChange={(e) =>
                  onChange({ ...value, endDate: e.target.value || undefined })
                }
                className="w-full rounded border border-border bg-card px-2 py-1 text-sm"
              />
            </div>
          </div>

          <button
            onClick={() => {
              onChange({});
              close();
            }}
            className="mt-3 w-full rounded border border-border px-2.5 py-1.5 text-sm text-muted hover:text-foreground"
          >
            All time
          </button>
        </div>
      )}
    </div>
  );
}
