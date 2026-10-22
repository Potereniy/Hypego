BEGIN;

CREATE TABLE IF NOT EXISTS rcon_access (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  access_level SMALLINT NOT NULL CHECK (access_level BETWEEN 1 AND 5),
  granted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rcon_action_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  target_username TEXT,
  action TEXT NOT NULL,
  access_level SMALLINT NOT NULL CHECK (access_level BETWEEN 1 AND 5),
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  result TEXT NOT NULL DEFAULT 'blocked',
  connection_status TEXT NOT NULL DEFAULT 'not_configured',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS rcon_logs_created_at_idx
  ON rcon_action_logs (created_at DESC);

CREATE INDEX IF NOT EXISTS rcon_logs_actor_idx
  ON rcon_action_logs (actor_id, created_at DESC);

COMMIT;
