CREATE TABLE IF NOT EXISTS global_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body VARCHAR(500) NOT NULL CHECK (length(trim(body)) BETWEEN 1 AND 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS global_chat_created_idx
  ON global_chat_messages (created_at DESC);

CREATE INDEX IF NOT EXISTS global_chat_user_created_idx
  ON global_chat_messages (user_id, created_at DESC);
