// POST /submit — validate run and upsert only if new time is faster.
// Body: { seasonId, buildId, userHandle, runTimeMs, levelsCompleted }

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// No time limit: accept any run that completes all levels

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors() });
  }
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405, cors());
  }

  let body: { seasonId?: string; buildId?: string; userHandle?: string; runTimeMs?: number; levelsCompleted?: number };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400, cors());
  }

  const { seasonId, buildId, userHandle, runTimeMs, levelsCompleted } = body;
  const totalLevels = parseInt(Deno.env.get('TOTAL_LEVELS') ?? '3', 10);

  if (
    typeof seasonId !== 'string' || !seasonId ||
    typeof buildId !== 'string' || !buildId ||
    typeof userHandle !== 'string' || !userHandle ||
    typeof runTimeMs !== 'number' || Number.isNaN(runTimeMs)
  ) {
    return json({ error: 'Missing or invalid seasonId, buildId, userHandle, runTimeMs' }, 400, cors());
  }
  if (levelsCompleted !== totalLevels) {
    return json({ error: `Only full runs accepted (levelsCompleted must be ${totalLevels})` }, 400, cors());
  }
  if (runTimeMs <= 0 || !Number.isFinite(runTimeMs)) {
    return json({ error: 'runTimeMs must be a positive number' }, 400, cors());
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const season_id = seasonId.trim();
  const build_id = buildId.trim();
  const user_handle = String(userHandle).trim().slice(0, 64);

  const { data: existing } = await supabase
    .from('leaderboard_best')
    .select('best_time_ms')
    .eq('season_id', season_id)
    .eq('build_id', build_id)
    .eq('user_handle', user_handle)
    .maybeSingle();

  const currentBest = existing?.best_time_ms;
  const shouldUpsert = currentBest == null || runTimeMs < currentBest;

  if (shouldUpsert) {
    const { error: upsertError } = await supabase
      .from('leaderboard_best')
      .upsert(
        {
          season_id,
          build_id,
          user_handle,
          best_time_ms: runTimeMs,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'season_id,build_id,user_handle' }
      );
    if (upsertError) {
      console.error(upsertError);
      return json({ error: 'Failed to save time' }, 500, cors());
    }
  }

  const bestTimeMs = shouldUpsert ? runTimeMs : currentBest!;

  const { data: allRows } = await supabase
    .from('leaderboard_best')
    .select('user_handle, best_time_ms')
    .eq('season_id', season_id)
    .eq('build_id', build_id)
    .order('best_time_ms', { ascending: true });

  const totalEntries = allRows?.length ?? 0;
  const rank = allRows?.findIndex((r) => r.user_handle === user_handle) + 1 ?? null;

  return json(
    { bestTimeMs, rank: rank > 0 ? rank : null, totalEntries },
    200,
    cors()
  );
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
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

function flatHeaders(h?: HeadersInit): Record<string, string> {
  if (!h) return {};
  if (h instanceof Headers) return Object.fromEntries(h.entries());
  if (Array.isArray(h)) return Object.fromEntries(h);
  return h as Record<string, string>;
}
