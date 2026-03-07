CREATE TABLE "item_buy_prices" (
	"id" serial PRIMARY KEY NOT NULL,
	"steam_id" varchar(20) NOT NULL,
	"assetid" varchar(30) NOT NULL,
	"buy_cents" integer NOT NULL,
	"manually_set" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uq_buy_price_steam_asset" UNIQUE("steam_id","assetid")
);
--> statement-breakpoint
CREATE TABLE "portfolio_invested_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"steam_id" varchar(20) NOT NULL,
	"snapshot_date" date NOT NULL,
	"invested_cents" integer NOT NULL,
	CONSTRAINT "uq_invested_steam_date" UNIQUE("steam_id","snapshot_date")
);
