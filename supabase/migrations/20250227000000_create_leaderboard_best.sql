-- Leaderboard: one best time per (season, build, user).
-- Bounds: 30s min, 1h max (enforced in app/edge function).

CREATE TABLE IF NOT EXISTS leaderboard_best (
  season_id TEXT NOT NULL,
  build_id TEXT NOT NULL,
  user_handle TEXT NOT NULL,
  best_time_ms INTEGER NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (season_id, build_id, user_handle),
  CONSTRAINT chk_best_time_bounds CHECK (
    best_time_ms >= 30000 AND best_time_ms <= 3600000
  )
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_best_ranking
  ON leaderboard_best (season_id, build_id, best_time_ms);

COMMENT ON TABLE leaderboard_best IS 'Global speedrun leaderboard; one row per (season, build, user).';
