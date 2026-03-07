import { NextRequest, NextResponse } from "next/server";
import { eq, and, count } from "drizzle-orm";
import { db } from "@/lib/db";
import { inventorySnapshots } from "@/lib/db/schema";
import { getInventory, getPriceMap, STEAM_ID } from "@/lib/inventory";

export async function GET(req: NextRequest) {
  // Auth check
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  try {
    // Idempotency guard
    const [{ value: existing }] = await db
      .select({ value: count() })
      .from(inventorySnapshots)
      .where(
        and(
          eq(inventorySnapshots.snapshotDate, todayStr),
          eq(inventorySnapshots.steamId, STEAM_ID)
        )
      );

    if (existing > 0) {
      return NextResponse.json({ status: "already_ran", date: todayStr });
    }

    // Fetch inventory + prices in parallel
    const [items, priceMap] = await Promise.all([
      getInventory(),
      getPriceMap().catch(() => new Map<string, number>()),
    ]);

    // Fetch yesterday's assetids for diff
    const yesterdayRows = await db
      .select({ assetid: inventorySnapshots.assetid })
      .from(inventorySnapshots)
      .where(
        and(
          eq(inventorySnapshots.snapshotDate, yesterdayStr),
          eq(inventorySnapshots.steamId, STEAM_ID)
        )
      );

    const yesterdaySet = new Set(yesterdayRows.map((r) => r.assetid));
    const todaySet = new Set(items.map((i) => i.assetid));

    const acquired = items.filter((i) => !yesterdaySet.has(i.assetid));
    const lostAssetIds = [...yesterdaySet].filter((id) => !todaySet.has(id));

    // Insert today's snapshot in batches of 100
    const rows = items.map((item) => ({
      snapshotDate: todayStr,
      steamId: STEAM_ID,
      assetid: item.assetid,
      classid: item.classid,
      instanceid: item.instanceid,
      name: item.name,
      marketHashName: item.market_hash_name,
      iconUrl: item.icon_url,
      tradable: item.tradable,
      marketable: item.marketable,
      amount: item.amount,
      priceCents: priceMap.get(item.market_hash_name) ?? null,
    }));

    const batchSize = 100;
    for (let i = 0; i < rows.length; i += batchSize) {
      await db
        .insert(inventorySnapshots)
        .values(rows.slice(i, i + batchSize))
        .onConflictDoNothing();
    }

    return NextResponse.json({
      date: todayStr,
      total: items.length,
      acquired: acquired.length,
      lost: lostAssetIds.length,
      acquiredItems: acquired.map((i) => i.market_hash_name),
      lostAssetIds,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
