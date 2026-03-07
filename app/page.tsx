export const dynamic = "force-dynamic";

import InventoryChart from "./components/InventoryChart";
import { getInventory, getPriceMap, type InventoryItem as BaseInventoryItem } from "@/lib/inventory";

interface InventoryItem extends BaseInventoryItem {
  price: number | null;
}

interface HistoryPoint {
  day: string;
  avg_price: number;
  count: number;
}

async function getItemHistory(marketHashName: string): Promise<HistoryPoint[]> {
  try {
    const encoded = encodeURIComponent(marketHashName);
    const res = await fetch(
      `https://csfloat.com/api/v1/history/${encoded}/graph`,
      {
        next: { revalidate: 3600 },
        headers: { "User-Agent": "Mozilla/5.0" },
      }
    );
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data;
  } catch {
    return [];
  }
}

function getIconUrl(iconUrl: string) {
  return `https://community.akamai.steamstatic.com/economy/image/${iconUrl}/96fx96f`;
}

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

// Combine per-item histories into a single portfolio value time series.
// For each calendar day, sum each item's most recent known avg_price × amount.
function buildPortfolioHistory(
  itemHistories: { history: HistoryPoint[]; amount: number }[]
): { date: string; value: number }[] {
  // Collect all unique dates
  const allDates = new Set<string>();
  for (const { history } of itemHistories) {
    for (const point of history) {
      allDates.add(point.day);
    }
  }
  if (allDates.size === 0) return [];

  const sortedDates = [...allDates].sort();

  // Build a map of date → price for each item (forward-filled)
  const result: { date: string; value: number }[] = [];

  // Pre-sort each item's history ascending so forward-fill works correctly
  const sortedHistories = itemHistories.map(({ history, amount }) => ({
    history: [...history].sort((a, b) => (a.day < b.day ? -1 : 1)),
    amount,
  }));

  for (const date of sortedDates) {
    let total = 0;
    for (const { history, amount } of sortedHistories) {
      if (history.length === 0) continue;
      // Find the most recent price on or before this date
      let price = 0;
      for (const point of history) {
        if (point.day <= date) {
          price = point.avg_price;
        } else {
          break;
        }
      }
      total += price * amount;
    }
    result.push({ date, value: total });
  }

  // Remove leading zeroes (before any item had price data)
  const firstNonZero = result.findIndex((d) => d.value > 0);
  return firstNonZero >= 0 ? result.slice(firstNonZero) : [];
}

export default async function Home() {
  const [descriptions, priceMap] = await Promise.all([
    getInventory(),
    getPriceMap(),
  ]);

  const items: InventoryItem[] = descriptions.map((desc) => ({
    ...desc,
    price: priceMap.get(desc.market_hash_name) ?? null,
  }));

  const totalCents = items.reduce((sum, item) => sum + (item.price ?? 0), 0);

  const sorted = [...items].sort(
    (a, b) => (b.price ?? 0) - (a.price ?? 0)
  );

  // Fetch history for all marketable items, limit concurrency with batches of 10
  const marketableItems = items.filter((item) => item.price !== null);
  const batchSize = 10;
  const itemHistories: { history: HistoryPoint[]; amount: number }[] = [];

  for (let i = 0; i < marketableItems.length; i += batchSize) {
    const batch = marketableItems.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map((item) => getItemHistory(item.market_hash_name))
    );
    for (let j = 0; j < batch.length; j++) {
      itemHistories.push({ history: results[j], amount: batch[j].amount });
    }
  }

  const portfolioHistory = buildPortfolioHistory(itemHistories);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-8">
      <main className="mx-auto max-w-4xl">
        <div className="flex items-baseline justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-black dark:text-white mb-1">
              CS2 Inventory
            </h1>
            <p className="text-sm text-zinc-500">{items.length} items</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-zinc-500 uppercase tracking-wide mb-0.5">
              Total Value
            </p>
            <p className="text-2xl font-semibold text-emerald-500">
              {formatPrice(totalCents)}
            </p>
          </div>
        </div>

        <InventoryChart data={portfolioHistory} />

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {sorted.map((item) => (
            <div
              key={item.assetid}
              className="flex flex-col items-center gap-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getIconUrl(item.icon_url)}
                alt={item.name}
                width={64}
                height={64}
              />
              <span className="text-xs text-center text-zinc-700 dark:text-zinc-300 leading-tight">
                {item.market_hash_name}
              </span>
              {item.price !== null ? (
                <span className="text-xs font-medium text-emerald-500">
                  {formatPrice(item.price)}
                </span>
              ) : (
                <span className="text-xs text-zinc-400">—</span>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
