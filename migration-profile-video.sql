CREATE TABLE IF NOT EXISTS profile_video_settings (
  user_id TEXT PRIMARY KEY,
  mode TEXT NOT NULL DEFAULT 'off'
    CHECK (mode IN ('off', 'manual', 'auto')),
  selected_video_id TEXT,
  interval_seconds INTEGER NOT NULL DEFAULT 30
    CHECK (interval_seconds BETWEEN 10 AND 600),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
