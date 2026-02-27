# Cloudflare Pages — Step-by-step setup

## 1. Where to go in the dashboard

1. Open: **https://dash.cloudflare.com**
2. In the left sidebar, click **Workers & Pages** (under "Build" or "Developer Platform").
3. Click **Create application** → **Pages** → **Connect to Git**.
4. Choose **GitHub**, authorize if asked, then select the repo: **ItsHussain007/Heits-loop-game**.

---

## 2. Build configuration (Set up builds and deployments)

On the **“Set up builds and deployments”** screen, use these exact values:

| Field | Value |
|-------|--------|
| **Project name** | (keep default, e.g. `Heits-loop-game`, or choose one) |
| **Production branch** | `main` |
| **Framework preset** | **None** — do not choose “Vite” or “Cloudflare”. |
| **Build command** | `npm run build` |
| **Build output directory** | `dist` |
| **Root directory** | Leave blank. |

Do **not** set any “Deploy command”. Use: `npx wrangler pages deploy dist --project-name=Heits-loop-game` (replace project name if different). Required when dashboard says deploy command is required.

Then click **Save and Deploy**.

---

## 3. If the project already exists and uses Wrangler

If you already created the project and it runs `npx wrangler deploy` (and fails):

1. Go to **Workers & Pages** → click your project (**Heits-loop-game** or whatever you named it).
2. Open **Settings** (top tab).
3. Scroll to **Build configuration** (or **Builds & deployments**).
4. Set **Framework preset** to **None**.
5. Set **Build command** to `npm run build`.
6. Set **Build output directory** to `dist`.
7. If you see **Deploy command**, clear it (leave it empty).
8. Save, then go to **Deployments**, open the **...** on the latest deployment, and click **Retry deployment**.

The repo now includes a **wrangler.toml** that tells Cloudflare to use the existing `dist` folder only (no extra Wrangler/Vite plugin step). After you push that file and retry, the deploy should succeed.

---

## 4. Environment variables (names and values)

In your project: **Settings** → **Environment variables** → **Add** (for **Production**; add for **Preview** too if you want).

Use these **variable names** and **values**:

| Variable name | Value |
|---------------|--------|
| `VITE_SUPABASE_URL` | `https://ifsnvixdqgtezbquawlz.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `sb_publishable_QS4UvQsvJxLDDVa09a4d3Q_wUiIAkB1` (or use your anon key from Supabase → Project Settings → API) |
| `VITE_SEASON_ID` | `s1` |
| `VITE_BUILD_ID` | `v1` |
| `VITE_TOTAL_LEVELS` | `3` |

Add each one, then **Save**. Redeploy (e.g. **Retry deployment**) so the build uses the new variables.

---

## 5. Your live URL

After a successful deploy, the site is at:

**https://&lt;your-project-name&gt;.pages.dev**

(e.g. **https://heits-loop-game.pages.dev** if the project name is `Heits-loop-game`).
