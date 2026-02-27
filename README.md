# Time-Loop Heist — Speedrun Leaderboard

Browser game with a **global speedrun leaderboard** (Cloudflare Pages + Supabase).

---

## Quick start (local)

```bash
npm install
cp .env.example .env   # fill VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm run dev
```

Open `http://localhost:3000`. Leaderboard works when Supabase URL is set; if not, you see "Leaderboard unavailable" and the game still runs.

---

## 1. Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. **SQL Editor** → run the migration:
   - Copy contents of `supabase/migrations/20250227000000_create_leaderboard_best.sql`
   - Execute in the SQL Editor.
3. **Edge Functions** → deploy the two functions:
   - `supabase/functions/submit` (POST `/submit`)
   - `supabase/functions/leaderboard` (GET `/leaderboard`)
   - With Supabase CLI: `supabase functions deploy submit` and `supabase functions deploy leaderboard`.
4. **Secrets** (Dashboard → Project Settings → Edge Functions, or CLI):
   - `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are usually set automatically.
   - Set **`TOTAL_LEVELS`** to the number of levels that count as a full run (e.g. `12`). Must match `VITE_TOTAL_LEVELS` in the frontend build.
5. In the frontend (and in Cloudflare env) use only:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **Anon (public) key** → `VITE_SUPABASE_ANON_KEY`  
   Do **not** put the service role key in the frontend.

---

## 2. Cloudflare Pages setup

1. Push the repo to GitHub.
2. In Cloudflare Dashboard: **Pages** → **Create project** → **Connect to Git** → select the repo.
3. **Build settings:**
   - Framework preset: **None**
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Node version: **18** (or 20).
4. **Environment variables** (Settings → Environment variables), for **Production** (and optionally Preview):

   | Name | Value |
   |------|--------|
   | `VITE_SUPABASE_URL` | `https://your-project.supabase.co` |
   | `VITE_SUPABASE_ANON_KEY` | Your anon key (not service role) |
   | `VITE_SEASON_ID` | `s1` |
   | `VITE_BUILD_ID` | `v1` |
   | `VITE_TOTAL_LEVELS` | `12` |

5. Save and deploy. Production URL will be like `https://your-project.pages.dev`.

---

## 3. How to bump season / build

- **New season** (e.g. yearly): set `VITE_SEASON_ID` to a new value (e.g. `s2`) in Cloudflare and redeploy. Old data stays under the previous `season_id`.
- **New build** (e.g. game update): set `VITE_BUILD_ID` to a new value (e.g. `v2`) and redeploy. Leaderboard is per `(season_id, build_id)`.
- Ensure Supabase Edge Function secret **`TOTAL_LEVELS`** matches `VITE_TOTAL_LEVELS` for the build (e.g. both `12`).

---

## 4. Testing checklist

- Submit multiple runs → only the best time is stored per user.
- Refresh page → leaderboard persists (data in Supabase).
- Pagination: leaderboard API supports `?page=0&pageSize=50`; test with 200+ entries.
- API failure: turn off network or use wrong URL → game remains playable, "Leaderboard unavailable" is shown.
- No secrets in client: build has no service role key; only anon key in env.

---

## 5. Production URL

After connecting the repo and setting env vars, the production URL is:

**`https://<your-pages-project>.pages.dev`**

(Replace with your actual Cloudflare Pages project name.)

---

## Project layout

- `supabase/migrations/` — SQL for `leaderboard_best` table.
- `supabase/functions/submit/` — POST submit run (validates, upsert if faster).
- `supabase/functions/leaderboard/` — GET paginated leaderboard.
- `src/config.ts` — reads `VITE_*` env.
- `src/services/leaderboard.ts` — API client, 60s cache for GET.
- `src/leaderboardUI.ts` — DOM + `window.leaderboard.submitRun` for post-run submit.
