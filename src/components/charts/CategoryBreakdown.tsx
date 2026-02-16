"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { formatNumber } from "@/lib/currency";

const COLORS = [
  "#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6",
  "#ec4899", "#14b8a6", "#f97316", "#6366f1", "#84cc16",
];

interface CategoryData {
  category: string;
  amount: number;
}

export function CategoryBreakdownBar({
  data,
  height = 300,
}: {
  data: CategoryData[];
  height?: number;
}) {
  if (data.length === 0) {
    return <div className="flex h-48 items-center justify-center text-muted">No data</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data.slice(0, 10)} layout="vertical" margin={{ left: 80 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis type="number" tick={{ fontSize: 12 }} stroke="var(--muted)" />
        <YAxis
          dataKey="category"
          type="category"
          tick={{ fontSize: 12 }}
          stroke="var(--muted)"
          width={75}
        />
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
        <Bar dataKey="amount" fill="#3b82f6" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function CategoryBreakdownPie({
  data,
  height = 300,
}: {
  data: CategoryData[];
  height?: number;
}) {
  if (data.length === 0) {
    return <div className="flex h-48 items-center justify-center text-muted">No data</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data.slice(0, 10)}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          dataKey="amount"
          nameKey="category"
          label={({
            cx,
            cy,
            midAngle,
            outerRadius,
            name,
            percent,
          }: // eslint-disable-next-line @typescript-eslint/no-explicit-any
          any) => {
            const RADIAN = Math.PI / 180;
            const radius = outerRadius + 18;
            const x = cx + radius * Math.cos(-midAngle * RADIAN);
            const y = cy + radius * Math.sin(-midAngle * RADIAN);
            return (
              <text
                x={x}
                y={y}
                fill="var(--foreground)"
                fontSize={11}
                textAnchor={x > cx ? "start" : "end"}
                dominantBaseline="central"
              >
                {name} {(percent * 100).toFixed(0)}%
              </text>
            );
          }}
          labelLine={false}
        >
          {data.slice(0, 10).map((_, i) => (
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
