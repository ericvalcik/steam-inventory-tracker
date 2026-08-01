// Show the most recent snapshot dates so a cron run can be confirmed as landed.
// Run from the repo root: node --env-file=.env.local <this file>
import { createRequire } from "node:module";
import { execSync } from "node:child_process";

const root = execSync("git rev-parse --show-toplevel").toString().trim();
const require = createRequire(`${root}/package.json`);
// @neondatabase/serverless is CJS — named ESM imports fail, so go through require.
const { neon } = require("@neondatabase/serverless");

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL not set — run with: node --env-file=.env.local");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

// snapshot_date is a DATE column; the driver hands back a Date at local
// midnight, so format from the local parts rather than toISOString().
const day = (d) =>
  d instanceof Date
    ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
    : String(d);

const snaps = await sql`
  SELECT snapshot_date, count(*)::int AS items
  FROM inventory_snapshots GROUP BY 1 ORDER BY 1 DESC LIMIT 10`;
const invested = await sql`
  SELECT snapshot_date, invested_cents
  FROM portfolio_invested_history ORDER BY 1 DESC LIMIT 10`;
const [prices] = await sql`
  SELECT count(*) FILTER (WHERE manually_set)::int AS manual,
         count(*) FILTER (WHERE NOT manually_set)::int AS auto
  FROM item_buy_prices`;

const investedBy = new Map(invested.map((r) => [day(r.snapshot_date), r.invested_cents]));

console.log("recent snapshots (newest first):");
for (const row of snaps) {
  const d = day(row.snapshot_date);
  const cents = investedBy.get(d);
  const money = cents == null ? "no invested row" : `$${(cents / 100).toFixed(2)}`;
  console.log(`  ${d}  ${String(row.items).padStart(4)} items  ${money}`);
}

// Gaps are the usual reason an acquired/lost diff looks wrong: the route diffs
// against yesterday, so a missing day makes every item read as newly acquired.
const dates = snaps.map((r) => day(r.snapshot_date));
const gaps = dates.slice(0, -1).filter((d, i) => {
  const prev = new Date(`${d}T00:00:00`); // local, to round-trip through day()
  prev.setDate(prev.getDate() - 1);
  return day(prev) !== dates[i + 1];
});
if (gaps.length) {
  console.log(`\ngaps: no snapshot the day before ${gaps.join(", ")}`);
}

console.log(`\nbuy prices: ${prices.manual} manual, ${prices.auto} auto`);
