// Build-time env (Vite). Only anon key in client; no service role.

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? '';
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';
export const SEASON_ID = import.meta.env.VITE_SEASON_ID ?? 's1';
export const BUILD_ID = import.meta.env.VITE_BUILD_ID ?? 'v1';
export const TOTAL_LEVELS = parseInt(import.meta.env.VITE_TOTAL_LEVELS ?? '12', 10) || 12;

export const LEADERBOARD_CACHE_MS = 60_000;
export const LEADERBOARD_PAGE_SIZE = 50;
