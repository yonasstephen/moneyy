"use client";

import {
  LineChart,
  Line,
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
const KEY_COLORS: Record<string, string> = { expenses: "#ef4444", income: "#22c55e" };

const tooltipStyle = {
  backgroundColor: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: "8px",
  color: "var(--foreground)",
};

export function SpendingOverTime({
  data,
  keys,
  height = 300,
  variant = "line",
}: {
  data: TimeSeriesPoint[];
  keys: string[];
  height?: number;
  variant?: "line" | "bar";
}) {
  if (data.length === 0) {
    return <div className="flex h-48 items-center justify-center text-muted">No data</div>;
  }

  const sharedChildren = (
    <>
      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
      <XAxis dataKey="period" tick={{ fontSize: 12 }} stroke="var(--muted)" />
      <YAxis tick={{ fontSize: 12 }} stroke="var(--muted)" tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
      <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: "var(--foreground)" }} labelStyle={{ color: "var(--foreground)" }} formatter={(value: number | undefined) => value != null ? formatNumber(value) : ""} />
      <Legend />
    </>
  );

  if (variant === "bar") {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          {sharedChildren}
          {keys.map((key, i) => (
            <Bar
              key={key}
              dataKey={key}
              fill={KEY_COLORS[key] ?? COLORS[i % COLORS.length]}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
        {sharedChildren}
        {keys.map((key, i) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            stroke={KEY_COLORS[key] ?? COLORS[i % COLORS.length]}
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
