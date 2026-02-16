"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

import { formatNumber } from "@/lib/currency";

const COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444"];

interface CurrencyData {
  currency: string;
  amount: number;
}

export function CurrencySplit({
  data,
  height = 250,
}: {
  data: CurrencyData[];
  height?: number;
}) {
  if (data.length === 0) {
    return <div className="flex h-48 items-center justify-center text-muted">No data</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          outerRadius={80}
          dataKey="amount"
          nameKey="currency"
          label={({ name, percent }: // eslint-disable-next-line @typescript-eslint/no-explicit-any
            any) => `${name} ${(percent * 100).toFixed(0)}%`
          }
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            color: "var(--foreground)",
          }}
          itemStyle={{ color: "var(--foreground)" }}
          labelStyle={{ color: "var(--foreground)" }}
          formatter={(value: number | undefined) => value != null ? formatNumber(value) : ""}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
