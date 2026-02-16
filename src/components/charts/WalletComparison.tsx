"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { formatNumber } from "@/lib/currency";
import { TimeSeriesPoint } from "@/types";

const COLORS = ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6"];

export function WalletComparison({
  data,
  wallets,
  height = 300,
}: {
  data: TimeSeriesPoint[];
  wallets: string[];
  height?: number;
}) {
  if (data.length === 0) {
    return <div className="flex h-48 items-center justify-center text-muted">No data</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="period" tick={{ fontSize: 12 }} stroke="var(--muted)" />
        <YAxis tick={{ fontSize: 12 }} stroke="var(--muted)" />
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
        {wallets.map((wallet, i) => (
          <Bar
            key={wallet}
            dataKey={wallet}
            stackId="stack"
            fill={COLORS[i % COLORS.length]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
