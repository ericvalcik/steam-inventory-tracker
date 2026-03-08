import {
  boolean,
  date,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";

export const inventorySnapshots = pgTable(
  "inventory_snapshots",
  {
    id: serial("id").primaryKey(),
    snapshotDate: date("snapshot_date").notNull(),
    steamId: varchar("steam_id", { length: 20 }).notNull(),
    assetid: varchar("assetid", { length: 30 }).notNull(),
    classid: varchar("classid", { length: 30 }).notNull(),
    instanceid: varchar("instanceid", { length: 30 }).notNull(),
    name: text("name").notNull(),
    marketHashName: text("market_hash_name").notNull(),
    iconUrl: text("icon_url").notNull(),
    tradable: integer("tradable").notNull(),
    marketable: integer("marketable").notNull(),
    amount: integer("amount").notNull(),
    priceCents: integer("price_cents"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    unique("uq_snapshot_steam_asset").on(
      table.snapshotDate,
      table.steamId,
      table.assetid
    ),
    index("idx_snapshots_date_steamid").on(table.snapshotDate, table.steamId),
  ]
);

export type InsertSnapshot = typeof inventorySnapshots.$inferInsert;
export type SelectSnapshot = typeof inventorySnapshots.$inferSelect;

export const itemBuyPrices = pgTable(
  "item_buy_prices",
  {
    id: serial("id").primaryKey(),
    steamId: varchar("steam_id", { length: 20 }).notNull(),
    assetid: varchar("assetid", { length: 30 }).notNull(),
    buyCents: integer("buy_cents").notNull(),
    manuallySet: boolean("manually_set").notNull().default(false),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    unique("uq_buy_price_steam_asset").on(table.steamId, table.assetid),
  ]
);


export const portfolioInvestedHistory = pgTable(
  "portfolio_invested_history",
  {
    id: serial("id").primaryKey(),
    steamId: varchar("steam_id", { length: 20 }).notNull(),
    snapshotDate: date("snapshot_date").notNull(),
    investedCents: integer("invested_cents").notNull(),
  },
  (table) => [
    unique("uq_invested_steam_date").on(table.steamId, table.snapshotDate),
  ]
);
