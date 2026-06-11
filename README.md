# ⚽ WC26 Predictions

A small betting game for the 2026 World Cup. Players predict match scores and
earn points:

| Outcome | Points |
| --- | --- |
| Exact score (e.g. you said 2–1, it finished 2–1) | **3** |
| Correct goal difference (you said 2–0, it finished 3–1) | **2** |
| Correct winner / draw only | **1** |
| Miss | 0 |

The highest matching tier applies (an exact score is just 3, not 3+2+1).

**Two main screens:**
- **Matches** — every fixture by date, with kickoff time, live/final scores, and your pick.
- **Leaderboard** — everyone ranked by points.

Tap a match to place/edit your prediction (locked at kickoff). After kickoff you
see everyone's picks plus group stats (win %, average score, most common pick).
Tap a player to see how they're doing and which predictions they nailed.

**Anti-cheat:** other people's predictions are hidden — both in the UI *and* at
the database level (Row-Level Security) — until each match kicks off.

## Stack

- **Next.js 14** (App Router) + TypeScript + Tailwind
- **Supabase** — Postgres + magic-link auth (no passwords)
- **football-data.org** — fixtures & live results
- **Vercel** — hosting

Everything fits comfortably in the free tiers for ~30 players.

---

## Setup (about 20 minutes)

### 1. Supabase project

1. Create a free project at [supabase.com](https://supabase.com).
2. Open **SQL Editor → New query**, paste the contents of
   [`supabase/schema.sql`](supabase/schema.sql), and **Run**. This creates the
   tables, scoring function, leaderboard view, and all security policies.
3. Go to **Project Settings → API** and copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` *(secret — server only)*
4. Go to **Authentication → URL Configuration** and set:
   - **Site URL** to your deployed URL (e.g. `https://wc26.vercel.app`), or
     `http://localhost:3000` while developing.
   - Add both URLs under **Redirect URLs** as `<url>/auth/callback`.

> Magic-link emails: Supabase's built-in email works out of the box for low
> volume. For reliability you can later plug in a custom SMTP provider under
> **Authentication → Emails**.

### 2. football-data.org token

1. Register for a free token at
   [football-data.org/client/register](https://www.football-data.org/client/register).
2. That token → `FOOTBALL_DATA_TOKEN`.
3. The World Cup competition code is `WC` (already the default).

> The free tier is rate-limited (10 requests/min) — plenty, since we sync on a
> schedule rather than per page view.

### 3. Local env

```bash
cp .env.local.example .env.local   # then fill in the values
npm install
npm run dev                         # http://localhost:3000
```

Pick a long random string for `CRON_SECRET` — it protects the sync endpoint.

### 4. Load the fixtures

Once env vars are set, trigger the first sync to pull the schedule:

```bash
curl "http://localhost:3000/api/sync?secret=YOUR_CRON_SECRET"
```

You should get `{ "ok": true, "upserted": <n> }` and matches appear on the
Matches page.

---

## Deploy to Vercel

1. Push this folder to a GitHub repo.
2. **Import** it at [vercel.com/new](https://vercel.com/new).
3. Add all the env vars from `.env.local` in **Settings → Environment Variables**
   (including `CRON_SECRET`).
4. Deploy. Update the Supabase **Site URL / Redirect URLs** (step 1.4) to the
   real Vercel domain.

### Keeping scores up to date

`/api/sync` fetches fixtures + results and recomputes everyone's points.

- [`vercel.json`](vercel.json) registers a **daily** Vercel Cron at 06:00 UTC.
  Vercel automatically calls it with the `CRON_SECRET` as a bearer token.
- Vercel's free (Hobby) cron only runs **once a day**, which is too slow on
  match days. For near-live updates, add a free external cron to hit the
  endpoint every ~10 minutes during the tournament:

  At [cron-job.org](https://cron-job.org) (or a GitHub Action), schedule:
  ```
  GET https://YOUR-APP.vercel.app/api/sync?secret=YOUR_CRON_SECRET
  ```

You can always run that URL by hand to force an immediate refresh.

---

## How the pieces fit

| Path | What it is |
| --- | --- |
| `supabase/schema.sql` | DB tables, scoring (`recompute_points`), `leaderboard` view, `match_prediction_stats`, RLS policies, new-user trigger |
| `src/middleware.ts` | Refreshes the session; gates everything behind login |
| `src/lib/footballApi.ts` | football-data.org adapter (swap providers here) |
| `src/app/api/sync/route.ts` | Pulls fixtures/results, upserts, recomputes points |
| `src/app/actions.ts` | Server actions: magic link, save prediction, rename |
| `src/app/(app)/games` | Matches list + match detail (predict / stats / everyone's picks) |
| `src/app/(app)/leaderboard` | Standings |
| `src/app/(app)/users/[id]` | A player's record |

### Scoring lives in two places (kept in sync on purpose)
- **Authoritative:** `recompute_points()` in Postgres, run after every sync.
- **Display mirror:** `src/lib/scoring.ts` for the UI.

If you ever change the rules, update both.

## Editing fixtures / results by hand

Everything is just rows in Supabase. To correct a result the API got wrong,
edit the `matches` row (set `home_score`, `away_score`, `status = 'FINISHED'`)
in the Supabase Table Editor, then run `select recompute_points();` in the SQL
editor.
