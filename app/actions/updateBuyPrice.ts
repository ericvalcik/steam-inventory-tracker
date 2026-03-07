"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { inventorySnapshots, itemBuyPrices, portfolioInvestedHistory } from "@/lib/db/schema";
import { STEAM_ID } from "@/lib/inventory";

export async function updateBuyPrice(assetid: string, buyCents: number) {
  // Upsert the buy price
  await db
    .insert(itemBuyPrices)
    .values({ steamId: STEAM_ID, assetid, buyCents, manuallySet: true })
    .onConflictDoUpdate({
      target: [itemBuyPrices.steamId, itemBuyPrices.assetid],
      set: { buyCents, manuallySet: true, updatedAt: new Date() },
    });

  // Find all dates where this asset appeared
  const affectedDates = await db
    .selectDistinct({ snapshotDate: inventorySnapshots.snapshotDate })
    .from(inventorySnapshots)
    .where(
      and(
        eq(inventorySnapshots.steamId, STEAM_ID),
        eq(inventorySnapshots.assetid, assetid)
      )
    );

  if (affectedDates.length > 0) {
    const dateList = affectedDates.map((r) => r.snapshotDate);

    // Recalculate invested total per affected date (JOIN with latest buy prices)
    const recalculated = await db
      .select({
        snapshotDate: inventorySnapshots.snapshotDate,
        investedCents: sql<number>`sum(coalesce(${itemBuyPrices.buyCents}, ${inventorySnapshots.priceCents}, 0) * ${inventorySnapshots.amount})`,
      })
      .from(inventorySnapshots)
      .leftJoin(
        itemBuyPrices,
        and(
          eq(itemBuyPrices.steamId, inventorySnapshots.steamId),
          eq(itemBuyPrices.assetid, inventorySnapshots.assetid)
        )
      )
      .where(
        and(
          eq(inventorySnapshots.steamId, STEAM_ID),
          inArray(inventorySnapshots.snapshotDate, dateList)
        )
      )
      .groupBy(inventorySnapshots.snapshotDate);

    // Upsert portfolioInvestedHistory for each affected date
    for (const row of recalculated) {
      await db
        .insert(portfolioInvestedHistory)
        .values({ steamId: STEAM_ID, snapshotDate: row.snapshotDate, investedCents: row.investedCents })
        .onConflictDoUpdate({
          target: [portfolioInvestedHistory.steamId, portfolioInvestedHistory.snapshotDate],
          set: { investedCents: row.investedCents },
        });
    }
  }

  revalidatePath("/");
}
