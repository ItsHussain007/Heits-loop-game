-- Allow any positive run time (no min/max limit).
ALTER TABLE leaderboard_best DROP CONSTRAINT IF EXISTS chk_best_time_bounds;
ALTER TABLE leaderboard_best ADD CONSTRAINT chk_best_time_bounds CHECK (best_time_ms > 0);
