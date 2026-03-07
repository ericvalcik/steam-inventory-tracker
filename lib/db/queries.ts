import { db } from "@/lib/db";
import { inventorySnapshots } from "@/lib/db/schema";
import { and, desc, eq, isNotNull, max, sql, sum } from "drizzle-orm";

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
