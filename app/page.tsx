export const dynamic = "force-dynamic";

import InventoryChart from "./components/InventoryChart";
import { getLatestInventory, getPortfolioHistory } from "@/lib/db/queries";
import { STEAM_ID } from "@/lib/inventory";

function getIconUrl(iconUrl: string) {
  return `https://community.akamai.steamstatic.com/economy/image/${iconUrl}/96fx96f`;
}

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default async function Home() {
  const [items, portfolioHistory] = await Promise.all([
    getLatestInventory(STEAM_ID),
    getPortfolioHistory(STEAM_ID),
  ]);

  const totalCents = items.reduce((acc, item) => acc + (item.priceCents ?? 0) * item.amount, 0);

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
          {items.map((item) => (
            <div
              key={item.assetid}
              className="flex flex-col items-center gap-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getIconUrl(item.iconUrl)}
                alt={item.name}
                width={64}
                height={64}
              />
              <span className="text-xs text-center text-zinc-700 dark:text-zinc-300 leading-tight">
                {item.marketHashName}
              </span>
              {item.priceCents !== null ? (
                <span className="text-xs font-medium text-emerald-500">
                  {formatPrice(item.priceCents)}
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
