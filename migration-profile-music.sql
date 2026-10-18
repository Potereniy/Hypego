CREATE TABLE IF NOT EXISTS profile_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(120) NOT NULL,
  artist VARCHAR(120) NOT NULL DEFAULT '',
  audio_url TEXT NOT NULL,
  cover_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS profile_tracks_user_order_idx
  ON profile_tracks(user_id, sort_order, created_at);
