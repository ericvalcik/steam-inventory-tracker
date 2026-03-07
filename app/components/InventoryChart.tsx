"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface DataPoint {
  date: string;
  value: number;
  invested?: number;
}

interface Props {
  data: DataPoint[];
}

const RANGES = [
  { label: "7D", days: 7 },
  { label: "30D", days: 30 },
  { label: "90D", days: 90 },
  { label: "1Y", days: 365 },
  { label: "All", days: null },
] as const;

function getFilteredData(data: DataPoint[], days: number | null): DataPoint[] {
  if (days === null) return data;
  if (data.length === 0) return data;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - days);
  const startStr = startDate.toISOString().slice(0, 10);

  const inRange = data.filter((d) => d.date >= startStr);
  const firstActual = data[0]; // data is sorted ASC

  // If our earliest data is after the range start, prepend a backfill point
  // at the range start using the oldest values — this draws a flat line back
  if (firstActual.date > startStr) {
    return [
      { date: startStr, value: firstActual.value, invested: firstActual.invested },
      ...inRange,
    ];
  }

  return inRange;
}

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(0)}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "2-digit",
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs shadow-lg space-y-0.5">
      <p className="text-zinc-400 mb-1">{formatDate(label)}</p>
      {payload.map((entry: { name: string; value: number; color: string }) => (
        <p key={entry.name} style={{ color: entry.color }} className="font-semibold">
          {entry.name === "value" ? "Value" : "Invested"}: {formatPrice(entry.value)}
        </p>
      ))}
    </div>
  );
}

export default function InventoryChart({ data }: Props) {
  const [range, setRange] = useState<(typeof RANGES)[number]["label"]>("7D");

  if (data.length === 0) return null;

  const selectedDays = RANGES.find((r) => r.label === range)!.days;
  const filtered = getFilteredData(data, selectedDays);

  const allValues = filtered.flatMap((d) =>
    [d.value, d.invested].filter((v): v is number => v !== undefined)
  );
  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);
  const padding = (maxValue - minValue) * 0.1 || maxValue * 0.1;

  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wide">
          Portfolio Value History
        </h2>
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <button
              key={r.label}
              onClick={() => setRange(r.label)}
              className={`px-2 py-0.5 text-xs rounded transition-colors ${
                range === r.label
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={filtered} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            tick={{ fontSize: 10, fill: "#71717a" }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tickFormatter={formatPrice}
            tick={{ fontSize: 10, fill: "#71717a" }}
            tickLine={false}
            axisLine={false}
            width={60}
            domain={[minValue - padding, maxValue + padding]}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(value) => (
              <span className="text-xs text-zinc-400">
                {value === "value" ? "Market Value" : "Invested"}
              </span>
            )}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#10b981"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: "#10b981", strokeWidth: 0 }}
          />
          <Line
            type="monotone"
            dataKey="invested"
            stroke="#6366f1"
            strokeWidth={2}
            strokeDasharray="4 2"
            dot={false}
            activeDot={{ r: 4, fill: "#6366f1", strokeWidth: 0 }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
