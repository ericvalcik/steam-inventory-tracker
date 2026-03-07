"use client";

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
  if (data.length === 0) return null;

  const allValues = data.flatMap((d) =>
    [d.value, d.invested].filter((v): v is number => v !== undefined)
  );
  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);
  const padding = (maxValue - minValue) * 0.1 || maxValue * 0.1;

  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 mb-6">
      <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wide mb-4">
        Portfolio Value History
      </h2>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
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
