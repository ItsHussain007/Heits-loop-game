// GET /leaderboard?seasonId=&buildId=&page=0&pageSize=50

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const DEFAULT_PAGE = 0;
const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors() });
  }
  if (req.method !== 'GET') {
    return json({ error: 'Method not allowed' }, 405, cors());
  }

  const url = new URL(req.url);
  const seasonId = url.searchParams.get('seasonId')?.trim();
  const buildId = url.searchParams.get('buildId')?.trim();
  const page = Math.max(0, parseInt(url.searchParams.get('page') ?? String(DEFAULT_PAGE), 10));
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, parseInt(url.searchParams.get('pageSize') ?? String(DEFAULT_PAGE_SIZE), 10))
  );

  if (!seasonId || !buildId) {
    return json({ error: 'seasonId and buildId are required' }, 400, cors());
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const from = page * pageSize;
  const to = from + pageSize - 1;

  const { data: rows, error } = await supabase
    .from('leaderboard_best')
    .select('user_handle, best_time_ms')
    .eq('season_id', seasonId)
    .eq('build_id', buildId)
    .order('best_time_ms', { ascending: true })
    .range(from, to);

  if (error) {
    console.error(error);
    return json({ error: 'Failed to fetch leaderboard' }, 500, cors());
  }

  const list = (rows ?? []).map((r, i) => ({
    rank: from + i + 1,
    userHandle: r.user_handle,
    bestTimeMs: r.best_time_ms,
  }));

  return json({ list }, 200, cors());
});

function json(data: object, status: number, headers?: HeadersInit): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...flatHeaders(headers) },
  });
}

function cors(): HeadersInit {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

function flatHeaders(h?: HeadersInit): Record<string, string> {
  if (!h) return {};
  if (h instanceof Headers) return Object.fromEntries(h.entries());
  if (Array.isArray(h)) return Object.fromEntries(h);
  return h as Record<string, string>;
}
