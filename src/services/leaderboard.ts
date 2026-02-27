/**
 * Leaderboard API client. Never throws; never blocks gameplay.
 * Caches GET leaderboard for 60s.
 */

import {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  SEASON_ID,
  BUILD_ID,
  TOTAL_LEVELS,
  LEADERBOARD_CACHE_MS,
  LEADERBOARD_PAGE_SIZE,
} from '../config';

const FUNCTIONS = `${SUPABASE_URL}/functions/v1`;

function authHeaders(): HeadersInit {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (SUPABASE_ANON_KEY) h['Authorization'] = `Bearer ${SUPABASE_ANON_KEY}`;
  return h;
}

export type LeaderboardEntry = { rank: number; userHandle: string; bestTimeMs: number };

let cache: { list: LeaderboardEntry[]; page: number; ts: number } | null = null;

function isConfigured(): boolean {
  return Boolean(SUPABASE_URL);
}

/** Submit a full run. Only accepted if levelsCompleted === TOTAL_LEVELS and time in bounds. */
export async function submitScore(
  runTimeMs: number,
  levelsCompleted: number,
  userHandle: string
): Promise<
  { ok: true; bestTimeMs: number; rank: number | null; totalEntries: number } | { ok: false; error: string }
> {
  if (!isConfigured()) return { ok: false, error: 'Leaderboard not configured' };
  const handle = String(userHandle).trim().slice(0, 64) || 'Player';
  try {
    const res = await fetch(`${FUNCTIONS}/submit`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        seasonId: SEASON_ID,
        buildId: BUILD_ID,
        userHandle: handle,
        runTimeMs,
        levelsCompleted,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: data?.error ?? `HTTP ${res.status}` };
    }
    cache = null; // invalidate cache after submit
    return {
      ok: true,
      bestTimeMs: data.bestTimeMs ?? runTimeMs,
      rank: data.rank ?? null,
      totalEntries: data.totalEntries ?? 0,
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Network error' };
  }
}

/** Fetch leaderboard page. Cached 60s per (page). */
export async function getLeaderboard(
  page: number = 0,
  pageSize: number = LEADERBOARD_PAGE_SIZE
): Promise<
  { ok: true; list: LeaderboardEntry[] } | { ok: false; error: string }
> {
  if (!isConfigured()) return { ok: false, error: 'Leaderboard not configured' };
  const now = Date.now();
  if (cache && cache.page === page && now - cache.ts < LEADERBOARD_CACHE_MS) {
    return { ok: true, list: cache.list };
  }
  try {
    const params = new URLSearchParams({
      seasonId: SEASON_ID,
      buildId: BUILD_ID,
      page: String(page),
      pageSize: String(pageSize),
    });
    const res = await fetch(`${FUNCTIONS}/leaderboard?${params}`, { headers: authHeaders() });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: data?.error ?? `HTTP ${res.status}` };
    }
    const list = Array.isArray(data?.list) ? data.list : [];
    cache = { list, page, ts: now };
    return { ok: true, list };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Network error' };
  }
}

export { SEASON_ID, BUILD_ID, TOTAL_LEVELS };
