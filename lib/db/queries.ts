import { db } from "@/lib/db";
import { inventorySnapshots, portfolioInvestedHistory, itemBuyPrices } from "@/lib/db/schema";
import { and, asc, desc, eq, isNotNull, max, min, sql, sum } from "drizzle-orm";

export type InventoryRow = typeof inventorySnapshots.$inferSelect;

export interface PortfolioPoint {
  date: string;
  value: number;
}

// All items for the most recent snapshot date
export async function getLatestInventory(steamId: string): Promise<InventoryRow[]> {
  const latestDateSubquery = db
    .select({ maxDate: max(inventorySnapshots.snapshotDate) })
    .from(inventorySnapshots)
    .where(eq(inventorySnapshots.steamId, steamId));

  return db
    .select()
    .from(inventorySnapshots)
    .where(
      and(
        eq(inventorySnapshots.steamId, steamId),
        eq(inventorySnapshots.snapshotDate, sql`(${latestDateSubquery})`)
      )
    )
    .orderBy(desc(inventorySnapshots.priceCents));
}

// First seen date per assetid (date the item first appeared in a snapshot)
export async function getFirstSeenDates(steamId: string): Promise<Map<string, string>> {
  const rows = await db
    .select({
      assetid: inventorySnapshots.assetid,
      firstSeen: min(inventorySnapshots.snapshotDate),
    })
    .from(inventorySnapshots)
    .where(eq(inventorySnapshots.steamId, steamId))
    .groupBy(inventorySnapshots.assetid);

  return new Map(rows.map((r) => [r.assetid, r.firstSeen ?? ""]));
}

// Buy prices for all items (keyed by assetid)
export async function getBuyPrices(
  steamId: string
): Promise<Map<string, { buyCents: number; manuallySet: boolean }>> {
  const rows = await db
    .select()
    .from(itemBuyPrices)
    .where(eq(itemBuyPrices.steamId, steamId));

  return new Map(rows.map((r) => [r.assetid, { buyCents: r.buyCents, manuallySet: r.manuallySet }]));
}

// Invested value per day, ordered ASC
export async function getInvestedHistory(steamId: string): Promise<PortfolioPoint[]> {
  const rows = await db
    .select({
      date: portfolioInvestedHistory.snapshotDate,
      value: portfolioInvestedHistory.investedCents,
    })
    .from(portfolioInvestedHistory)
    .where(eq(portfolioInvestedHistory.steamId, steamId))
    .orderBy(asc(portfolioInvestedHistory.snapshotDate));

  return rows.map((r) => ({ date: r.date, value: r.value }));
}

// Portfolio value per day (SUM of priceCents * amount), ordered ASC
export async function getPortfolioHistory(steamId: string): Promise<PortfolioPoint[]> {
  const rows = await db
    .select({
      date: inventorySnapshots.snapshotDate,
      value: sum(sql<number>`${inventorySnapshots.priceCents} * ${inventorySnapshots.amount}`),
    })
    .from(inventorySnapshots)
    .where(
      and(
        eq(inventorySnapshots.steamId, steamId),
        isNotNull(inventorySnapshots.priceCents)
      )
    )
    .groupBy(inventorySnapshots.snapshotDate)
    .orderBy(inventorySnapshots.snapshotDate);

  return rows.map((r) => ({ date: r.date, value: Number(r.value ?? 0) }));
}
