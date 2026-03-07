export const dynamic = "force-dynamic";

import InventoryChart from "./components/InventoryChart";
import BuyPriceInput from "./components/BuyPriceInput";
import {
  getLatestInventory,
  getPortfolioHistory,
  getFirstSeenDates,
  getInvestedHistory,
  getBuyPrices,
} from "@/lib/db/queries";
import { STEAM_ID } from "@/lib/inventory";

function getIconUrl(iconUrl: string) {
  return `https://community.akamai.steamstatic.com/economy/image/${iconUrl}/96fx96f`;
}

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default async function Home() {
  const [items, portfolioHistory, investedHistory, firstSeenDates, buyPrices] =
    await Promise.all([
      getLatestInventory(STEAM_ID),
      getPortfolioHistory(STEAM_ID),
      getInvestedHistory(STEAM_ID),
      getFirstSeenDates(STEAM_ID),
      getBuyPrices(STEAM_ID),
    ]);

  const pricedItems = items.filter((item) => item.priceCents !== null);

  const investedByDate = new Map(investedHistory.map((p) => [p.date, p.value]));
  const chartData = portfolioHistory.map((p) => ({
    date: p.date,
    value: p.value,
    invested: investedByDate.get(p.date),
  }));

  const totalCents = items.reduce(
    (acc, item) => acc + (item.priceCents ?? 0) * item.amount,
    0,
  );

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 md:p-8 px-4 py-8">
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

        <InventoryChart data={chartData} />

        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900">
                <th className="text-left px-4 py-2 font-medium text-zinc-500">
                  Item
                </th>
                <th className="text-left px-4 py-2 font-medium text-zinc-500">
                  Date Added
                </th>
                <th className="text-right px-4 py-2 font-medium text-zinc-500">
                  Buy Price
                </th>
                <th className="text-right px-4 py-2 font-medium text-zinc-500">
                  Market Price
                </th>
              </tr>
            </thead>
            <tbody>
              {pricedItems.map((item, i) => {
                const buyEntry = buyPrices.get(item.assetid);
                const buyInitialCents =
                  buyEntry?.buyCents ?? item.priceCents ?? 0;
                const isManuallySet = buyEntry?.manuallySet ?? false;
                return (
                  <tr
                    key={item.assetid}
                    className={`border-b border-zinc-100 dark:border-zinc-800/50 last:border-0 ${
                      i % 2 === 0
                        ? "bg-white dark:bg-zinc-950"
                        : "bg-zinc-50 dark:bg-zinc-900/50"
                    }`}
                  >
                    <td className="px-4 py-2 flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={getIconUrl(item.iconUrl)}
                        alt={item.name}
                        width={32}
                        height={32}
                        className="shrink-0"
                      />
                      <span className="text-zinc-700 dark:text-zinc-300">
                        {item.marketHashName}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-zinc-500">
                      {firstSeenDates.get(item.assetid) ?? "—"}
                    </td>
                    <td className="px-4 py-2">
                      <BuyPriceInput
                        assetid={item.assetid}
                        initialCents={buyInitialCents}
                        manuallySet={isManuallySet}
                      />
                    </td>
                    <td className="px-4 py-2 text-right font-medium text-emerald-500">
                      {formatPrice(item.priceCents!)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
