---
name: run-cron
description: Trigger the inventory-snapshot cron job locally.
disable-model-invocation: true
---

# Run the inventory snapshot cron locally

Invoke `GET /api/cron/inventory-snapshot` against a local dev server. It reads
`.env.local`, so it writes to the **live Neon database**, the same as the Vercel
cron would. The user asked for this by typing `/run-cron` — just do it.

## Do this

```bash
.claude/skills/run-cron/scripts/run-cron.sh
node --env-file=.env.local .claude/skills/run-cron/scripts/verify-snapshot.mjs
```

Then report: snapshot date, item count, invested total, and whether the row for
today's UTC date actually appeared in the verify output. Don't trust the HTTP 200
on its own.

## Reading the output

- **Dates are UTC.** `todayStr` comes from `toISOString()`, so late-evening runs in
  UTC+N land on the previous local day. This matches Vercel; don't "fix" it.
- **`{"status":"already_ran"}`** means it already ran today. That's the idempotency
  guard, not a failure. Re-run with `--force` only if the user asks.
- **`acquired` equal to the full item count means a gap in history**, not a shopping
  spree — the route diffs against yesterday, so a missing day makes every item read
  as new. Snapshot rows and invested total are still correct.
- **Items with no market price** are logged as warnings and stored with
  `price_cents = null`. Not an error.

## If it fails

The route catches everything and returns `{"error": ...}` with HTTP 500. The useful
detail is in the dev server's `[cron]` console logs, not the response body. Upstream
failures surface as `Steam inventory <status>` or `CSFloat price-list <status>` from
`lib/inventory.ts`.

Other flags: `--dry` fetches and computes but skips every DB write.

## Notes on the scripts

- Only one `next dev` can hold the `.next/dev` lock, so a second one dies. The script
  probes ports 3000–3010 for a server answering the route with **401** (proving it's
  this app and the auth check ran) and reuses it, only starting and cleaning up its
  own if none is found.
- `@neondatabase/serverless` is CommonJS — `import { neon }` fails from an ESM
  script, so the verify script goes through `createRequire`.
