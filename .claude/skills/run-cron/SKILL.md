---
name: run-cron
description: Run the inventory-snapshot cron route locally against a dev server and confirm the rows landed in Neon. Use when the Vercel cron is blocked, failed, or was skipped, when a day is missing from the snapshot history, or when the user asks to run/trigger/backfill the inventory snapshot by hand.
---

# Run the inventory snapshot cron locally

`vercel.json` schedules `GET /api/cron/inventory-snapshot` daily at 02:00 UTC. When
Vercel doesn't run it, invoke the same route against a local dev server — it reads
`.env.local`, so it writes to the **live Neon database**, exactly as the deployed
cron would.

## Workflow

1. **Dry run first** — proves the Steam and CSFloat fetches work without writing:

   ```bash
   .claude/skills/run-cron/scripts/run-cron.sh --dry
   ```

2. **Real run** — tell the user this writes to production data before doing it:

   ```bash
   .claude/skills/run-cron/scripts/run-cron.sh
   ```

3. **Verify** the rows landed (don't trust the HTTP 200 alone):

   ```bash
   node --env-file=.env.local .claude/skills/run-cron/scripts/verify-snapshot.mjs
   ```

   Expect a row for today's UTC date in both `inventory_snapshots` and
   `portfolio_invested_history`.

4. **Report** the snapshot date, item count, invested total, and any history gaps
   the verify script prints.

## Flags

| Flag | Effect |
| --- | --- |
| `--dry` | Fetch and compute, skip every DB write |
| `--force` | Bypass the "already ran today" guard and re-insert (writes are `onConflictDoNothing`, so this is safe to repeat) |

Without `--force` a second run the same day returns `{"status":"already_ran"}` —
that's the idempotency guard, not a failure.

## Reading the output

- **Dates are UTC.** `todayStr` comes from `toISOString()`, so late-evening runs in
  UTC+N land on the previous local day. This matches Vercel; don't "fix" it.
- **`acquired` equal to the full item count means a gap, not a shopping spree.**
  The route diffs against *yesterday's* snapshot. If yesterday is missing, every
  item reads as newly acquired. The invested total and snapshot rows are still
  correct — only that one day's acquired/lost diff is meaningless.
- **Items with no market price** are logged as warnings by the route and stored
  with `price_cents = null`. Not an error.

## Gotchas the script already handles

- Only one `next dev` can hold the `.next/dev` lock, so a second one dies with
  "Unable to acquire lock". The script probes ports 3000–3010 for a server that
  answers the route with **401** (proving it's this app and the auth check ran)
  and reuses it; it only starts its own if none is found, and kills that one after.
- The route needs `Authorization: Bearer $CRON_SECRET`; the script pulls the value
  out of `.env.local`.
- `@neondatabase/serverless` is CommonJS — `import { neon }` fails from an ESM
  script. The verify script goes through `createRequire`.

## If the run itself fails

The route catches everything and returns `{"error": ...}` with HTTP 500. The
useful detail is in the dev server's `[cron]` console logs, not the response body.
Upstream failures (Steam inventory, CSFloat price list) surface as `Steam
inventory <status>` or `CSFloat price-list <status>` messages from `lib/inventory.ts`.
