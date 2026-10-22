ALTER TABLE global_chat_messages
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS global_chat_visible_created_idx
  ON global_chat_messages (created_at DESC)
  WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS global_chat_bans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason VARCHAR(500) NOT NULL,
  expires_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  revoked_by UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS global_chat_bans_user_idx
  ON global_chat_bans (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS global_chat_bans_active_idx
  ON global_chat_bans (user_id, expires_at)
  WHERE revoked_at IS NULL;

INSERT INTO permissions(id, description)
VALUES (
  'global_chat.moderate',
  'Удаление сообщений и блокировка игроков в глобальном чате'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO role_permissions(role_id, permission_id)
SELECT r.id, 'global_chat.moderate'
FROM roles r
WHERE r.id IN (
  'owner',
  'deputy',
  'management',
  'curator',
  'tech_admin',
  'support',
  'moderator',
  'trainee'
)
ON CONFLICT DO NOTHING;
