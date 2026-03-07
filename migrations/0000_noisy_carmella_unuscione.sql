CREATE TABLE "inventory_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"snapshot_date" date NOT NULL,
	"steam_id" varchar(20) NOT NULL,
	"assetid" varchar(30) NOT NULL,
	"classid" varchar(30) NOT NULL,
	"instanceid" varchar(30) NOT NULL,
	"name" text NOT NULL,
	"market_hash_name" text NOT NULL,
	"icon_url" text NOT NULL,
	"tradable" integer NOT NULL,
	"marketable" integer NOT NULL,
	"amount" integer NOT NULL,
	"price_cents" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uq_snapshot_steam_asset" UNIQUE("snapshot_date","steam_id","assetid")
);
--> statement-breakpoint
CREATE INDEX "idx_snapshots_date_steamid" ON "inventory_snapshots" USING btree ("snapshot_date","steam_id");