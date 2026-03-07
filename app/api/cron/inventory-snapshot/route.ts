import { NextRequest, NextResponse } from "next/server";
import { eq, and, count, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { inventorySnapshots, portfolioInvestedHistory, itemBuyPrices } from "@/lib/db/schema";
import { getInventory, getPriceMap, STEAM_ID } from "@/lib/inventory";

export async function GET(req: NextRequest) {
  // Auth check
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dry = req.nextUrl.searchParams.get("dry") === "true";
  const force = req.nextUrl.searchParams.get("force") === "true";
  const todayStr = new Date().toISOString().slice(0, 10);
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  try {
    // Idempotency guard (skipped in dry run or force mode)
    const [{ value: existing }] = dry || force
      ? [{ value: 0 }]
      : await db
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
      getPriceMap(),
    ]);

    // Fetch yesterday's assetids for acquired/lost diff
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

    // Auto-set buy prices for items that don't have a manually-set entry
    // (new items get today's price; existing non-manual entries also refresh)
    const buyPriceRows = await db
      .select()
      .from(itemBuyPrices)
      .where(eq(itemBuyPrices.steamId, STEAM_ID));

    const buyPriceByAssetid = new Map(buyPriceRows.map((r) => [r.assetid, r]));

    const autoPriceValues = items
      .filter((item) => {
        const existing = buyPriceByAssetid.get(item.assetid);
        return !existing || !existing.manuallySet;
      })
      .map((item) => ({
        steamId: STEAM_ID,
        assetid: item.assetid,
        buyCents: priceMap.get(item.market_hash_name) ?? 0,
        manuallySet: false,
      }));

    // Invested = sum of buy prices for all items currently owned
    const investedCents = items.reduce((acc, item) => {
      const entry = buyPriceByAssetid.get(item.assetid);
      const buyCents = entry?.buyCents ?? priceMap.get(item.market_hash_name) ?? 0;
      return acc + buyCents * item.amount;
    }, 0);

    if (!dry) {
      const batchSize = 100;
      for (let i = 0; i < rows.length; i += batchSize) {
        await db
          .insert(inventorySnapshots)
          .values(rows.slice(i, i + batchSize))
          .onConflictDoNothing();
      }

      // Upsert auto-priced items (skip if manually set)
      if (autoPriceValues.length > 0) {
        for (let i = 0; i < autoPriceValues.length; i += batchSize) {
          await db
            .insert(itemBuyPrices)
            .values(autoPriceValues.slice(i, i + batchSize))
            .onConflictDoUpdate({
              target: [itemBuyPrices.steamId, itemBuyPrices.assetid],
              set: { buyCents: sql`excluded.buy_cents`, manuallySet: false },
              setWhere: eq(itemBuyPrices.manuallySet, false),
            });
        }
      }

      await db
        .insert(portfolioInvestedHistory)
        .values({ steamId: STEAM_ID, snapshotDate: todayStr, investedCents })
        .onConflictDoNothing();
    }

    return NextResponse.json({
      dry,
      date: todayStr,
      total: items.length,
      acquired: acquired.length,
      lost: lostAssetIds.length,
      acquiredItems: acquired.map((i) => i.market_hash_name),
      lostAssetIds,
      investedCents,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
